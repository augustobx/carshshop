'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

export async function registrarConsignacion(data: {
  id_cliente: number;
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  km: number;
  precio_venta_ars: number;
  comision_pct: number;
  cotizacion_dolar: number;
}) {
  try {
    const tenant = await getTenantContext();
    const cotizacion = data.cotizacion_dolar > 0 ? data.cotizacion_dolar : (tenant.settings?.dolarActual || 1400);

    const precioVentaUsd = data.precio_venta_ars / cotizacion;
    const costoArs = data.precio_venta_ars * (1 - data.comision_pct / 100);
    const costoUsd = costoArs / cotizacion;

    await db.vehiculo.create({
      data: {
        tenantId: tenant.id,
        locationId: tenant.primaryLocationId || null,
        id_cliente: data.id_cliente,
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio,
        patente: data.patente.toUpperCase().trim(),
        km: data.km,
        tipo_ingreso: 'Consignacion',
        estado: 'LISTO_PARA_VENTA',
        precio_venta_ars: data.precio_venta_ars,
        precio_venta_usd: precioVentaUsd,
        precio_compra_ars: costoArs,
        precio_compra_usd: costoUsd,
        costo_total_real_usd: costoUsd,
        comision_consignacion_pct: data.comision_pct,
        fecha_ingreso: new Date(),
      },
    });

    revalidatePath('/consignaciones');
    revalidatePath('/vehiculos');
    revalidatePath('/ventas/nueva');
    return { success: true };
  } catch (error: any) {
    console.error('Error registrando consignación:', error);
    return { success: false, error: error.message || 'Ocurrió un error al registrar el vehículo.' };
  }
}

export async function liquidarConsignacion(
  id_vehiculo: number,
  data: {
    monto_ars: number;
    cotizacion_dolar: number;
    descripcion: string;
  }
) {
  try {
    const tenant = await getTenantContext();
    const cotizacion = data.cotizacion_dolar > 0 ? data.cotizacion_dolar : (tenant.settings?.dolarActual || 1400);
    const montoUsd = data.monto_ars / cotizacion;

    await db.gasto.create({
      data: {
        tenantId: tenant.id,
        locationId: tenant.primaryLocationId || null,
        id_vehiculo,
        descripcion: data.descripcion,
        categoria: 'Pago a Consignante',
        tipo_movimiento: 'EGRESO',
        monto_ars: data.monto_ars,
        monto_usd: montoUsd,
        fecha: new Date(),
      },
    });

    revalidatePath('/consignaciones');
    revalidatePath('/caja');
    return { success: true };
  } catch (error: any) {
    console.error('Error liquidando consignación:', error);
    return { success: false, error: error.message || 'Ocurrió un error al registrar el pago.' };
  }
}