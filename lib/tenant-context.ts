import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPlatformHost, getTenantBaseDomain, isPlatformHostname } from "@/lib/domain-config";

export type TenantStatus = "ACTIVE" | "TRIAL" | "SUSPENDED" | "PAST_DUE" | "CANCELED";

export interface ResolvedTenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  isSuspended: boolean;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  cuit?: string | null;
  plan: {
    code: string;
    name: string;
    maxVehicles: number;
    maxLocations: number;
    maxUsers: number;
    features: string[];
  };
  features: Set<string>;
  settings?: {
    appName: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    dolarActual: number;
    tipoDolar: string;
    tnaFinanciacion: number;
    comisionVentaDefecto: number;
    telefonoContacto: string | null;
    emailContacto: string | null;
    whatsappLead: string | null;
  } | null;
  primaryLocationId?: string;
}

export type TenantResolutionResult =
  | { success: true; tenant: ResolvedTenant }
  | { success: false; reason: "NOT_FOUND" | "SUSPENDED" | "INVALID_HOSTNAME" | "INTERNAL_ERROR"; message: string };

export function normalizeHostname(host: string | null | undefined): string {
  if (!host) return "";
  return host.split(":")[0].trim().toLowerCase();
}

/**
 * Extrae el slug desde el esquema SaaS de NanoLabs:
 * demo.nanoapps.ar -> demo
 * demo.localhost -> demo
 * onlycars.nanoapps.ar -> null (host reservado de plataforma)
 */
export function extractSubdomainSlug(
  hostname: string,
  baseDomain = getTenantBaseDomain()
): string | null {
  const cleanHost = normalizeHostname(hostname);
  if (!cleanHost || isPlatformHostname(cleanHost)) return null;

  if (cleanHost.endsWith(".localhost")) {
    const parts = cleanHost.split(".");
    return parts.length === 2 && parts[0] ? parts[0] : null;
  }

  const normalizedBase = normalizeHostname(baseDomain);
  if (cleanHost.endsWith(`.${normalizedBase}`)) {
    const prefix = cleanHost.slice(0, -(normalizedBase.length + 1));
    if (!prefix || prefix.includes(".")) return null;
    return prefix;
  }

  return null;
}

export async function resolveTenantByHostname(hostname: string): Promise<TenantResolutionResult> {
  const cleanHost = normalizeHostname(hostname);
  if (!cleanHost || cleanHost.length > 253) {
    return { success: false, reason: "INVALID_HOSTNAME", message: "Hostname inválido." };
  }

  if (cleanHost === getPlatformHost()) {
    return {
      success: false,
      reason: "NOT_FOUND",
      message: "El host solicitado corresponde a la plataforma OnlyCars y no a una concesionaria.",
    };
  }

  try {
    const domainRecord = await prisma.tenantDomain.findFirst({
      where: {
        hostname: cleanHost,
        OR: [{ isCustom: false }, { verifiedAt: { not: null } }],
      },
      include: {
        tenant: {
          include: {
            subscription: { include: { plan: true } },
            features: true,
            settings: true,
            locations: { where: { isMain: true }, take: 1 },
          },
        },
      },
    });

    let tenantData = domainRecord?.tenant;

    if (!tenantData) {
      const slugCandidate = extractSubdomainSlug(cleanHost);
      if (slugCandidate) {
        tenantData = (await prisma.tenant.findUnique({
          where: { slug: slugCandidate },
          include: {
            subscription: { include: { plan: true } },
            features: true,
            settings: true,
            locations: { where: { isMain: true }, take: 1 },
          },
        })) || undefined;
      }
    }

    if (!tenantData && (cleanHost === "localhost" || cleanHost === "127.0.0.1" || cleanHost === "::1")) {
      tenantData = (await prisma.tenant.findUnique({
        where: { slug: "demo" },
        include: {
          subscription: { include: { plan: true } },
          features: true,
          settings: true,
          locations: { where: { isMain: true }, take: 1 },
        },
      })) || (await prisma.tenant.findFirst({
        include: {
          subscription: { include: { plan: true } },
          features: true,
          settings: true,
          locations: { where: { isMain: true }, take: 1 },
        },
      })) || undefined;
    }

    if (!tenantData) {
      return { success: false, reason: "NOT_FOUND", message: `No se encontró concesionaria registrada para ${cleanHost}.` };
    }

    const subscription = tenantData.subscription;
    const now = new Date();
    const isExpired = Boolean(
      subscription &&
      ((subscription.status === "TRIAL" &&
        ((subscription.trialEndsAt && subscription.trialEndsAt <= now) ||
          (!subscription.trialEndsAt && subscription.currentPeriodEnd <= now))) ||
        (subscription.status === "ACTIVE" && subscription.currentPeriodEnd <= now))
    );

    // El vencimiento se evalúa en cada request para cubrir también sesiones ya iniciadas.
    // Además se persiste el estado para que el Control Plane refleje la suspensión sin depender del login.
    if (isExpired && subscription) {
      try {
        await prisma.$transaction([
          prisma.subscription.updateMany({
            where: { id: subscription.id, status: { in: ["ACTIVE", "TRIAL"] } },
            data: { status: "PAST_DUE" },
          }),
          prisma.tenant.updateMany({
            where: { id: tenantData.id, status: { notIn: ["CANCELED", "CANCELLED"] } },
            data: { status: "SUSPENDED" },
          }),
        ]);
      } catch (error) {
        console.error("[Tenant Membership Expiry Persist Error]:", error);
      }
    }

    const isSuspended =
      ["SUSPENDED", "CANCELED", "CANCELLED", "PAST_DUE"].includes(tenantData.status) ||
      !subscription ||
      ["SUSPENDED", "CANCELED", "CANCELLED", "PAST_DUE"].includes(subscription.status) ||
      isExpired;

    if (isSuspended) {
      return {
        success: false,
        reason: "SUSPENDED",
        message: "Esta concesionaria se encuentra temporalmente inactiva o suspendida.",
      };
    }

    const plan = tenantData.subscription?.plan;
    const planFeatures: string[] = Array.isArray(plan?.features) ? (plan?.features as string[]) : [];
    const enabledFeatures = tenantData.features.filter((f) => f.isEnabled).map((f) => f.featureKey);
    const disabledFeatures = new Set(tenantData.features.filter((f) => !f.isEnabled).map((f) => f.featureKey));
    const combinedFeatures = new Set<string>(
      [...planFeatures, ...enabledFeatures].filter((f) => !disabledFeatures.has(f))
    );

    const resolved: ResolvedTenant = {
      id: tenantData.id,
      slug: tenantData.slug,
      name: tenantData.name,
      status: (tenantData.status as TenantStatus) || "ACTIVE",
      isSuspended: false,
      email: tenantData.email,
      phone: tenantData.phone,
      address: tenantData.address,
      city: tenantData.city,
      cuit: tenantData.cuit,
      plan: {
        code: plan?.code || "STARTER",
        name: plan?.name || "Plan Inicial",
        maxVehicles: plan?.maxVehicles || 50,
        maxLocations: plan?.maxLocations || 1,
        maxUsers: plan?.maxUsers || 5,
        features: Array.from(combinedFeatures),
      },
      features: combinedFeatures,
      settings: tenantData.settings
        ? {
            appName: tenantData.settings.appName,
            logoUrl: tenantData.settings.logoUrl,
            primaryColor: tenantData.settings.primaryColor,
            secondaryColor: tenantData.settings.secondaryColor,
            dolarActual: tenantData.settings.dolarActual,
            tipoDolar: tenantData.settings.tipoDolar,
            tnaFinanciacion: tenantData.settings.tnaFinanciacion,
            comisionVentaDefecto: tenantData.settings.comisionVentaDefecto,
            telefonoContacto: tenantData.settings.telefonoContacto,
            emailContacto: tenantData.settings.emailContacto,
            whatsappLead: tenantData.settings.whatsappLead,
          }
        : null,
      primaryLocationId: tenantData.locations[0]?.id,
    };

    return { success: true, tenant: resolved };
  } catch (error) {
    console.error("[Tenant Resolution Error]:", error);
    return { success: false, reason: "INTERNAL_ERROR", message: "Error resolviendo la concesionaria." };
  }
}

export async function getTenantContext(): Promise<ResolvedTenant> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("x-tenant-host") ||
    requestHeaders.get("host") ||
    "localhost";

  const result = await resolveTenantByHostname(host);
  if (!result.success) {
    throw new Error(`TENANT_RESOLUTION_FAILED:${result.reason}:${result.message}`);
  }

  return result.tenant;
}
