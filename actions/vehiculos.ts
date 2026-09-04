'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const INVENTORY_ADMIN = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];
const INVENTORY_STATUS = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO, RolMembresia.TALLER];
const SALES_SEARCH = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR];
const VEHICLE_TYPES = ['Auto', 'Moto', 'Camioneta', 'Utilitario', 'Camion'];
const OPERATIONAL_STATES = ['EN_PREPARACION', 'LISTO_PARA_VENTA', 'EN_CONSIGNACION', 'VENDIDO'];

function normalizePair(usd: number, ars: number, dolar: number) {
  let finalUsd = Number(usd) || 0; let finalArs = Number(ars) || 0;
  if (finalArs > 0 && dolar > 0) finalUsd = finalArs / dolar; else if (finalUsd > 0 && dolar > 0) finalArs = finalUsd * dolar;
  return { usd: finalUsd, ars: finalArs };
}

function normalizeOperationalState(state: string | undefined, tipoIngreso: string | null | undefined, pendingTasks = 0) {
  if (!state || state === 'SENADO') {
    if (tipoIngreso === 'Consignacion') return 'EN_CONSIGNACION';
    return pendingTasks > 0 ? 'EN_PREPARACION' : 'LISTO_PARA_VENTA';
  }
  return OPERATIONAL_STATES.includes(state) ? state : 'EN_PREPARACION';
}

async function validateLocation(tenantId: string, locationId?: string | null) {
  if (!locationId) return true;
  return Boolean(await db.location.findFirst({ where: { id: locationId, tenantId, isActive: true } }));
}

export async function guardarVehiculo(data: any) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, INVENTORY_ADMIN);
    const count = await db.vehiculo.count({ where: { tenantId: tenant.id, estado: { not: 'VENDIDO' } } });
    if (count >= tenant.plan.maxVehicles) return { success: false, error: `El plan ${tenant.plan.name} permite hasta ${tenant.plan.maxVehicles} unidades activas en stock.` };
    if (!(await validateLocation(tenant.id, data.locationId))) return { success: false, error: 'La sucursal seleccionada no es válida.' };
    if (!data.marca?.trim() || !data.modelo?.trim()) return { success: false, error: 'Marca y modelo son obligatorios.' };
    if (!VEHICLE_TYPES.includes(data.tipo_vehiculo || 'Auto')) return { success: false, error: 'Tipo de vehículo inválido.' };

    const dolar = Number(tenant.settings?.dolarActual || 1400);
    const compra = normalizePair(Number(data.precio_compra_usd), Number(data.precio_compra_ars), dolar);
    const venta = normalizePair(Number(data.precio_venta_usd), Number(data.precio_venta_ars), dolar);
    const gastosPrep = Math.max(0, Number(data.gastos_preparacion_usd) || 0); const gastosGest = Math.max(0, Number(data.gastos_gestoria_usd) || 0);
    const estado = normalizeOperationalState(data.estado, data.tipo_ingreso || 'Propio');

    const v = await db.vehiculo.create({ data: {
      tenantId: tenant.id, locationId: data.locationId || tenant.primaryLocationId || null,
      tipo_vehiculo: data.tipo_vehiculo || 'Auto', marca: data.marca.trim(), modelo: data.modelo.trim(), version: data.version?.trim() || null, cilindrada: data.cilindrada?.trim() || null,
      anio: data.anio ? Number(data.anio) : null, km: data.km !== undefined && data.km !== '' ? Math.max(0, Number(data.km)) : null,
      patente: data.patente ? String(data.patente).toUpperCase().trim() : null, vin: data.vin?.trim() || null, motor: data.motor?.trim() || null, combustible: data.combustible?.trim() || null,
      transmision: data.transmision?.trim() || null, traccion: data.traccion?.trim() || null, color: data.color?.trim() || null, puertas: data.puertas ? Number(data.puertas) : null,
      estado: estado as any, tipo_ingreso: data.tipo_ingreso || 'Propio', comision_consignacion_pct: Math.max(0, Number(data.comision_consignacion_pct) || 0),
      precio_compra_ars: compra.ars, precio_compra_usd: compra.usd, precio_venta_ars: venta.ars, precio_venta_usd: venta.usd,
      gastos_preparacion_usd: gastosPrep, gastos_gestoria_usd: gastosGest, costo_total_real_usd: compra.usd + gastosPrep + gastosGest,
      notas_internas: data.notas_internas?.trim() || null,
    } });

    revalidatePath('/vehiculos'); revalidatePath('/motos'); revalidatePath('/ventas/nueva');
    return { success: true, id_vehiculo: v.id_vehiculo };
  } catch (error: any) {
    console.error('Error guardando vehículo:', error);
    if (error?.code === 'P2002') return { success: false, error: 'La patente ya está registrada en esta concesionaria.' };
    return { success: false, error: 'Ocurrió un error al guardar el vehículo.' };
  }
}

export async function actualizarVehiculo(id: number, data: any) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, INVENTORY_ADMIN);
    const existing = await db.vehiculo.findFirst({ where: { id_vehiculo: id, tenantId: tenant.id } });
    if (!existing) return { success: false, error: 'Vehículo inexistente.' };
    if (!(await validateLocation(tenant.id, data.locationId))) return { success: false, error: 'La sucursal seleccionada no es válida.' };
    if (!data.marca?.trim() || !data.modelo?.trim()) return { success: false, error: 'Marca y modelo son obligatorios.' };
    if (data.tipo_vehiculo && !VEHICLE_TYPES.includes(data.tipo_vehiculo)) return { success: false, error: 'Tipo de vehículo inválido.' };

    const pendingTasks = await db.tarea.count({ where: { tenantId: tenant.id, id_vehiculo: id, estado_tarea: 'PENDIENTE' } });
    const dolar = Number(tenant.settings?.dolarActual || 1400);
    const compra = normalizePair(Number(data.precio_compra_usd), Number(data.precio_compra_ars), dolar);
    const venta = normalizePair(Number(data.precio_venta_usd), Number(data.precio_venta_ars), dolar);
    const gastosPrep = Math.max(0, Number(data.gastos_preparacion_usd) || 0); const gastosGest = Math.max(0, Number(data.gastos_gestoria_usd) || 0);
    const tipoIngreso = data.tipo_ingreso || existing.tipo_ingreso;
    const estado = normalizeOperationalState(data.estado, tipoIngreso, pendingTasks);

    await db.vehiculo.update({ where: { id_vehiculo: id }, data: {
      locationId: data.locationId !== undefined ? data.locationId || null : undefined, tipo_vehiculo: data.tipo_vehiculo,
      marca: data.marca.trim(), modelo: data.modelo.trim(), version: data.version?.trim() || null, cilindrada: data.cilindrada?.trim() || null,
      anio: data.anio ? Number(data.anio) : null, km: data.km !== undefined && data.km !== '' ? Math.max(0, Number(data.km)) : null,
      patente: data.patente ? String(data.patente).toUpperCase().trim() : null, vin: data.vin?.trim() || null, motor: data.motor?.trim() || null, combustible: data.combustible?.trim() || null,
      transmision: data.transmision?.trim() || null, traccion: data.traccion?.trim() || null, color: data.color?.trim() || null, puertas: data.puertas ? Number(data.puertas) : null,
      estado: estado as any, tipo_ingreso: data.tipo_ingreso, comision_consignacion_pct: Math.max(0, Number(data.comision_consignacion_pct) || 0),
      precio_compra_ars: compra.ars, precio_compra_usd: compra.usd, precio_venta_ars: venta.ars, precio_venta_usd: venta.usd,
      gastos_preparacion_usd: gastosPrep, gastos_gestoria_usd: gastosGest, costo_total_real_usd: compra.usd + gastosPrep + gastosGest,
      notas_internas: data.notas_internas?.trim() || null,
    } });

    revalidatePath('/vehiculos'); revalidatePath('/motos'); revalidatePath(`/vehiculos/${id}`); revalidatePath('/ventas/nueva');
    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando vehículo:', error);
    if (error?.code === 'P2002') return { success: false, error: 'La patente ya está registrada en esta concesionaria.' };
    return { success: false, error: 'Ocurrió un error al actualizar el vehículo.' };
  }
}

export async function cambiarEstadoVehiculo(id: number, nuevoEstado: any) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, INVENTORY_STATUS);
    if (!OPERATIONAL_STATES.includes(String(nuevoEstado))) return { success: false, error: 'Estado operativo inválido.' };
    const updated = await db.vehiculo.updateMany({ where: { id_vehiculo: id, tenantId: tenant.id }, data: { estado: nuevoEstado } });
    if (!updated.count) return { success: false, error: 'Vehículo inexistente.' };
    revalidatePath('/vehiculos'); revalidatePath('/motos'); revalidatePath(`/vehiculos/${id}`); revalidatePath('/ventas/nueva');
    return { success: true };
  } catch (error) { console.error('Error cambiando estado:', error); return { success: false, error: 'Error al cambiar estado.' }; }
}

export async function buscarVehiculosParaVenta(term: string) {
  const tenant = await getTenantContext();
  await requireTenantRole(tenant.id, SALES_SEARCH);
  const dolar = Number(tenant.settings?.dolarActual || 1400);
  const q = term.trim();
  const vehiculos = await db.vehiculo.findMany({
    where: { tenantId: tenant.id, estado: { in: ['LISTO_PARA_VENTA', 'EN_PREPARACION', 'EN_CONSIGNACION'] }, ...(q ? { OR: [{ marca: { contains: q } }, { modelo: { contains: q } }, { patente: { contains: q } }, { vin: { contains: q } }] } : {}) },
    include: { location: true, senias: { where: { estado: 'ACTIVA' }, select: { id_senia: true }, take: 1 } }, orderBy: [{ marca: 'asc' }, { modelo: 'asc' }], take: 30,
  });
  return vehiculos.map((v) => { const ventaUsd = Number(v.precio_venta_usd) || 0; const ventaArs = ventaUsd > 0 ? ventaUsd * dolar : Number(v.precio_venta_ars) || 0; return { id_vehiculo: v.id_vehiculo, tipo_vehiculo: v.tipo_vehiculo, marca: v.marca, modelo: v.modelo, version: v.version, anio: v.anio, km: v.km, patente: v.patente, estado: v.estado, reservado: v.senias.length > 0, sucursal: v.location?.name || 'Central', precio_venta_usd: ventaUsd, precio_venta_ars: ventaArs, cotizacion_usd_ars: dolar }; });
}
