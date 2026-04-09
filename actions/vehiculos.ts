'use server';

import { prisma as db } from '@/lib/prisma';
import { vehiculoSchema, VehiculoFormData } from '@/schemas/vehiculoSchema';
import { revalidatePath } from 'next/cache';


// Normalización Bimonetaria (PRIORIDAD ARS) portada de tu helpers.php
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

async function getDolarActual() {
  const cfg = await db.configuracion.findUnique({ where: { clave: 'dolar_blue' } });
  return cfg ? parseFloat(cfg.valor) : 1000;
}

export async function guardarVehiculo(data: any) {
  try {
    await db.vehiculo.create({
      data: {
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio,
        km: data.km,
        patente: data.patente,
        vin: data.vin,
        motor: data.motor,
        transmision: data.transmision,
        traccion: data.traccion,
        color: data.color,
        puertas: data.puertas,
        estado: data.estado,
        tipo_ingreso: data.tipo_ingreso,
        comision_consignacion_pct: parseFloat(data.comision_consignacion_pct) || 0,
        // FORZAMOS EL GUARDADO EXACTO COMO DECIMALES (Sin recálculos)
        precio_compra_ars: parseFloat(data.precio_compra_ars) || 0,
        precio_compra_usd: parseFloat(data.precio_compra_usd) || 0,
        precio_venta_ars: parseFloat(data.precio_venta_ars) || 0,
        precio_venta_usd: parseFloat(data.precio_venta_usd) || 0,
      }
    });

    revalidatePath('/vehiculos');
    return { success: true };
  } catch (error) {
    console.error("Error guardando vehículo:", error);
    return { success: false, error: 'Ocurrió un error al guardar el vehículo.' };
  }
}

export async function actualizarVehiculo(id: number, data: any) {
  try {
    await db.vehiculo.update({
      where: { id_vehiculo: id },
      data: {
        marca: data.marca,
        modelo: data.modelo,
        anio: data.anio,
        km: data.km,
        patente: data.patente,
        vin: data.vin,
        motor: data.motor,
        transmision: data.transmision,
        traccion: data.traccion,
        color: data.color,
        puertas: data.puertas,
        estado: data.estado,
        tipo_ingreso: data.tipo_ingreso,
        comision_consignacion_pct: parseFloat(data.comision_consignacion_pct) || 0,
        // FORZAMOS EL GUARDADO EXACTO COMO DECIMALES
        precio_compra_ars: parseFloat(data.precio_compra_ars) || 0,
        precio_compra_usd: parseFloat(data.precio_compra_usd) || 0,
        precio_venta_ars: parseFloat(data.precio_venta_ars) || 0,
        precio_venta_usd: parseFloat(data.precio_venta_usd) || 0,
      }
    });

    revalidatePath('/vehiculos');
    revalidatePath(`/vehiculos/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando vehículo:", error);
    return { success: false, error: 'Ocurrió un error al actualizar el vehículo.' };
  }
}

export async function cambiarEstadoVehiculo(id: number, nuevoEstado: any) {
  try {
    await db.vehiculo.update({
      where: { id_vehiculo: id },
      data: { estado: nuevoEstado }
    });
    revalidatePath('/vehiculos');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al cambiar estado' };
  }
}

// Reemplaza a api/vehiculos.php (Se usa en el Cotizador de Ventas)
export async function buscarVehiculosParaVenta(term: string) {
  const dolarBlue = await getDolarActual();
  const vehiculos = await db.vehiculo.findMany({
    where: {
      estado: { in: ['LISTO_PARA_VENTA', 'EN_PREPARACION', 'EN_CONSIGNACION'] },
      OR: [
        { marca: { contains: term } },
        { modelo: { contains: term } },
        { patente: { contains: term } }
      ]
    },
    orderBy: [{ marca: 'asc' }, { modelo: 'asc' }]
  });

  return vehiculos.map(v => {
    const venta = normalizePair(Number(v.precio_venta_usd), Number(v.precio_venta_ars), dolarBlue);
    return {
      id_vehiculo: v.id_vehiculo,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio,
      km: v.km,
      patente: v.patente,
      estado: v.estado,
      precio_venta_usd: venta.usd,
      precio_venta_ars: venta.ars,
      cotizacion_usd_ars: dolarBlue
    };
  });
}