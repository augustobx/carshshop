'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getLoggedUser } from '@/lib/user-auth';
import { getTenantContext } from '@/lib/tenant-context';

export async function agregarAnotacion(idVehiculo: number, texto: string) {
  try {
    const tenant = await getTenantContext();
    const user = await getLoggedUser();

    await db.anotacion.create({
      data: {
        tenantId: tenant.id,
        id_vehiculo: idVehiculo,
        userId: user?.id || null,
        texto: texto.trim(),
      },
    });

    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error agregando anotación:', error);
    return { success: false, error: 'No se pudo guardar la anotación.' };
  }
}