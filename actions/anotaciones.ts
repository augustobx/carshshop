'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireTenantRole } from '@/lib/user-auth';
import { getTenantContext } from '@/lib/tenant-context';
import { RolMembresia } from '@prisma/client';

const NOTE_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO, RolMembresia.TALLER];

export async function agregarAnotacion(idVehiculo: number, texto: string) {
  try {
    const tenant = await getTenantContext();
    const { user } = await requireTenantRole(tenant.id, NOTE_ROLES);
    const note = texto?.trim();
    if (!note) return { success: false, error: 'La anotación está vacía.' };
    const vehiculo = await db.vehiculo.findFirst({ where: { id_vehiculo: idVehiculo, tenantId: tenant.id }, select: { id_vehiculo: true } });
    if (!vehiculo) return { success: false, error: 'Vehículo inexistente.' };

    await db.anotacion.create({ data: { tenantId: tenant.id, id_vehiculo: idVehiculo, userId: user.id, texto: note } });
    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error) {
    console.error('Error agregando anotación:', error);
    return { success: false, error: 'No se pudo guardar la anotación.' };
  }
}
