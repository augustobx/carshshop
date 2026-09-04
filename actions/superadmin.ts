'use server';

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, hashUserPassword } from '@/lib/user-auth';
import { buildTenantHostname, getPlatformHost, getTenantBaseDomain } from '@/lib/domain-config';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

export type SaaSStatus = 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELED';

function normalizeFeatures(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function parseDateInput(value?: string | null, endOfDay = false): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addOneMonth(from: Date) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function revalidateSuperAdmin(tenantId?: string) {
  revalidatePath('/superadmin');
  revalidatePath('/superadmin/tenants');
  revalidatePath('/superadmin/planes');
  if (tenantId) revalidatePath(`/superadmin/tenants/${tenantId}`);
}

async function syncExpiredSubscriptions() {
  const now = new Date();
  const expired = await prisma.subscription.findMany({
    where: {
      OR: [
        { status: 'ACTIVE', currentPeriodEnd: { lte: now } },
        { status: 'TRIAL', trialEndsAt: { lte: now } },
        { status: 'TRIAL', trialEndsAt: null, currentPeriodEnd: { lte: now } },
      ],
    },
    select: { id: true, tenantId: true },
  });

  if (!expired.length) return 0;

  const subscriptionIds = expired.map((item) => item.id);
  const tenantIds = expired.map((item) => item.tenantId);

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { id: { in: subscriptionIds } },
      data: { status: 'PAST_DUE' },
    }),
    prisma.tenant.updateMany({
      where: {
        id: { in: tenantIds },
        status: { notIn: ['CANCELED', 'CANCELLED'] },
      },
      data: { status: 'SUSPENDED' },
    }),
  ]);

  return expired.length;
}

export async function getSuperAdminDashboardAction() {
  await requireSuperAdmin();
  await syncExpiredSubscriptions();

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 14);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [tenants, plans, totalVehicles, totalSales, paidLast30Days] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        domains: true,
        subscription: { include: { plan: true } },
        _count: { select: { vehiculos: true, ventas: true, memberships: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
      include: { _count: { select: { subscriptions: true } } },
    }),
    prisma.vehiculo.count(),
    prisma.venta.count(),
    prisma.saaSPayment.aggregate({
      where: { status: 'PAID', paidAt: { gte: monthAgo } },
      _sum: { amount: true },
    }),
  ]);

  const statusCount = (statuses: string[]) => tenants.filter((tenant) => statuses.includes(tenant.status)).length;
  const mrrProjected = tenants.reduce((total, tenant) => {
    if (!tenant.subscription || !['ACTIVE', 'TRIAL'].includes(tenant.subscription.status)) return total;
    if (!['ACTIVE', 'TRIAL'].includes(tenant.status)) return total;
    return total + Number(tenant.subscription.plan.priceMonthly || 0);
  }, 0);

  const upcomingExpirations = tenants
    .map((tenant) => {
      const subscription = tenant.subscription;
      if (!subscription || !['ACTIVE', 'TRIAL'].includes(subscription.status)) return null;
      const expiresAt = subscription.status === 'TRIAL' && subscription.trialEndsAt
        ? subscription.trialEndsAt
        : subscription.currentPeriodEnd;
      if (expiresAt < now || expiresAt > windowEnd) return null;
      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        subscriptionStatus: subscription.status,
        planName: subscription.plan.name,
        expiresAt,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.expiresAt.getTime() - b.expiresAt.getTime());

  return {
    success: true,
    stats: {
      totalTenants: tenants.length,
      activeTenants: statusCount(['ACTIVE']),
      trialTenants: statusCount(['TRIAL']),
      suspendedTenants: statusCount(['SUSPENDED', 'PAST_DUE']),
      canceledTenants: statusCount(['CANCELED', 'CANCELLED']),
      mrrProjected,
      paidLast30Days: Number(paidLast30Days._sum.amount || 0),
      totalVehicles,
      totalSales,
    },
    recentTenants: tenants.slice(0, 8),
    upcomingExpirations,
    plans,
    tenantBaseDomain: getTenantBaseDomain(),
    platformHost: getPlatformHost(),
  };
}

export async function getTenantsAction() {
  await requireSuperAdmin();
  await syncExpiredSubscriptions();

  const [tenants, plans] = await Promise.all([
    prisma.tenant.findMany({
      include: {
        domains: true,
        subscription: { include: { plan: true } },
        _count: {
          select: {
            vehiculos: true,
            ventas: true,
            memberships: true,
            locations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: 'asc' } }),
  ]);

  return {
    success: true,
    tenants,
    plans,
    tenantBaseDomain: getTenantBaseDomain(),
  };
}

export async function getTenantDetailAction(tenantId: string) {
  await requireSuperAdmin();
  await syncExpiredSubscriptions();

  const [tenant, plans] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        domains: { orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
        subscription: {
          include: {
            plan: true,
            payments: { orderBy: { createdAt: 'desc' }, take: 24 },
          },
        },
        memberships: {
          include: { user: true, location: true },
          orderBy: { createdAt: 'asc' },
        },
        locations: { orderBy: [{ isMain: 'desc' }, { name: 'asc' }] },
        _count: {
          select: {
            vehiculos: true,
            ventas: true,
            clientes: true,
            gastos: true,
            memberships: true,
            locations: true,
          },
        },
      },
    }),
    prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } }),
  ]);

  return {
    success: true,
    tenant,
    plans,
    tenantBaseDomain: getTenantBaseDomain(),
  };
}

export async function getPlansAction() {
  await requireSuperAdmin();

  const plans = await prisma.plan.findMany({
    orderBy: { priceMonthly: 'asc' },
    include: { _count: { select: { subscriptions: true } } },
  });

  return { success: true, plans };
}

export async function createTenantAction(data: {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  cuit?: string;
  planCode: string;
  status?: 'ACTIVE' | 'TRIAL';
  periodStart?: string;
  periodEnd?: string;
  trialEndsAt?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}) {
  const superAdmin = await requireSuperAdmin();

  try {
    const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const cleanEmail = data.adminEmail.trim().toLowerCase();
    const cleanPassword = data.adminPassword || '';

    if (!cleanSlug || cleanSlug.startsWith('-') || cleanSlug.endsWith('-')) {
      return { success: false, error: 'El slug es inválido.' };
    }
    if (!data.name.trim() || !data.adminName.trim() || !cleanEmail) {
      return { success: false, error: 'Completá nombre de la concesionaria y datos del administrador.' };
    }
    if (cleanPassword.length < 8) {
      return { success: false, error: 'La contraseña inicial debe tener al menos 8 caracteres.' };
    }

    const hostname = buildTenantHostname(cleanSlug);
    if (hostname === getPlatformHost()) {
      return { success: false, error: 'Ese slug está reservado para la plataforma OnlyCars.' };
    }

    const [existing, existingDomain, plan] = await Promise.all([
      prisma.tenant.findUnique({ where: { slug: cleanSlug } }),
      prisma.tenantDomain.findUnique({ where: { hostname } }),
      prisma.plan.findUnique({ where: { code: data.planCode } }),
    ]);

    if (existing) return { success: false, error: `El slug "${cleanSlug}" ya está en uso.` };
    if (existingDomain) return { success: false, error: `El dominio "${hostname}" ya está en uso.` };
    if (!plan || !plan.isActive) return { success: false, error: 'El plan seleccionado no existe o está inactivo.' };

    const status = data.status === 'TRIAL' ? 'TRIAL' : 'ACTIVE';
    const periodStart = parseDateInput(data.periodStart) || new Date();
    const periodEnd = parseDateInput(data.periodEnd, true) || addOneMonth(periodStart);
    const trialEndsAt = status === 'TRIAL'
      ? parseDateInput(data.trialEndsAt, true) || periodEnd
      : null;

    if (periodEnd <= periodStart) {
      return { success: false, error: 'La fecha de vencimiento debe ser posterior a la fecha de alta.' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name.trim(),
          slug: cleanSlug,
          email: data.email?.trim() || cleanEmail,
          phone: data.phone?.trim() || null,
          address: data.address?.trim() || null,
          city: data.city?.trim() || null,
          cuit: data.cuit?.trim() || null,
          status,
        },
      });

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status,
          trialEndsAt,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });

      await tx.tenantDomain.create({
        data: {
          tenantId: tenant.id,
          hostname,
          isPrimary: true,
          isCustom: false,
        },
      });

      const location = await tx.location.create({
        data: {
          tenantId: tenant.id,
          name: 'Casa Central',
          code: 'central',
          address: data.address?.trim() || null,
          phone: data.phone?.trim() || null,
          isMain: true,
          isActive: true,
        },
      });

      await tx.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          appName: data.name.trim(),
          primaryColor: '#2563eb',
          secondaryColor: '#0f172a',
          dolarActual: 1400,
          cuit: data.cuit?.trim() || null,
          razonSocial: data.name.trim(),
          direccion: data.address?.trim() || null,
          telefonoContacto: data.phone?.trim() || null,
          emailContacto: data.email?.trim() || cleanEmail,
        },
      });

      let user = await tx.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: cleanEmail,
            name: data.adminName.trim(),
            passwordHash: await hashUserPassword(cleanPassword),
            isSuperAdmin: false,
          },
        });
      }

      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: RolMembresia.OWNER,
          locationId: location.id,
        },
      });

      await tx.platformAuditLog.create({
        data: {
          tenantId: tenant.id,
          userId: superAdmin.id,
          action: 'TENANT_CREATED',
          resource: 'Tenant',
          details: {
            name: tenant.name,
            slug: tenant.slug,
            hostname,
            plan: plan.code,
            status,
            currentPeriodEnd: periodEnd.toISOString(),
          },
        },
      });

      return tenant;
    });

    revalidateSuperAdmin(result.id);
    return { success: true, tenant: result, hostname };
  } catch (error: any) {
    console.error('Error creando tenant:', error);
    return { success: false, error: error?.message || 'Ocurrió un error al crear la concesionaria.' };
  }
}

export async function updateTenantAction(tenantId: string, data: {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  cuit?: string | null;
  status?: SaaSStatus;
  planId?: string;
  periodStart?: string;
  periodEnd?: string;
  trialEndsAt?: string | null;
}) {
  const superAdmin = await requireSuperAdmin();

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });
    if (!tenant) return { success: false, error: 'La concesionaria no existe.' };
    if (!tenant.subscription) return { success: false, error: 'El tenant no tiene suscripción SaaS asociada.' };

    if (data.planId) {
      const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
      if (!plan) return { success: false, error: 'El plan seleccionado no existe.' };
    }

    const periodStart = data.periodStart !== undefined ? parseDateInput(data.periodStart) : undefined;
    const periodEnd = data.periodEnd !== undefined ? parseDateInput(data.periodEnd, true) : undefined;
    const trialEndsAt = data.trialEndsAt !== undefined
      ? (data.trialEndsAt ? parseDateInput(data.trialEndsAt, true) : null)
      : undefined;

    if (periodStart && periodEnd && periodEnd <= periodStart) {
      return { success: false, error: 'La fecha de vencimiento debe ser posterior a la fecha de alta.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.email !== undefined && { email: data.email?.trim() || null }),
          ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
          ...(data.address !== undefined && { address: data.address?.trim() || null }),
          ...(data.city !== undefined && { city: data.city?.trim() || null }),
          ...(data.cuit !== undefined && { cuit: data.cuit?.trim() || null }),
          ...(data.status !== undefined && { status: data.status }),
        },
      });

      await tx.subscription.update({
        where: { id: tenant.subscription!.id },
        data: {
          ...(data.planId !== undefined && { planId: data.planId }),
          ...(data.status !== undefined && { status: data.status }),
          ...(periodStart !== undefined && periodStart !== null && { currentPeriodStart: periodStart }),
          ...(periodEnd !== undefined && periodEnd !== null && { currentPeriodEnd: periodEnd }),
          ...(trialEndsAt !== undefined && { trialEndsAt }),
        },
      });

      await tx.platformAuditLog.create({
        data: {
          tenantId,
          userId: superAdmin.id,
          action: 'TENANT_UPDATED',
          resource: 'Tenant',
          details: {
            status: data.status || null,
            planId: data.planId || null,
            periodStart: periodStart?.toISOString() || null,
            periodEnd: periodEnd?.toISOString() || null,
          },
        },
      });
    });

    revalidateSuperAdmin(tenantId);
    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando tenant:', error);
    return { success: false, error: error?.message || 'No se pudo actualizar la concesionaria.' };
  }
}

export async function updateTenantStatusAction(tenantId: string, status: SaaSStatus) {
  return updateTenantAction(tenantId, { status });
}

export async function registerSaaSPaymentAction(data: {
  tenantId: string;
  planId?: string;
  amount: number;
  currency?: string;
  method?: string;
  reference?: string;
  notes?: string;
  periodStart: string;
  periodEnd: string;
}) {
  const superAdmin = await requireSuperAdmin();

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: data.tenantId },
      include: { subscription: true },
    });
    if (!tenant?.subscription) return { success: false, error: 'El tenant no tiene suscripción SaaS.' };

    const periodStart = parseDateInput(data.periodStart);
    const periodEnd = parseDateInput(data.periodEnd, true);
    if (!periodStart || !periodEnd || periodEnd <= periodStart) {
      return { success: false, error: 'El período del cobro es inválido.' };
    }
    if (!Number.isFinite(Number(data.amount)) || Number(data.amount) < 0) {
      return { success: false, error: 'El monto es inválido.' };
    }

    if (data.planId) {
      const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
      if (!plan) return { success: false, error: 'El plan seleccionado no existe.' };
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.saaSPayment.create({
        data: {
          tenantId: data.tenantId,
          subscriptionId: tenant.subscription!.id,
          amount: Number(data.amount),
          currency: (data.currency || 'USD').trim().toUpperCase(),
          status: 'PAID',
          method: data.method?.trim() || 'TRANSFERENCIA',
          reference: data.reference?.trim() || null,
          notes: data.notes?.trim() || null,
          paidAt: new Date(),
          periodStart,
          periodEnd,
        },
      });

      await tx.subscription.update({
        where: { id: tenant.subscription!.id },
        data: {
          ...(data.planId && { planId: data.planId }),
          status: 'ACTIVE',
          trialEndsAt: null,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      });

      await tx.tenant.update({
        where: { id: data.tenantId },
        data: { status: 'ACTIVE' },
      });

      await tx.platformAuditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: superAdmin.id,
          action: 'SAAS_PAYMENT_REGISTERED',
          resource: 'SaaSPayment',
          details: {
            amount: Number(data.amount),
            currency: (data.currency || 'USD').toUpperCase(),
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
          },
        },
      });

      return created;
    });

    revalidateSuperAdmin(data.tenantId);
    return { success: true, paymentId: payment.id };
  } catch (error: any) {
    console.error('Error registrando cobro SaaS:', error);
    return { success: false, error: error?.message || 'No se pudo registrar el cobro.' };
  }
}

export async function updatePlanAction(planId: string, data: {
  name: string;
  description?: string | null;
  priceMonthly: number;
  maxVehicles: number;
  maxLocations: number;
  maxUsers: number;
  features: string[];
  isActive: boolean;
}) {
  const superAdmin = await requireSuperAdmin();

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { success: false, error: 'El plan no existe.' };

    const features = Array.from(new Set(data.features.map((item) => item.trim()).filter(Boolean)));
    await prisma.$transaction(async (tx) => {
      await tx.plan.update({
        where: { id: planId },
        data: {
          name: data.name.trim(),
          description: data.description?.trim() || null,
          priceMonthly: Math.max(0, Number(data.priceMonthly) || 0),
          maxVehicles: Math.max(1, Math.trunc(Number(data.maxVehicles) || 1)),
          maxLocations: Math.max(1, Math.trunc(Number(data.maxLocations) || 1)),
          maxUsers: Math.max(1, Math.trunc(Number(data.maxUsers) || 1)),
          features,
          isActive: Boolean(data.isActive),
        },
      });

      await tx.platformAuditLog.create({
        data: {
          userId: superAdmin.id,
          action: 'PLAN_UPDATED',
          resource: 'Plan',
          details: { code: plan.code, features },
        },
      });
    });

    revalidateSuperAdmin();
    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando plan:', error);
    return { success: false, error: error?.message || 'No se pudo actualizar el plan.' };
  }
}

export async function addTenantDomainAction(tenantId: string, hostname: string, isCustom = false) {
  const superAdmin = await requireSuperAdmin();
  const cleanHost = hostname.trim().toLowerCase().replace(/\.$/, '');

  if (cleanHost === getPlatformHost()) {
    return { success: false, error: 'El dominio de plataforma está reservado y no puede asignarse a un tenant.' };
  }

  try {
    const domain = await prisma.tenantDomain.create({
      data: {
        tenantId,
        hostname: cleanHost,
        isCustom,
        verifiedAt: isCustom ? new Date() : undefined,
      },
    });

    await prisma.platformAuditLog.create({
      data: {
        tenantId,
        userId: superAdmin.id,
        action: 'DOMAIN_ADDED',
        resource: 'TenantDomain',
        details: { hostname: cleanHost, isCustom },
      },
    });

    revalidateSuperAdmin(tenantId);
    return { success: true, domain };
  } catch {
    return { success: false, error: 'El dominio ya se encuentra registrado o es inválido.' };
  }
}

export async function resetTenantUserPasswordAction(userId: string, newPassword: string) {
  const superAdmin = await requireSuperAdmin();

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }

  const passwordHash = await hashUserPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.platformAuditLog.create({
    data: {
      userId: superAdmin.id,
      action: 'USER_PASSWORD_RESET',
      resource: 'User',
      details: { targetUserId: userId },
    },
  });

  return { success: true, message: 'Contraseña actualizada correctamente.' };
}

export async function getPlanFeaturesAction(planId: string) {
  await requireSuperAdmin();
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  return plan ? normalizeFeatures(plan.features) : [];
}
