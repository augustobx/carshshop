'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

export async function agregarTarea(idVehiculo: number, descripcion: string) {
  try {
    const tenant = await getTenantContext();

    await db.tarea.create({
      data: {
        tenantId: tenant.id,
        id_vehiculo: idVehiculo,
        descripcion,
        estado_tarea: 'PENDIENTE',
      },
    });

    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error agregando tarea:', error);
    return { success: false, error: 'Error al crear la tarea' };
  }
}

export async function cambiarEstadoTarea(
  idTarea: number,
  nuevoEstado: 'PENDIENTE' | 'FINALIZADA',
  idVehiculo: number
) {
  try {
    const tenant = await getTenantContext();

    await db.tarea.update({
      where: { id_tarea: idTarea, tenantId: tenant.id },
      data: {
        estado_tarea: nuevoEstado,
        fecha_fin: nuevoEstado === 'FINALIZADA' ? new Date() : null,
      },
    });

    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Error al actualizar tarea' };
  }
}

export async function agregarGasto(
  idTarea: number,
  idVehiculo: number,
  montoArs: number,
  cotizacionDolar: number,
  descripcion: string
) {
  try {
    const tenant = await getTenantContext();
    const cotizacion = cotizacionDolar > 0 ? cotizacionDolar : (tenant.settings?.dolarActual || 1400);
    const montoUsd = parseFloat((montoArs / cotizacion).toFixed(2));

    await db.$transaction(async (tx) => {
      // 1. Crear gasto asociado al taller y al auto
      await tx.gasto.create({
        data: {
          tenantId: tenant.id,
          id_tarea: idTarea,
          id_vehiculo: idVehiculo,
          monto_ars: montoArs,
          monto_usd: montoUsd,
          descripcion,
          categoria: 'Taller / Reacondicionamiento',
          tipo_movimiento: 'EGRESO',
        },
      });

      // 2. Acumular al costeo real del vehículo
      const v = await tx.vehiculo.findUnique({
        where: { id_vehiculo: idVehiculo, tenantId: tenant.id },
      });
      if (v) {
        const nuevosGastosPrep = Number(v.gastos_preparacion_usd || 0) + montoUsd;
        const precioCompra = Number(v.precio_compra_usd || 0);
        const gastosGest = Number(v.gastos_gestoria_usd || 0);
        const nuevoCostoTotal = precioCompra + nuevosGastosPrep + gastosGest;

        await tx.vehiculo.update({
          where: { id_vehiculo: idVehiculo, tenantId: tenant.id },
          data: {
            gastos_preparacion_usd: nuevosGastosPrep,
            costo_total_real_usd: nuevoCostoTotal,
          },
        });
      }
    });

    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error al registrar gasto:', error);
    return { success: false, error: 'Error al registrar el gasto' };
  }
}