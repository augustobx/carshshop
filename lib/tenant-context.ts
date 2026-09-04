import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

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

/**
 * Normaliza un hostname eliminando puertos y pasando a minúsculas.
 */
export function normalizeHostname(host: string | null | undefined): string {
  if (!host) return "";
  return host.split(":")[0].trim().toLowerCase();
}

/**
 * Extrae el slug de un subdominio conocido:
 * ej: demo.onlycars.nanoapps.ar -> demo
 * ej: demo.localhost -> demo
 */
export function extractSubdomainSlug(
  hostname: string,
  baseDomain = process.env.BASE_DOMAIN || "onlycars.nanoapps.ar"
): string | null {
  const cleanHost = normalizeHostname(hostname);
  if (!cleanHost) return null;

  // Desarrollo local (ej: demo.localhost)
  if (cleanHost.endsWith(".localhost")) {
    const parts = cleanHost.split(".");
    return parts.length === 2 && parts[0] ? parts[0] : null;
  }

  // Dominio base de plataforma NanoLabs (ej: demo.onlycars.nanoapps.ar)
  const normalizedBase = normalizeHostname(baseDomain);
  if (cleanHost.endsWith(`.${normalizedBase}`)) {
    const prefix = cleanHost.slice(0, -(normalizedBase.length + 1));
    const parts = prefix.split(".");
    return parts[parts.length - 1] || null;
  }

  return null;
}

/**
 * Resuelve el Tenant de forma autoritativa en el servidor a partir del hostname.
 */
export async function resolveTenantByHostname(hostname: string): Promise<TenantResolutionResult> {
  const cleanHost = normalizeHostname(hostname);
  if (!cleanHost || cleanHost.length > 253) {
    return { success: false, reason: "INVALID_HOSTNAME", message: "Hostname inválido." };
  }

  try {
    // 1. Buscar coincidencia exacta en TenantDomain (dominios propios verificados o subdominios explícitos)
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

    // 2. Si no hubo coincidencia exacta, extraer subdominio slug
    if (!tenantData) {
      const isLocalHost = cleanHost === "localhost" || cleanHost === "127.0.0.1" || cleanHost.endsWith(".localhost");
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

    // 3. Fallback seguro en desarrollo para "localhost" o "127.0.0.1" -> tenant "demo"
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

    // 4. Validar estado de suspensión del tenant
    const subscription = tenantData.subscription;
    const now = new Date();
    const isExpired = Boolean(
      subscription &&
      ((subscription.status === "TRIAL" && subscription.trialEndsAt && subscription.trialEndsAt <= now) ||
        (subscription.status === "ACTIVE" && subscription.currentPeriodEnd <= now))
    );

    const isSuspended =
      ["SUSPENDED", "CANCELLED", "PAST_DUE"].includes(tenantData.status) ||
      !subscription ||
      ["SUSPENDED", "CANCELED", "PAST_DUE"].includes(subscription.status) ||
      isExpired;

    if (isSuspended) {
      return {
        success: false,
        reason: "SUSPENDED",
        message: "Esta concesionaria se encuentra temporalmente inactiva o suspendida.",
      };
    }

    // 5. Mapeo de plan y características activas
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

/**
 * Resuelve el TenantContext actual a partir de los headers HTTP en Next.js Server Components / Actions.
 */
export async function getTenantContext(): Promise<ResolvedTenant> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    (process.env.NODE_ENV !== "production" ? requestHeaders.get("x-tenant-host") : null) ||
    "localhost";

  const result = await resolveTenantByHostname(host);
  if (!result.success) {
    throw new Error(`TENANT_RESOLUTION_FAILED:${result.reason}:${result.message}`);
  }

  return result.tenant;
}
