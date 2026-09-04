'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { EstadoProspecto, RolMembresia } from '@prisma/client';

const CRM_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR];

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
    const { user } = await requireTenantRole(tenant.id, CRM_ROLES);
    const nombre = data.nombre?.trim();
    if (!nombre) return { success: false, error: 'El nombre del prospecto es obligatorio.' };

    if (data.id_vehiculo_interes) {
      const v = await db.vehiculo.findFirst({ where: { id_vehiculo: data.id_vehiculo_interes, tenantId: tenant.id } });
      if (!v) return { success: false, error: 'El vehículo seleccionado no pertenece a esta concesionaria.' };
    }

    const nextAction = data.proxima_accion ? new Date(data.proxima_accion) : null;
    if (nextAction && Number.isNaN(nextAction.getTime())) return { success: false, error: 'La fecha de próxima acción es inválida.' };

    const prospecto = await db.prospecto.create({
      data: {
        tenantId: tenant.id, nombre,
        telefono: data.telefono?.trim() || null, email: data.email?.trim().toLowerCase() || null,
        id_vehiculo_interes: data.id_vehiculo_interes || null, vendedorId: user.id,
        origen: data.origen || 'SHOWROOM', presupuesto_estimado_usd: Number(data.presupuesto_estimado_usd || 0) || null,
        tiene_permuta: Boolean(data.tiene_permuta), detalle_permuta: data.detalle_permuta?.trim() || null,
        notas: data.notas?.trim() || null, proxima_accion: nextAction,
      },
    });

    revalidatePath('/prospectos');
    return { success: true, id_prospecto: prospecto.id_prospecto };
  } catch (error: any) {
    console.error('Error guardando prospecto:', error);
    return { success: false, error: 'Ocurrió un error al registrar el prospecto.' };
  }
}

export async function actualizarEstadoProspecto(id_prospecto: number, nuevoEstado: EstadoProspecto, notas?: string) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CRM_ROLES);
    const actualizado = await db.prospecto.updateMany({ where: { id_prospecto, tenantId: tenant.id }, data: { estado: nuevoEstado, notas: notas !== undefined ? notas.trim() || null : undefined } });
    if (!actualizado.count) return { success: false, error: 'Prospecto inexistente.' };
    revalidatePath('/prospectos'); revalidatePath(`/prospectos/${id_prospecto}`);
    return { success: true };
  } catch (error) {
    console.error('Error actualizando prospecto:', error);
    return { success: false, error: 'Ocurrió un error al actualizar el estado del prospecto.' };
  }
}

export async function obtenerProspectos() {
  const tenant = await getTenantContext();
  await requireTenantRole(tenant.id, CRM_ROLES);
  return db.prospecto.findMany({
    where: { tenantId: tenant.id },
    include: {
      cliente: { select: { id_cliente: true, nombre_completo: true } },
      vehiculo_interes: { select: { id_vehiculo: true, marca: true, modelo: true, anio: true, patente: true, estado: true, precio_venta_usd: true, precio_venta_ars: true } },
      cotizaciones: { select: { id_cotizacion: true, estado: true, precio_final_usd: true, cotizacion_dolar: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      senias: { where: { estado: 'ACTIVA' }, select: { id_senia: true, monto_usd: true, monto_ars: true, cotizacion: true, fecha_senia: true }, take: 1 },
      ventas: { select: { id_venta: true, numero_boleto: true, fecha_venta: true, precio_final_usd: true, cotizacion_dolar_venta: true }, orderBy: { fecha_venta: 'desc' }, take: 1 },
    },
    orderBy: [{ proxima_accion: 'asc' }, { fecha_contacto: 'desc' }],
  });
}
