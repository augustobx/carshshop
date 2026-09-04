'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { getLoggedUser } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { EstadoProspecto } from '@prisma/client';

export async function guardarProspecto(data: {
  nombre: string;
  telefono?: string;
  email?: string;
  id_vehiculo_interes?: number;
  origen?: string;
  presupuesto_estimado_usd?: number;
  tiene_permuta?: boolean;
  detalle_permuta?: string;
  notas?: string;
  proxima_accion?: string;
}) {
  try {
    const tenant = await getTenantContext();
    const user = await getLoggedUser();

    await db.prospecto.create({
      data: {
        tenantId: tenant.id,
        nombre: data.nombre.trim(),
        telefono: data.telefono || null,
        email: data.email || null,
        id_vehiculo_interes: data.id_vehiculo_interes || null,
        vendedorId: user?.id || null,
        origen: data.origen || 'SHOWROOM',
        presupuesto_estimado_usd: data.presupuesto_estimado_usd || null,
        tiene_permuta: data.tiene_permuta || false,
        detalle_permuta: data.detalle_permuta || null,
        notas: data.notas || null,
        proxima_accion: data.proxima_accion ? new Date(data.proxima_accion) : null,
      },
    });

    revalidatePath('/prospectos');
    return { success: true };
  } catch (error: any) {
    console.error('Error guardando prospecto:', error);
    return { success: false, error: 'Ocurrió un error al registrar el prospecto.' };
  }
}

export async function actualizarEstadoProspecto(
  id_prospecto: number,
  nuevoEstado: EstadoProspecto,
  notas?: string
) {
  try {
    const tenant = await getTenantContext();

    await db.prospecto.update({
      where: { id_prospecto, tenantId: tenant.id },
      data: {
        estado: nuevoEstado,
        notas: notas !== undefined ? notas : undefined,
      },
    });

    revalidatePath('/prospectos');
    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando prospecto:', error);
    return { success: false, error: 'Ocurrió un error al actualizar el estado del prospecto.' };
  }
}

export async function obtenerProspectos() {
  const tenant = await getTenantContext();

  return await db.prospecto.findMany({
    where: { tenantId: tenant.id },
    include: {
      vehiculo_interes: {
        select: {
          id_vehiculo: true,
          marca: true,
          modelo: true,
          anio: true,
          patente: true,
          precio_venta_usd: true,
        },
      },
    },
    orderBy: { fecha_contacto: 'desc' },
  });
}
