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

    const prospecto = await db.prospecto.create({
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
    return { success: true, id_prospecto: prospecto.id_prospecto };
  } catch (error) {
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

    const actualizado = await db.prospecto.updateMany({
      where: { id_prospecto, tenantId: tenant.id },
      data: {
        estado: nuevoEstado,
        notas: notas !== undefined ? notas : undefined,
      },
    });

    if (!actualizado.count) return { success: false, error: 'Prospecto inexistente.' };

    revalidatePath('/prospectos');
    revalidatePath(`/prospectos/${id_prospecto}`);
    return { success: true };
  } catch (error) {
    console.error('Error actualizando prospecto:', error);
    return { success: false, error: 'Ocurrió un error al actualizar el estado del prospecto.' };
  }
}

export async function obtenerProspectos() {
  const tenant = await getTenantContext();

  return db.prospecto.findMany({
    where: { tenantId: tenant.id },
    include: {
      cliente: {
        select: { id_cliente: true, nombre_completo: true },
      },
      vehiculo_interes: {
        select: {
          id_vehiculo: true,
          marca: true,
          modelo: true,
          anio: true,
          patente: true,
          estado: true,
          precio_venta_usd: true,
          precio_venta_ars: true,
        },
      },
      cotizaciones: {
        select: {
          id_cotizacion: true,
          estado: true,
          precio_final_usd: true,
          cotizacion_dolar: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      senias: {
        where: { estado: 'ACTIVA' },
        select: {
          id_senia: true,
          monto_usd: true,
          monto_ars: true,
          cotizacion: true,
          fecha_senia: true,
        },
        take: 1,
      },
      ventas: {
        select: {
          id_venta: true,
          numero_boleto: true,
          fecha_venta: true,
          precio_final_usd: true,
          cotizacion_dolar_venta: true,
        },
        orderBy: { fecha_venta: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ proxima_accion: 'asc' }, { fecha_contacto: 'desc' }],
  });
}
