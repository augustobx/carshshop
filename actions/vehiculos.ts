'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

function normalizePair(usd: number, ars: number, dolar: number) {
  let finalUsd = Number(usd) || 0;
  let finalArs = Number(ars) || 0;
  if (finalArs > 0 && dolar > 0) finalUsd = finalArs / dolar;
  else if (finalUsd > 0 && dolar > 0) finalArs = finalUsd * dolar;
  return { usd: finalUsd, ars: finalArs };
}

export async function guardarVehiculo(data: any) {
  try {
    const tenant = await getTenantContext();
    const dolar = Number(tenant.settings?.dolarActual || 1400);
    const compra = normalizePair(Number(data.precio_compra_usd), Number(data.precio_compra_ars), dolar);
    const venta = normalizePair(Number(data.precio_venta_usd), Number(data.precio_venta_ars), dolar);
    const gastosPrep = Number(data.gastos_preparacion_usd) || 0;
    const gastosGest = Number(data.gastos_gestoria_usd) || 0;
    const costoTotalReal = compra.usd + gastosPrep + gastosGest;

    await db.vehiculo.create({
      data: {
        tenantId: tenant.id,
        locationId: data.locationId || tenant.primaryLocationId || null,
        tipo_vehiculo: data.tipo_vehiculo || 'Auto',
        marca: data.marca?.trim() || null,
        modelo: data.modelo?.trim() || null,
        version: data.version?.trim() || null,
        cilindrada: data.cilindrada?.trim() || null,
        anio: data.anio ? Number(data.anio) : null,
        km: data.km !== undefined && data.km !== '' ? Number(data.km) : null,
        patente: data.patente ? String(data.patente).toUpperCase().trim() : null,
        vin: data.vin?.trim() || null,
        motor: data.motor?.trim() || null,
        combustible: data.combustible?.trim() || null,
        transmision: data.transmision?.trim() || null,
        traccion: data.traccion?.trim() || null,
        color: data.color?.trim() || null,
        puertas: data.puertas ? Number(data.puertas) : null,
        estado: data.estado || 'EN_PREPARACION',
        tipo_ingreso: data.tipo_ingreso || 'Propio',
        comision_consignacion_pct: Number(data.comision_consignacion_pct) || 0,
        precio_compra_ars: compra.ars,
        precio_compra_usd: compra.usd,
        precio_venta_ars: venta.ars,
        precio_venta_usd: venta.usd,
        gastos_preparacion_usd: gastosPrep,
        gastos_gestoria_usd: gastosGest,
        costo_total_real_usd: costoTotalReal,
        notas_internas: data.notas_internas || null,
      },
    });

    revalidatePath('/vehiculos');
    revalidatePath('/motos');
    revalidatePath('/ventas/nueva');
    return { success: true };
  } catch (error) {
    console.error('Error guardando vehículo:', error);
    return { success: false, error: 'Ocurrió un error al guardar el vehículo.' };
  }
}

export async function actualizarVehiculo(id: number, data: any) {
  try {
    const tenant = await getTenantContext();
    const dolar = Number(tenant.settings?.dolarActual || 1400);
    const compra = normalizePair(Number(data.precio_compra_usd), Number(data.precio_compra_ars), dolar);
    const venta = normalizePair(Number(data.precio_venta_usd), Number(data.precio_venta_ars), dolar);
    const gastosPrep = Number(data.gastos_preparacion_usd) || 0;
    const gastosGest = Number(data.gastos_gestoria_usd) || 0;

    await db.vehiculo.update({
      where: { id_vehiculo: id, tenantId: tenant.id },
      data: {
        locationId: data.locationId !== undefined ? data.locationId : undefined,
        tipo_vehiculo: data.tipo_vehiculo,
        marca: data.marca?.trim() || null,
        modelo: data.modelo?.trim() || null,
        version: data.version?.trim() || null,
        cilindrada: data.cilindrada?.trim() || null,
        anio: data.anio ? Number(data.anio) : null,
        km: data.km !== undefined && data.km !== '' ? Number(data.km) : null,
        patente: data.patente ? String(data.patente).toUpperCase().trim() : null,
        vin: data.vin?.trim() || null,
        motor: data.motor?.trim() || null,
        combustible: data.combustible?.trim() || null,
        transmision: data.transmision?.trim() || null,
        traccion: data.traccion?.trim() || null,
        color: data.color?.trim() || null,
        puertas: data.puertas ? Number(data.puertas) : null,
        estado: data.estado,
        tipo_ingreso: data.tipo_ingreso,
        comision_consignacion_pct: Number(data.comision_consignacion_pct) || 0,
        precio_compra_ars: compra.ars,
        precio_compra_usd: compra.usd,
        precio_venta_ars: venta.ars,
        precio_venta_usd: venta.usd,
        gastos_preparacion_usd: gastosPrep,
        gastos_gestoria_usd: gastosGest,
        costo_total_real_usd: compra.usd + gastosPrep + gastosGest,
        notas_internas: data.notas_internas || null,
      },
    });

    revalidatePath('/vehiculos');
    revalidatePath('/motos');
    revalidatePath(`/vehiculos/${id}`);
    revalidatePath('/ventas/nueva');
    return { success: true };
  } catch (error) {
    console.error('Error actualizando vehículo:', error);
    return { success: false, error: 'Ocurrió un error al actualizar el vehículo.' };
  }
}

export async function cambiarEstadoVehiculo(id: number, nuevoEstado: any) {
  try {
    const tenant = await getTenantContext();
    await db.vehiculo.update({ where: { id_vehiculo: id, tenantId: tenant.id }, data: { estado: nuevoEstado } });
    revalidatePath('/vehiculos');
    revalidatePath('/motos');
    revalidatePath(`/vehiculos/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error cambiando estado de vehículo:', error);
    return { success: false, error: 'Error al cambiar estado' };
  }
}

export async function buscarVehiculosParaVenta(term: string) {
  const tenant = await getTenantContext();
  const dolar = Number(tenant.settings?.dolarActual || 1400);

  const vehiculos = await db.vehiculo.findMany({
    where: {
      tenantId: tenant.id,
      estado: { in: ['LISTO_PARA_VENTA', 'EN_PREPARACION', 'EN_CONSIGNACION'] },
      OR: [{ marca: { contains: term } }, { modelo: { contains: term } }, { patente: { contains: term } }],
    },
    include: { location: true },
    orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
    take: 20,
  });

  return vehiculos.map((v) => {
    const venta = normalizePair(Number(v.precio_venta_usd), Number(v.precio_venta_ars), dolar);
    return {
      id_vehiculo: v.id_vehiculo,
      marca: v.marca,
      modelo: v.modelo,
      version: v.version,
      anio: v.anio,
      km: v.km,
      patente: v.patente,
      estado: v.estado,
      sucursal: v.location?.name || 'Central',
      precio_venta_usd: venta.usd,
      precio_venta_ars: venta.ars,
      cotizacion_usd_ars: dolar,
    };
  });
}
