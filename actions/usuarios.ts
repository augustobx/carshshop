'use server';

import { prisma as db } from '@/lib/prisma';
import { hashUserPassword, requireTenantRole } from '@/lib/user-auth';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const ADMIN_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER];

export async function crearUsuario(data: {
  nombre: string;
  email: string;
  password_plana: string;
  rol: 'OWNER' | 'MANAGER' | 'VENDEDOR' | 'ADMINISTRATIVO' | 'TALLER';
  locationId?: string;
  commissionPct?: number;
}) {
  try {
    const tenant = await getTenantContext();
    const { role, user: actor } = await requireTenantRole(tenant.id, ADMIN_ROLES);
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.nombre.trim();
    const targetRole = data.rol as RolMembresia;

    if (!cleanName || !cleanEmail) return { success: false, error: 'Nombre y email son obligatorios.' };
    if (!data.password_plana || data.password_plana.length < 8) return { success: false, error: 'La contraseña inicial debe tener al menos 8 caracteres.' };
    if (targetRole === RolMembresia.OWNER && role !== RolMembresia.OWNER && !actor.isSuperAdmin) {
      return { success: false, error: 'Sólo un OWNER puede otorgar rol OWNER.' };
    }

    const activeCount = await db.tenantMembership.count({ where: { tenantId: tenant.id, isActive: true } });
    const existingGlobalUser = await db.user.findUnique({ where: { email: cleanEmail } });
    const existingMembership = existingGlobalUser ? await db.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: existingGlobalUser.id } },
    }) : null;

    if ((!existingMembership || !existingMembership.isActive) && activeCount >= tenant.plan.maxUsers) {
      return { success: false, error: `El plan ${tenant.plan.name} permite hasta ${tenant.plan.maxUsers} usuarios activos.` };
    }

    if (data.locationId) {
      const location = await db.location.findFirst({ where: { id: data.locationId, tenantId: tenant.id, isActive: true } });
      if (!location) return { success: false, error: 'La sucursal seleccionada no pertenece a esta concesionaria.' };
    }

    let user = existingGlobalUser;
    if (!user) {
      user = await db.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          passwordHash: await hashUserPassword(data.password_plana),
          isSuperAdmin: false,
        },
      });
    }

    if (existingMembership?.isActive) {
      return { success: false, error: 'El usuario ya pertenece al equipo de esta concesionaria.' };
    }

    if (existingMembership) {
      await db.tenantMembership.update({
        where: { id: existingMembership.id },
        data: {
          isActive: true,
          role: targetRole,
          locationId: data.locationId || null,
          commissionPct: Number(data.commissionPct || 0),
        },
      });
    } else {
      await db.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: targetRole,
          locationId: data.locationId || null,
          commissionPct: Number(data.commissionPct || 0),
        },
      });
    }

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    return { success: false, error: error?.message?.startsWith('FORBIDDEN') ? 'No tenés permisos para administrar usuarios.' : 'Error al registrar usuario en la concesionaria.' };
  }
}

export async function eliminarUsuario(membershipId: string) {
  try {
    const tenant = await getTenantContext();
    const { role, user: actor } = await requireTenantRole(tenant.id, ADMIN_ROLES);
    const membership = await db.tenantMembership.findFirst({
      where: { id: membershipId, tenantId: tenant.id, isActive: true },
      include: { user: true },
    });

    if (!membership) return { success: false, error: 'El acceso ya no existe o está desactivado.' };
    if (membership.userId === actor.id) return { success: false, error: 'No podés desactivar tu propio acceso.' };
    if (membership.role === RolMembresia.OWNER && role !== RolMembresia.OWNER && !actor.isSuperAdmin) {
      return { success: false, error: 'Sólo un OWNER puede remover a otro OWNER.' };
    }

    if (membership.role === RolMembresia.OWNER) {
      const owners = await db.tenantMembership.count({ where: { tenantId: tenant.id, role: RolMembresia.OWNER, isActive: true } });
      if (owners <= 1) return { success: false, error: 'No se puede remover al último OWNER activo.' };
    }

    await db.tenantMembership.update({ where: { id: membership.id }, data: { isActive: false } });
    await db.userSession.deleteMany({ where: { userId: membership.userId } });

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error desactivando usuario:', error);
    return { success: false, error: 'No se pudo desactivar el acceso del usuario.' };
  }
}
