'use server';

import { prisma as db } from '@/lib/prisma';
import { hashUserPassword } from '@/lib/user-auth';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

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
    const cleanEmail = data.email.trim().toLowerCase();

    let user = await db.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      const passwordHash = await hashUserPassword(data.password_plana || 'Concesionaria2026!');
      user = await db.user.create({
        data: {
          name: data.nombre.trim(),
          email: cleanEmail,
          passwordHash,
          isSuperAdmin: false,
        },
      });
    }

    // Verificar si ya tiene membresía en este tenant
    const existingMembership = await db.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        return { success: false, error: 'El usuario ya pertenece al equipo de esta concesionaria.' };
      }
      await db.tenantMembership.update({
        where: { id: existingMembership.id },
        data: {
          isActive: true,
          role: data.rol as RolMembresia,
          locationId: data.locationId || null,
          commissionPct: data.commissionPct || 0,
        },
      });
    } else {
      await db.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: data.rol as RolMembresia,
          locationId: data.locationId || null,
          commissionPct: data.commissionPct || 0,
        },
      });
    }

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error: any) {
    console.error('Error creando usuario:', error);
    return { success: false, error: 'Error al registrar usuario en la concesionaria.' };
  }
}

export async function eliminarUsuario(membershipId: string) {
  try {
    const tenant = await getTenantContext();

    // Desactivar membresía para preservar trazabilidad histórica
    await db.tenantMembership.update({
      where: { id: membershipId, tenantId: tenant.id },
      data: { isActive: false },
    });

    revalidatePath('/usuarios');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: 'No se pudo desactivar el acceso del usuario.',
    };
  }
}