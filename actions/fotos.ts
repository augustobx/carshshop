'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const PHOTO_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO, RolMembresia.TALLER];
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 2 * 1024 * 1024;

export async function subirFotoVehiculo(formData: FormData) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, PHOTO_ROLES);
    const file = formData.get('file') as File | null;
    const idVehiculo = Number(formData.get('idVehiculo'));
    if (!file || !Number.isInteger(idVehiculo)) return { success: false, error: 'Datos inválidos.' };
    if (!ALLOWED_TYPES.has(file.type)) return { success: false, error: 'Formato no permitido. Usá JPG, PNG o WebP.' };
    if (file.size <= 0 || file.size > MAX_SIZE) return { success: false, error: 'La imagen debe pesar menos de 2 MB.' };
    if (!(await db.vehiculo.findFirst({ where: { id_vehiculo: idVehiculo, tenantId: tenant.id }, select: { id_vehiculo: true } }))) return { success: false, error: 'Vehículo inexistente.' };

    const buffer = await file.arrayBuffer();
    const url_foto = `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`;
    const last = await db.vehiculoFoto.aggregate({ where: { tenantId: tenant.id, id_vehiculo: idVehiculo }, _max: { orden: true } });
    await db.vehiculoFoto.create({ data: { tenantId: tenant.id, id_vehiculo: idVehiculo, url_foto, orden: Number(last._max.orden || 0) + 1 } });

    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error) { console.error('Error subiendo foto:', error); return { success: false, error: 'Error al procesar la imagen.' }; }
}

export async function eliminarFotoVehiculo(idFoto: number, idVehiculo: number) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, PHOTO_ROLES);
    const foto = await db.vehiculoFoto.findFirst({ where: { id_foto: idFoto, id_vehiculo: idVehiculo, tenantId: tenant.id } });
    if (!foto) return { success: false, error: 'Imagen inexistente.' };
    await db.vehiculoFoto.delete({ where: { id_foto: idFoto } });
    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error) { console.error('Error eliminando foto:', error); return { success: false, error: 'Error al eliminar la imagen.' }; }
}
