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

export async function guardarVehiculo(data: VehiculoFormData) {
  try {
    const validatedData = vehiculoSchema.parse(data);
    const dolarBlue = await getDolarActual();

    const compra = normalizePair(validatedData.precio_compra_usd, validatedData.precio_compra_ars, dolarBlue);
    const venta = normalizePair(validatedData.precio_venta_usd, validatedData.precio_venta_ars, dolarBlue);

    const vehiculo = await db.vehiculo.create({
      data: {
        ...validatedData,
        precio_compra_usd: compra.usd,
        precio_compra_ars: compra.ars,
        precio_venta_usd: venta.usd,
        precio_venta_ars: venta.ars,
      }
    });

    revalidatePath('/vehiculos');
    return { success: true, id: vehiculo.id_vehiculo };
  } catch (error) {
    console.error("Error al guardar:", error);
    return { success: false, error: 'Error al guardar el vehículo' };
  }
}

export async function actualizarVehiculo(id: number, data: VehiculoFormData) {
  try {
    const validatedData = vehiculoSchema.parse(data);
    const dolarBlue = await getDolarActual();

    const compra = normalizePair(validatedData.precio_compra_usd, validatedData.precio_compra_ars, dolarBlue);
    const venta = normalizePair(validatedData.precio_venta_usd, validatedData.precio_venta_ars, dolarBlue);

    await db.vehiculo.update({
      where: { id_vehiculo: id },
      data: {
        ...validatedData,
        precio_compra_usd: compra.usd,
        precio_compra_ars: compra.ars,
        precio_venta_usd: venta.usd,
        precio_venta_ars: venta.ars,
      }
    });

    revalidatePath('/vehiculos');
    revalidatePath(`/vehiculos/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar:", error);
    return { success: false, error: 'Error al actualizar el vehículo' };
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