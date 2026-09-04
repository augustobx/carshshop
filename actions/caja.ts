'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

export async function registrarMovimiento(data: {
  descripcion: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto_ars: number;
  cotizacion_dia: number;
  categoria: string;
  id_vehiculo?: number;
  locationId?: string;
}) {
  try {
    const tenant = await getTenantContext();
    const cotizacion = data.cotizacion_dia > 0 ? data.cotizacion_dia : (tenant.settings?.dolarActual || 1400);
    const montoUsd = parseFloat((data.monto_ars / cotizacion).toFixed(2));

    await db.$transaction(async (tx) => {
      await tx.gasto.create({
        data: {
          tenantId: tenant.id,
          locationId: data.locationId || tenant.primaryLocationId || null,
          descripcion: data.descripcion,
          categoria: data.categoria,
          tipo_movimiento: data.tipo,
          monto_ars: data.monto_ars,
          monto_usd: montoUsd,
          id_vehiculo: data.id_vehiculo || null,
          fecha: new Date(),
        },
      });

      // Si el gasto está vinculado a un vehículo, acumularlo en el costeo real del auto
      if (data.id_vehiculo && data.tipo === 'EGRESO') {
        const v = await tx.vehiculo.findUnique({
          where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id },
        });
        if (v) {
          const nuevosGastosPrep = Number(v.gastos_preparacion_usd || 0) + montoUsd;
          const precioCompra = Number(v.precio_compra_usd || 0);
          const gastosGest = Number(v.gastos_gestoria_usd || 0);
          const nuevoCostoTotal = precioCompra + nuevosGastosPrep + gastosGest;

          await tx.vehiculo.update({
            where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id },
            data: {
              gastos_preparacion_usd: nuevosGastosPrep,
              costo_total_real_usd: nuevoCostoTotal,
            },
          });
        }
      }
    });

    revalidatePath('/caja');
    revalidatePath('/vehiculos');
    return { success: true };
  } catch (error: any) {
    console.error('Error registrando movimiento en caja:', error);
    return { success: false, error: 'Ocurrió un error al registrar el movimiento.' };
  }
}