'use server';

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin, hashUserPassword } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

export async function getSuperAdminOverviewAction() {
  await requireSuperAdmin();

  const [tenantsCount, activeTenantsCount, totalVehiclesCount, totalUsersCount, tenants] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    prisma.vehiculo.count(),
    prisma.user.count(),
    prisma.tenant.findMany({
      include: {
        domains: true,
        subscription: { include: { plan: true } },
        _count: {
          select: {
            vehiculos: true,
            ventas: true,
            memberships: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const plans = await prisma.plan.findMany({ where: { isActive: true } });

  return {
    success: true,
    stats: {
      tenantsCount,
      activeTenantsCount,
      totalVehiclesCount,
      totalUsersCount,
    },
    tenants,
    plans,
  };
}

export async function createTenantAction(data: {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  planCode: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
  subdomain?: string;
}) {
  const superAdmin = await requireSuperAdmin();

  try {
    const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const cleanEmail = data.adminEmail.trim().toLowerCase();

    // Validar slug
    const existing = await prisma.tenant.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return { success: false, error: `El identificador (slug) "${cleanSlug}" ya está en uso.` };
    }

    // Buscar plan
    const plan = await prisma.plan.findUnique({ where: { code: data.planCode } });
    if (!plan) {
      return { success: false, error: 'El plan seleccionado no existe.' };
    }

    // Crear tenant en transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name.trim(),
          slug: cleanSlug,
          email: data.email?.trim() || cleanEmail,
          phone: data.phone?.trim(),
          status: 'ACTIVE',
        },
      });

      // 2. Crear Suscripción
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        },
      });

      // 3. Crear Subdominio principal
      const baseDomain = process.env.BASE_DOMAIN || 'onlycars.nanoapps.ar';
      const hostname = data.subdomain ? `${data.subdomain.trim().toLowerCase()}.${baseDomain}` : `${cleanSlug}.${baseDomain}`;

      await tx.tenantDomain.create({
        data: {
          tenantId: tenant.id,
          hostname,
          isPrimary: true,
          isCustom: false,
        },
      });

      // 4. Crear Sucursal inicial (Casa Central)
      const location = await tx.location.create({
        data: {
          tenantId: tenant.id,
          name: 'Casa Central',
          code: 'central',
          isMain: true,
        },
      });

      // 5. Configuración visual por defecto
      await tx.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          appName: data.name.trim(),
          primaryColor: '#2563eb',
          secondaryColor: '#0f172a',
          dolarActual: 1400,
        },
      });

      // 6. Crear o vincular usuario administrador de la concesionaria
      let user = await tx.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        const passwordToHash = data.adminPassword || 'Concesionaria2026!';
        const passwordHash = await hashUserPassword(passwordToHash);
        user = await tx.user.create({
          data: {
            email: cleanEmail,
            name: data.adminName.trim(),
            passwordHash,
            isSuperAdmin: false,
          },
        });
      }

      // 7. Crear membresía OWNER
      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: RolMembresia.OWNER,
          locationId: location.id,
        },
      });

      // 8. Log de auditoría
      await tx.platformAuditLog.create({
        data: {
          tenantId: tenant.id,
          userId: superAdmin.id,
          action: 'TENANT_CREATED',
          resource: 'Tenant',
          details: { name: tenant.name, slug: tenant.slug, plan: plan.code },
        },
      });

      return tenant;
    });

    revalidatePath('/superadmin');
    return { success: true, tenant: result };
  } catch (error: any) {
    console.error('Error creando tenant:', error);
    return { success: false, error: 'Ocurrió un error al crear la concesionaria.' };
  }
}

export async function updateTenantStatusAction(tenantId: string, status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED') {
  const superAdmin = await requireSuperAdmin();

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status },
  });

  await prisma.platformAuditLog.create({
    data: {
      tenantId,
      userId: superAdmin.id,
      action: 'TENANT_STATUS_CHANGED',
      resource: 'Tenant',
      details: { newStatus: status },
    },
  });

  revalidatePath('/superadmin');
  return { success: true };
}

export async function addTenantDomainAction(tenantId: string, hostname: string, isCustom = false) {
  const superAdmin = await requireSuperAdmin();
  const cleanHost = hostname.trim().toLowerCase().replace(/\.$/, '');

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

    revalidatePath('/superadmin');
    return { success: true, domain };
  } catch (error: any) {
    return { success: false, error: 'El dominio ya se encuentra registrado o es inválido.' };
  }
}

export async function resetTenantUserPasswordAction(userId: string, newPassword: string) {
  await requireSuperAdmin();

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const passwordHash = await hashUserPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true, message: 'Contraseña actualizada correctamente.' };
}
