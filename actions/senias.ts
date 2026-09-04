'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const RESERVA_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];

export async function guardarSenia(data: {
  id_vehiculo: number; id_cliente: number; monto_ars: number; monto_usd: number; cotizacion: number;
  fecha_senia: string; fecha_limite?: string; locationId?: string; prospectoId?: number; cotizacionId?: number;
}) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, RESERVA_ROLES);
    const ars = Number(data.monto_ars), usd = Number(data.monto_usd), rate = Number(data.cotizacion);
    if (ars <= 0 || usd <= 0 || rate <= 0) return { success: false, error: 'Monto ARS, USD y cotización deben ser mayores a cero.' };

    const [vehiculo, cliente, active] = await Promise.all([
      db.vehiculo.findFirst({ where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id, estado: { not: 'VENDIDO' } } }),
      db.cliente.findFirst({ where: { id_cliente: data.id_cliente, tenantId: tenant.id } }),
      db.senia.findFirst({ where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id, estado: 'ACTIVA' } }),
    ]);
    if (!vehiculo || !cliente) return { success: false, error: 'Vehículo o cliente inválido.' };
    if (active) return { success: false, error: 'La unidad ya tiene una reserva activa.' };
    if (data.prospectoId && !(await db.prospecto.findFirst({ where: { id_prospecto: data.prospectoId, tenantId: tenant.id } }))) return { success: false, error: 'Prospecto inválido.' };
    if (data.cotizacionId && !(await db.cotizacion.findFirst({ where: { id_cotizacion: data.cotizacionId, tenantId: tenant.id, id_vehiculo: data.id_vehiculo } }))) return { success: false, error: 'Cotización inválida.' };

    const fecha = new Date(data.fecha_senia); const limite = data.fecha_limite ? new Date(data.fecha_limite) : null;
    if (Number.isNaN(fecha.getTime()) || (limite && Number.isNaN(limite.getTime()))) return { success: false, error: 'Fecha de reserva inválida.' };

    const result = await db.$transaction(async (tx) => {
      const senia = await tx.senia.create({ data: { tenantId: tenant.id, locationId: data.locationId || vehiculo.locationId || tenant.primaryLocationId || null, id_vehiculo: data.id_vehiculo, id_cliente: data.id_cliente, prospectoId: data.prospectoId || null, cotizacionId: data.cotizacionId || null, monto_ars: ars, monto_usd: usd, cotizacion: rate, fecha_senia: fecha, fecha_limite: limite, estado: 'ACTIVA' } });
      const reciboNro = `RES-${new Date().getFullYear()}-${String(senia.id_senia).padStart(6, '0')}`;
      await tx.senia.update({ where: { id_senia: senia.id_senia }, data: { recibo_nro: reciboNro } });
      await tx.vehiculo.update({ where: { id_vehiculo: data.id_vehiculo }, data: { estado: 'SENADO' } });
      if (data.prospectoId) await tx.prospecto.updateMany({ where: { id_prospecto: data.prospectoId, tenantId: tenant.id }, data: { estado: 'RESERVADO', id_cliente: data.id_cliente } });
      if (data.cotizacionId) await tx.cotizacion.updateMany({ where: { id_cotizacion: data.cotizacionId, tenantId: tenant.id }, data: { estado: 'ACEPTADA', id_cliente: data.id_cliente } });
      return reciboNro;
    });

    revalidatePath(`/vehiculos/${data.id_vehiculo}`); revalidatePath('/vehiculos'); revalidatePath('/motos'); revalidatePath('/prospectos');
    if (data.prospectoId) revalidatePath(`/prospectos/${data.prospectoId}`);
    return { success: true, recibo_nro: result };
  } catch (error) { console.error('Error guardando seña:', error); return { success: false, error: 'Ocurrió un error al guardar la seña.' }; }
}

export async function cancelarSenia(id_senia: number, id_vehiculo: number) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, RESERVA_ROLES);
    const senia = await db.senia.findFirst({ where: { id_senia, tenantId: tenant.id, id_vehiculo }, select: { id_senia: true, prospectoId: true, cotizacionId: true, estado: true } });
    if (!senia) return { success: false, error: 'La reserva no existe.' };
    if (senia.estado !== 'ACTIVA') return { success: false, error: 'La reserva ya no está activa.' };

    await db.$transaction(async (tx) => {
      await tx.senia.update({ where: { id_senia: senia.id_senia }, data: { estado: 'CANCELADA' } });
      const restantes = await tx.senia.count({ where: { id_vehiculo, tenantId: tenant.id, estado: 'ACTIVA' } });
      if (!restantes) await tx.vehiculo.update({ where: { id_vehiculo }, data: { estado: 'LISTO_PARA_VENTA' } });
      if (senia.cotizacionId) await tx.cotizacion.updateMany({ where: { id_cotizacion: senia.cotizacionId, tenantId: tenant.id }, data: { estado: 'ENVIADA' } });
      if (senia.prospectoId) await tx.prospecto.updateMany({ where: { id_prospecto: senia.prospectoId, tenantId: tenant.id }, data: { estado: senia.cotizacionId ? 'COTIZADO' : 'NEGOCIACION' } });
    });

    revalidatePath(`/vehiculos/${id_vehiculo}`); revalidatePath('/vehiculos'); revalidatePath('/motos'); revalidatePath('/prospectos');
    if (senia.prospectoId) revalidatePath(`/prospectos/${senia.prospectoId}`);
    return { success: true };
  } catch (error) { console.error('Error cancelando seña:', error); return { success: false, error: 'Ocurrió un error al cancelar la seña.' }; }
}
