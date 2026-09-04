'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

export async function guardarSenia(data: {
  id_vehiculo: number;
  id_cliente: number;
  monto_ars: number;
  monto_usd: number;
  cotizacion: number;
  fecha_senia: string;
  fecha_limite?: string;
  locationId?: string;
}) {
  try {
    const tenant = await getTenantContext();
    const timestamp = Date.now().toString().slice(-5);
    const reciboNro = `RES-${new Date().getFullYear()}-${timestamp}`;

    await db.$transaction(async (tx) => {
      // 1. Crear registro de seña vinculado al tenant
      await tx.senia.create({
        data: {
          tenantId: tenant.id,
          locationId: data.locationId || tenant.primaryLocationId || null,
          id_vehiculo: data.id_vehiculo,
          id_cliente: data.id_cliente,
          monto_ars: data.monto_ars,
          monto_usd: data.monto_usd,
          cotizacion: data.cotizacion,
          fecha_senia: new Date(data.fecha_senia),
          fecha_limite: data.fecha_limite ? new Date(data.fecha_limite) : null,
          estado: 'ACTIVA',
          recibo_nro: reciboNro,
        },
      });

      // 2. Cambiar estado del vehículo a "SENADO" dentro del tenant
      await tx.vehiculo.update({
        where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id },
        data: { estado: 'SENADO' },
      });
    });

    revalidatePath(`/vehiculos/${data.id_vehiculo}`);
    revalidatePath('/vehiculos');
    return { success: true, recibo_nro: reciboNro };
  } catch (error: any) {
    console.error('Error guardando seña:', error);
    return { success: false, error: 'Ocurrió un error al guardar la seña.' };
  }
}

export async function cancelarSenia(id_senia: number, id_vehiculo: number) {
  try {
    const tenant = await getTenantContext();

    await db.$transaction(async (tx) => {
      // 1. Marcar seña como cancelada
      await tx.senia.update({
        where: { id_senia, tenantId: tenant.id },
        data: { estado: 'CANCELADA' },
      });

      // 2. Verificar si quedan otras señas activas
      const seniasActivas = await tx.senia.count({
        where: { id_vehiculo, tenantId: tenant.id, estado: 'ACTIVA' },
      });

      if (seniasActivas === 0) {
        await tx.vehiculo.update({
          where: { id_vehiculo, tenantId: tenant.id },
          data: { estado: 'LISTO_PARA_VENTA' },
        });
      }
    });

    revalidatePath(`/vehiculos/${id_vehiculo}`);
    revalidatePath('/vehiculos');
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelando seña:', error);
    return { success: false, error: 'Ocurrió un error al cancelar la seña.' };
  }
}