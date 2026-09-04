'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const CONSIGNMENT_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];
const LIQUIDATION_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];
const TYPES = ['Auto', 'Moto', 'Camioneta', 'Utilitario', 'Camion'];

export async function registrarConsignacion(data: {
  id_cliente: number; tipo_vehiculo?: string; marca: string; modelo: string; anio: number; patente: string; km: number;
  precio_venta_ars: number; comision_pct: number; cotizacion_dolar: number;
}) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CONSIGNMENT_ROLES);
    const cliente = await db.cliente.findFirst({ where: { id_cliente: data.id_cliente, tenantId: tenant.id } });
    if (!cliente) return { success: false, error: 'El titular seleccionado no pertenece a esta concesionaria.' };
    const tipo = data.tipo_vehiculo || 'Auto';
    if (!TYPES.includes(tipo)) return { success: false, error: 'Tipo de vehículo inválido.' };
    const precioArs = Number(data.precio_venta_ars); const comision = Number(data.comision_pct); const cotizacion = Number(data.cotizacion_dolar) > 0 ? Number(data.cotizacion_dolar) : Number(tenant.settings?.dolarActual || 1400);
    if (!data.marca?.trim() || !data.modelo?.trim() || precioArs <= 0 || comision < 0 || comision > 100 || cotizacion <= 0) return { success: false, error: 'Completá vehículo, precio, comisión y cotización correctamente.' };

    const precioVentaUsd = precioArs / cotizacion;
    const costoArs = precioArs * (1 - comision / 100);
    const costoUsd = costoArs / cotizacion;
    const v = await db.vehiculo.create({ data: {
      tenantId: tenant.id, locationId: tenant.primaryLocationId || null, id_cliente: data.id_cliente,
      tipo_vehiculo: tipo, marca: data.marca.trim(), modelo: data.modelo.trim(), anio: Number(data.anio) || null,
      patente: data.patente?.trim() ? data.patente.toUpperCase().trim() : null, km: Math.max(0, Number(data.km || 0)),
      tipo_ingreso: 'Consignacion', estado: 'LISTO_PARA_VENTA', precio_venta_ars: precioArs, precio_venta_usd: precioVentaUsd,
      precio_compra_ars: costoArs, precio_compra_usd: costoUsd, costo_total_real_usd: costoUsd, comision_consignacion_pct: comision, fecha_ingreso: new Date(),
    } });

    revalidatePath('/consignaciones'); revalidatePath('/vehiculos'); revalidatePath('/motos'); revalidatePath('/ventas/nueva');
    return { success: true, id_vehiculo: v.id_vehiculo };
  } catch (error: any) {
    console.error('Error registrando consignación:', error);
    if (error?.code === 'P2002') return { success: false, error: 'La patente ya está registrada.' };
    return { success: false, error: 'Ocurrió un error al registrar la consignación.' };
  }
}

export async function liquidarConsignacion(id_vehiculo: number, data: { monto_ars: number; cotizacion_dolar: number; descripcion: string }) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, LIQUIDATION_ROLES);
    const vehiculo = await db.vehiculo.findFirst({ where: { id_vehiculo, tenantId: tenant.id, tipo_ingreso: 'Consignacion' } });
    if (!vehiculo) return { success: false, error: 'Consignación inexistente.' };
    const amount = Number(data.monto_ars); const rate = Number(data.cotizacion_dolar) > 0 ? Number(data.cotizacion_dolar) : Number(tenant.settings?.dolarActual || 1400);
    if (amount <= 0 || rate <= 0 || !data.descripcion?.trim()) return { success: false, error: 'Monto, cotización y descripción son obligatorios.' };

    await db.gasto.create({ data: { tenantId: tenant.id, locationId: vehiculo.locationId || tenant.primaryLocationId || null, id_vehiculo, descripcion: data.descripcion.trim(), categoria: 'Pago a Consignante', tipo_movimiento: 'EGRESO', monto_ars: amount, monto_usd: amount / rate, fecha: new Date() } });
    revalidatePath('/consignaciones'); revalidatePath('/caja'); revalidatePath(`/vehiculos/${id_vehiculo}`);
    return { success: true };
  } catch (error) { console.error('Error liquidando consignación:', error); return { success: false, error: 'Ocurrió un error al registrar el pago.' }; }
}
