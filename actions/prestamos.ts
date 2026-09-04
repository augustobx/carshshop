'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

export async function registrarPrestamo(data: {
  id_cliente: number;
  capital_entregado_usd: number;
  total_devolver_usd: number;
  cotizacion_dolar: number;
  cuotas: { numero_cuota: number; monto_usd: number; fecha_vencimiento: string }[];
}) {
  try {
    const tenant = await getTenantContext();

    const result = await db.$transaction(async (tx) => {
      // 1. Crear el Préstamo principal con tenantId
      const prestamo = await tx.prestamo.create({
        data: {
          tenantId: tenant.id,
          id_cliente: data.id_cliente,
          capital_entregado_usd: data.capital_entregado_usd,
          total_devolver_usd: data.total_devolver_usd,
          cotizacion_dolar_prestamo: data.cotizacion_dolar,
          fecha_prestamo: new Date(),
          estado: 'ACTIVO',
        },
      });

      // 2. Inyectar plan de cuotas con tenantId
      if (data.cuotas && data.cuotas.length > 0) {
        await tx.prestamoCuota.createMany({
          data: data.cuotas.map((c) => ({
            tenantId: tenant.id,
            id_prestamo: prestamo.id_prestamo,
            numero_cuota: c.numero_cuota,
            monto_usd: c.monto_usd,
            fecha_vencimiento: new Date(c.fecha_vencimiento),
            estado: 'PENDIENTE',
          })),
        });
      }

      return prestamo;
    });

    revalidatePath('/prestamos');
    revalidatePath('/cuotas');
    revalidatePath('/caja');
    return { success: true, id_prestamo: result.id_prestamo };
  } catch (error: any) {
    console.error('Error registrando préstamo:', error);
    return { success: false, error: 'Ocurrió un error al registrar el préstamo.' };
  }
}