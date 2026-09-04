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
  prospectoId?: number;
  cotizacionId?: number;
}) {
  try {
    const tenant = await getTenantContext();
    const timestamp = Date.now().toString().slice(-6);
    const reciboNro = `RES-${new Date().getFullYear()}-${timestamp}`;

    await db.$transaction(async (tx) => {
      await tx.senia.create({
        data: {
          tenantId: tenant.id,
          locationId: data.locationId || tenant.primaryLocationId || null,
          id_vehiculo: data.id_vehiculo,
          id_cliente: data.id_cliente,
          prospectoId: data.prospectoId || null,
          cotizacionId: data.cotizacionId || null,
          monto_ars: data.monto_ars,
          monto_usd: data.monto_usd,
          cotizacion: data.cotizacion,
          fecha_senia: new Date(data.fecha_senia),
          fecha_limite: data.fecha_limite ? new Date(data.fecha_limite) : null,
          estado: 'ACTIVA',
          recibo_nro: reciboNro,
        },
      });

      await tx.vehiculo.update({
        where: { id_vehiculo: data.id_vehiculo },
        data: { estado: 'SENADO' },
      });

      if (data.prospectoId) {
        await tx.prospecto.updateMany({
          where: { id_prospecto: data.prospectoId, tenantId: tenant.id },
          data: { estado: 'RESERVADO', id_cliente: data.id_cliente },
        });
      }

      if (data.cotizacionId) {
        await tx.cotizacion.updateMany({
          where: { id_cotizacion: data.cotizacionId, tenantId: tenant.id },
          data: { estado: 'ACEPTADA', id_cliente: data.id_cliente },
        });
      }
    });

    revalidatePath(`/vehiculos/${data.id_vehiculo}`);
    revalidatePath('/vehiculos');
    revalidatePath('/prospectos');
    if (data.prospectoId) revalidatePath(`/prospectos/${data.prospectoId}`);
    return { success: true, recibo_nro: reciboNro };
  } catch (error) {
    console.error('Error guardando seña:', error);
    return { success: false, error: 'Ocurrió un error al guardar la seña.' };
  }
}

export async function cancelarSenia(id_senia: number, id_vehiculo: number) {
  try {
    const tenant = await getTenantContext();
    const senia = await db.senia.findFirst({
      where: { id_senia, tenantId: tenant.id, id_vehiculo },
      select: { id_senia: true, prospectoId: true, cotizacionId: true },
    });

    if (!senia) return { success: false, error: 'La reserva no existe.' };

    await db.$transaction(async (tx) => {
      await tx.senia.update({
        where: { id_senia: senia.id_senia },
        data: { estado: 'CANCELADA' },
      });

      const seniasActivas = await tx.senia.count({
        where: { id_vehiculo, tenantId: tenant.id, estado: 'ACTIVA' },
      });

      if (seniasActivas === 0) {
        await tx.vehiculo.update({
          where: { id_vehiculo },
          data: { estado: 'LISTO_PARA_VENTA' },
        });
      }

      if (senia.cotizacionId) {
        await tx.cotizacion.updateMany({
          where: { id_cotizacion: senia.cotizacionId, tenantId: tenant.id },
          data: { estado: 'ENVIADA' },
        });
      }

      if (senia.prospectoId) {
        await tx.prospecto.updateMany({
          where: { id_prospecto: senia.prospectoId, tenantId: tenant.id },
          data: { estado: senia.cotizacionId ? 'COTIZADO' : 'NEGOCIACION' },
        });
      }
    });

    revalidatePath(`/vehiculos/${id_vehiculo}`);
    revalidatePath('/vehiculos');
    revalidatePath('/prospectos');
    if (senia.prospectoId) revalidatePath(`/prospectos/${senia.prospectoId}`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelando seña:', error);
    return { success: false, error: 'Ocurrió un error al cancelar la seña.' };
  }
}
