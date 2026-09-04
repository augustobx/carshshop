'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

// Normalización Bimonetaria
function normalizePair(usd: number, ars: number, dolar: number) {
  let finalUsd = Number(usd) || 0;
  let finalArs = Number(ars) || 0;
  if (finalArs > 0 && dolar > 0) {
    finalUsd = finalArs / dolar;
  } else if (finalUsd > 0 && dolar > 0) {
    finalArs = finalUsd * dolar;
  }
  return { usd: finalUsd, ars: finalArs };
}

export async function guardarVehiculo(data: any) {
  try {
    const tenant = await getTenantContext();

    const precioCompraUsd = parseFloat(data.precio_compra_usd) || 0;
    const gastosPrep = parseFloat(data.gastos_preparacion_usd) || 0;
    const gastosGest = parseFloat(data.gastos_gestoria_usd) || 0;
    const costoTotalReal = precioCompraUsd + gastosPrep + gastosGest;

    await db.vehiculo.create({
      data: {
        tenantId: tenant.id,
        locationId: data.locationId || tenant.primaryLocationId || null,
        tipo_vehiculo: data.tipo_vehiculo || 'Auto',
        marca: data.marca,
        modelo: data.modelo,
        version: data.version || null,
        cilindrada: data.cilindrada || null,
        anio: data.anio ? parseInt(data.anio) : null,
        km: data.km ? parseInt(data.km) : null,
        patente: data.patente ? data.patente.toUpperCase().trim() : null,
        vin: data.vin || null,
        motor: data.motor || null,
        transmision: data.transmision || null,
        traccion: data.traccion || null,
        color: data.color || null,
        puertas: data.puertas ? parseInt(data.puertas) : null,
        estado: data.estado || 'EN_PREPARACION',
        tipo_ingreso: data.tipo_ingreso || 'Propio',
        comision_consignacion_pct: parseFloat(data.comision_consignacion_pct) || 0,
        precio_compra_ars: parseFloat(data.precio_compra_ars) || 0,
        precio_compra_usd: precioCompraUsd,
        precio_venta_ars: parseFloat(data.precio_venta_ars) || 0,
        precio_venta_usd: parseFloat(data.precio_venta_usd) || 0,
        gastos_preparacion_usd: gastosPrep,
        gastos_gestoria_usd: gastosGest,
        costo_total_real_usd: costoTotalReal,
        notas_internas: data.notas_internas || null,
      },
    });

    revalidatePath('/vehiculos');
    return { success: true };
  } catch (error: any) {
    console.error('Error guardando vehículo:', error);
    return { success: false, error: 'Ocurrió un error al guardar el vehículo.' };
  }
}

export async function actualizarVehiculo(id: number, data: any) {
  try {
    const tenant = await getTenantContext();

    const precioCompraUsd = parseFloat(data.precio_compra_usd) || 0;
    const gastosPrep = parseFloat(data.gastos_preparacion_usd) || 0;
    const gastosGest = parseFloat(data.gastos_gestoria_usd) || 0;
    const costoTotalReal = precioCompraUsd + gastosPrep + gastosGest;

    await db.vehiculo.update({
      where: {
        id_vehiculo: id,
        tenantId: tenant.id,
      },
      data: {
        locationId: data.locationId !== undefined ? data.locationId : undefined,
        tipo_vehiculo: data.tipo_vehiculo,
        marca: data.marca,
        modelo: data.modelo,
        version: data.version || null,
        cilindrada: data.cilindrada || null,
        anio: data.anio ? parseInt(data.anio) : null,
        km: data.km ? parseInt(data.km) : null,
        patente: data.patente ? data.patente.toUpperCase().trim() : null,
        vin: data.vin,
        motor: data.motor,
        transmision: data.transmision,
        traccion: data.traccion,
        color: data.color,
        puertas: data.puertas ? parseInt(data.puertas) : null,
        estado: data.estado,
        tipo_ingreso: data.tipo_ingreso,
        comision_consignacion_pct: parseFloat(data.comision_consignacion_pct) || 0,
        precio_compra_ars: parseFloat(data.precio_compra_ars) || 0,
        precio_compra_usd: precioCompraUsd,
        precio_venta_ars: parseFloat(data.precio_venta_ars) || 0,
        precio_venta_usd: parseFloat(data.precio_venta_usd) || 0,
        gastos_preparacion_usd: gastosPrep,
        gastos_gestoria_usd: gastosGest,
        costo_total_real_usd: costoTotalReal,
        notas_internas: data.notas_internas || null,
      },
    });

    revalidatePath('/vehiculos');
    revalidatePath(`/vehiculos/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando vehículo:', error);
    return { success: false, error: 'Ocurrió un error al actualizar el vehículo.' };
  }
}

export async function cambiarEstadoVehiculo(id: number, nuevoEstado: any) {
  try {
    const tenant = await getTenantContext();
    await db.vehiculo.update({
      where: { id_vehiculo: id, tenantId: tenant.id },
      data: { estado: nuevoEstado },
    });
    revalidatePath('/vehiculos');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al cambiar estado' };
  }
}

// Búsqueda para cotizador de ventas protegida por tenant
export async function buscarVehiculosParaVenta(term: string) {
  const tenant = await getTenantContext();
  const dolarBlue = tenant.settings?.dolarActual || 1400;

  const vehiculos = await db.vehiculo.findMany({
    where: {
      tenantId: tenant.id,
      estado: { in: ['LISTO_PARA_VENTA', 'EN_PREPARACION', 'EN_CONSIGNACION'] },
      OR: [
        { marca: { contains: term } },
        { modelo: { contains: term } },
        { patente: { contains: term } },
      ],
    },
    include: {
      location: true,
    },
    orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
    take: 20,
  });

  return vehiculos.map((v) => {
    const venta = normalizePair(Number(v.precio_venta_usd), Number(v.precio_venta_ars), dolarBlue);
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
      cotizacion_usd_ars: dolarBlue,
    };
  });
}