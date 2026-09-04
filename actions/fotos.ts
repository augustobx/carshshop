'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { getObjectStorage } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const PHOTO_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO, RolMembresia.TALLER];

function revalidatePhotos(idVehiculo: number) {
  revalidatePath('/vehiculos');
  revalidatePath('/motos');
  revalidatePath(`/vehiculos/${idVehiculo}`);
  revalidatePath('/pwa/dashboard');
  revalidatePath(`/pwa/vehiculo/${idVehiculo}`);
}

export async function subirFotoVehiculo(formData: FormData) {
  let uploadedKey: string | null = null;
  let tenantId: string | null = null;

  try {
    const tenant = await getTenantContext();
    tenantId = tenant.id;
    await requireTenantRole(tenant.id, PHOTO_ROLES);

    const file = formData.get('file') as File | null;
    const idVehiculo = Number(formData.get('idVehiculo'));
    if (!file || !Number.isInteger(idVehiculo)) return { success: false, error: 'Datos inválidos.' };

    const vehiculo = await db.vehiculo.findFirst({
      where: { id_vehiculo: idVehiculo, tenantId: tenant.id },
      select: { id_vehiculo: true },
    });
    if (!vehiculo) return { success: false, error: 'Vehículo inexistente.' };

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getObjectStorage();
    const uploaded = await storage.upload({
      tenantId: tenant.id,
      folder: 'vehicles',
      fileName: file.name,
      mimeType: file.type,
      buffer,
    });
    uploadedKey = uploaded.objectKey;

    const last = await db.vehiculoFoto.aggregate({
      where: { tenantId: tenant.id, id_vehiculo: idVehiculo },
      _max: { orden: true },
    });

    const foto = await db.vehiculoFoto.create({
      data: {
        tenantId: tenant.id,
        id_vehiculo: idVehiculo,
        url_foto: uploaded.url,
        object_key: uploaded.objectKey,
        mime_type: uploaded.mimeType,
        size_bytes: uploaded.sizeBytes,
        orden: Number(last._max.orden || 0) + 1,
      },
    });

    revalidatePhotos(idVehiculo);
    return { success: true, foto: { id_foto: foto.id_foto, url_foto: foto.url_foto, orden: foto.orden } };
  } catch (error: any) {
    if (uploadedKey && tenantId) {
      try { await getObjectStorage().delete(tenantId, uploadedKey); } catch {}
    }
    console.error('Error subiendo foto:', error);
    return { success: false, error: error?.message || 'Error al procesar la imagen.' };
  }
}

export async function eliminarFotoVehiculo(idFoto: number, idVehiculo: number) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, PHOTO_ROLES);

    const foto = await db.vehiculoFoto.findFirst({
      where: { id_foto: idFoto, id_vehiculo: idVehiculo, tenantId: tenant.id },
    });
    if (!foto) return { success: false, error: 'Imagen inexistente.' };

    if (foto.object_key) {
      await getObjectStorage().delete(tenant.id, foto.object_key);
    }

    await db.vehiculoFoto.delete({ where: { id_foto: idFoto } });
    revalidatePhotos(idVehiculo);
    return { success: true };
  } catch (error: any) {
    console.error('Error eliminando foto:', error);
    return { success: false, error: error?.message || 'Error al eliminar la imagen.' };
  }
}
