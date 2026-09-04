'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const MANAGEMENT = [RolMembresia.OWNER, RolMembresia.MANAGER];

export async function crearSucursal(data: {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isMain?: boolean;
}) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, MANAGEMENT);

    const cleanName = data.name.trim();
    const cleanCode = data.code.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanName || !cleanCode) return { success: false, error: 'Nombre y código son obligatorios.' };

    const count = await db.location.count({ where: { tenantId: tenant.id, isActive: true } });
    if (count >= tenant.plan.maxLocations) {
      return { success: false, error: `El plan ${tenant.plan.name} permite hasta ${tenant.plan.maxLocations} sucursales activas.` };
    }

    const sucursal = await db.$transaction(async (tx) => {
      if (data.isMain) {
        await tx.location.updateMany({ where: { tenantId: tenant.id, isMain: true }, data: { isMain: false } });
      }
      return tx.location.create({
        data: {
          tenantId: tenant.id,
          name: cleanName,
          code: cleanCode,
          address: data.address?.trim() || null,
          phone: data.phone?.trim() || null,
          isMain: data.isMain || count === 0,
        },
      });
    });

    revalidatePath('/sucursales');
    return { success: true, sucursal };
  } catch (error: any) {
    console.error('Error creando sucursal:', error);
    if (error?.code === 'P2002') return { success: false, error: 'Ya existe una sucursal con ese código.' };
    return { success: false, error: 'Ocurrió un error al registrar la sucursal.' };
  }
}

export async function obtenerSucursales() {
  const tenant = await getTenantContext();
  await requireTenantRole(tenant.id, MANAGEMENT);

  return db.location.findMany({
    where: { tenantId: tenant.id },
    include: { _count: { select: { vehiculos: true, ventas: true } } },
    orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
  });
}
