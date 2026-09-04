'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const WORKSHOP_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO, RolMembresia.TALLER];

async function vehicleForTenant(idVehiculo: number, tenantId: string) {
  return db.vehiculo.findFirst({ where: { id_vehiculo: idVehiculo, tenantId } });
}

export async function agregarTarea(idVehiculo: number, descripcion: string) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, WORKSHOP_ROLES);
    const text = descripcion?.trim();
    if (!text) return { success: false, error: 'La descripción de la tarea es obligatoria.' };
    if (!(await vehicleForTenant(idVehiculo, tenant.id))) return { success: false, error: 'Vehículo inexistente.' };

    await db.tarea.create({ data: { tenantId: tenant.id, id_vehiculo: idVehiculo, descripcion: text, estado_tarea: 'PENDIENTE' } });
    revalidatePath(`/vehiculos/${idVehiculo}`); revalidatePath('/vehiculos'); revalidatePath('/motos');
    return { success: true };
  } catch (error) { console.error('Error agregando tarea:', error); return { success: false, error: 'Error al crear la tarea.' }; }
}

export async function cambiarEstadoTarea(idTarea: number, nuevoEstado: 'PENDIENTE' | 'COMPLETADA', idVehiculo: number) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, WORKSHOP_ROLES);
    const tarea = await db.tarea.findFirst({ where: { id_tarea: idTarea, tenantId: tenant.id, id_vehiculo: idVehiculo } });
    if (!tarea) return { success: false, error: 'Tarea inexistente.' };
    await db.tarea.update({ where: { id_tarea: idTarea }, data: { estado_tarea: nuevoEstado, fecha_fin: nuevoEstado === 'COMPLETADA' ? new Date() : null } });
    revalidatePath(`/vehiculos/${idVehiculo}`); revalidatePath('/vehiculos'); revalidatePath('/motos');
    return { success: true };
  } catch { return { success: false, error: 'Error al actualizar tarea.' }; }
}

export async function agregarGasto(idTarea: number, idVehiculo: number, montoArs: number, cotizacionDolar: number, descripcion: string) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, WORKSHOP_ROLES);
    const tarea = await db.tarea.findFirst({ where: { id_tarea: idTarea, id_vehiculo: idVehiculo, tenantId: tenant.id } });
    const v = await vehicleForTenant(idVehiculo, tenant.id);
    if (!tarea || !v) return { success: false, error: 'Tarea o vehículo inválido.' };

    const amount = Number(montoArs);
    const rate = Number(cotizacionDolar) > 0 ? Number(cotizacionDolar) : Number(tenant.settings?.dolarActual || 1400);
    if (amount <= 0 || rate <= 0 || !descripcion?.trim()) return { success: false, error: 'Monto, cotización y descripción son obligatorios.' };
    const montoUsd = Number((amount / rate).toFixed(2));

    await db.$transaction(async (tx) => {
      await tx.gasto.create({
        data: {
          tenantId: tenant.id,
          locationId: v.locationId || tenant.primaryLocationId || null,
          id_vehiculo: idVehiculo,
          monto_ars: amount,
          monto_usd: montoUsd,
          cotizacion: rate,
          descripcion: descripcion.trim(),
          categoria: `Taller / Tarea #${idTarea}`,
          tipo_movimiento: 'EGRESO',
        },
      });

      await tx.tarea.update({
        where: { id_tarea: idTarea },
        data: {
          costo_ars: { increment: amount },
          costo_usd: { increment: montoUsd },
        },
      });

      const nuevosGastosPrep = Number(v.gastos_preparacion_usd || 0) + montoUsd;
      await tx.vehiculo.update({
        where: { id_vehiculo: idVehiculo },
        data: {
          gastos_preparacion_usd: nuevosGastosPrep,
          costo_total_real_usd: Number(v.precio_compra_usd || 0) + nuevosGastosPrep + Number(v.gastos_gestoria_usd || 0),
        },
      });
    });

    revalidatePath(`/vehiculos/${idVehiculo}`); revalidatePath('/caja'); revalidatePath('/vehiculos'); revalidatePath('/motos');
    return { success: true };
  } catch (error) { console.error('Error al registrar gasto:', error); return { success: false, error: 'Error al registrar el gasto.' }; }
}
