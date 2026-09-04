'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

// 1. COBRO DE CUOTA DE VEHÍCULO
export async function registrarPagoCuota(
  id_cuota: number,
  data: { monto_cobrado_ars: number; cotizacion_dia: number }
) {
  try {
    const tenant = await getTenantContext();

    const timestamp = Date.now().toString().slice(-5);
    const reciboNro = `REC-${new Date().getFullYear()}-${timestamp}`;

    await db.ventaCuota.update({
      where: { id_cuota, tenantId: tenant.id },
      data: {
        estado: 'PAGADA',
        monto_pagado_ars: data.monto_cobrado_ars,
        cotizacion_pago: data.cotizacion_dia,
        fecha_pago: new Date(),
        recibo_nro: reciboNro,
      },
    });

    revalidatePath('/cuotas');
    revalidatePath('/ventas');
    revalidatePath('/caja');
    return { success: true, recibo_nro: reciboNro };
  } catch (error: any) {
    console.error('Error registrando pago de cuota:', error);
    return { success: false, error: 'No se pudo procesar el pago de la cuota del vehículo.' };
  }
}

// 2. COBRO DE CUOTA DE PRÉSTAMO PERSONAL
export async function registrarPagoCuotaPrestamo(
  id_cuota: number,
  data: { monto_cobrado_ars: number; cotizacion_dia: number }
) {
  try {
    const tenant = await getTenantContext();

    const timestamp = Date.now().toString().slice(-5);
    const reciboNro = `REC-P-${new Date().getFullYear()}-${timestamp}`;

    await db.prestamoCuota.update({
      where: { id_cuota, tenantId: tenant.id },
      data: {
        estado: 'PAGADA',
        monto_pagado_ars: data.monto_cobrado_ars,
        cotizacion_pago: data.cotizacion_dia,
        fecha_pago: new Date(),
        recibo_nro: reciboNro,
      },
    });

    // Verificar si el préstamo se saldó por completo
    const cuota = await db.prestamoCuota.findUnique({
      where: { id_cuota, tenantId: tenant.id },
    });

    if (cuota) {
      const pendientes = await db.prestamoCuota.count({
        where: {
          id_prestamo: cuota.id_prestamo,
          tenantId: tenant.id,
          estado: 'PENDIENTE',
        },
      });

      if (pendientes === 0) {
        await db.prestamo.update({
          where: { id_prestamo: cuota.id_prestamo, tenantId: tenant.id },
          data: { estado: 'FINALIZADO' },
        });
      }
    }

    revalidatePath('/cuotas');
    revalidatePath('/prestamos');
    revalidatePath('/caja');
    return { success: true, recibo_nro: reciboNro };
  } catch (error: any) {
    console.error('Error registrando pago de cuota de préstamo:', error);
    return { success: false, error: 'No se pudo procesar el pago de la cuota del préstamo.' };
  }
}