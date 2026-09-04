'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

export async function crearSucursal(data: {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isMain?: boolean;
}) {
  try {
    const tenant = await getTenantContext();
    const cleanCode = data.code.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    const sucursal = await db.location.create({
      data: {
        tenantId: tenant.id,
        name: data.name.trim(),
        code: cleanCode,
        address: data.address || null,
        phone: data.phone || null,
        isMain: data.isMain || false,
      },
    });

    revalidatePath('/sucursales');
    return { success: true, sucursal };
  } catch (error: any) {
    console.error('Error creando sucursal:', error);
    return { success: false, error: 'Ocurrió un error al registrar la sucursal.' };
  }
}

export async function obtenerSucursales() {
  const tenant = await getTenantContext();

  return await db.location.findMany({
    where: { tenantId: tenant.id },
    include: {
      _count: {
        select: {
          vehiculos: true,
          ventas: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}
