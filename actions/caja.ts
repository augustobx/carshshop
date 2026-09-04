'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const CASH_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];

export async function registrarMovimiento(data: {
  descripcion: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto_ars: number;
  cotizacion_dia: number;
  categoria: string;
  id_vehiculo?: number;
  locationId?: string;
}) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CASH_ROLES);
    const descripcion = data.descripcion?.trim();
    const categoria = data.categoria?.trim();
    const montoArs = Number(data.monto_ars);
    const cotizacion = Number(data.cotizacion_dia) > 0 ? Number(data.cotizacion_dia) : Number(tenant.settings?.dolarActual || 1400);
    if (!descripcion || !categoria || montoArs <= 0 || !['INGRESO', 'EGRESO'].includes(data.tipo)) return { success: false, error: 'Completá tipo, concepto, categoría y monto correctamente.' };

    if (data.locationId && !(await db.location.findFirst({ where: { id: data.locationId, tenantId: tenant.id, isActive: true } }))) return { success: false, error: 'La sucursal seleccionada no es válida.' };
    let vehiculo = null;
    if (data.id_vehiculo) {
      vehiculo = await db.vehiculo.findFirst({ where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id } });
      if (!vehiculo) return { success: false, error: 'El vehículo vinculado no pertenece a esta concesionaria.' };
    }

    const montoUsd = Number((montoArs / cotizacion).toFixed(2));
    await db.$transaction(async (tx) => {
      await tx.gasto.create({ data: { tenantId: tenant.id, locationId: data.locationId || vehiculo?.locationId || tenant.primaryLocationId || null, descripcion, categoria, tipo_movimiento: data.tipo, monto_ars: montoArs, monto_usd: montoUsd, id_vehiculo: data.id_vehiculo || null, fecha: new Date() } });
      if (vehiculo && data.tipo === 'EGRESO') {
        const nuevosGastosPrep = Number(vehiculo.gastos_preparacion_usd || 0) + montoUsd;
        await tx.vehiculo.update({ where: { id_vehiculo: vehiculo.id_vehiculo }, data: { gastos_preparacion_usd: nuevosGastosPrep, costo_total_real_usd: Number(vehiculo.precio_compra_usd || 0) + nuevosGastosPrep + Number(vehiculo.gastos_gestoria_usd || 0) } });
      }
    });

    revalidatePath('/caja'); revalidatePath('/vehiculos'); revalidatePath('/motos');
    if (data.id_vehiculo) revalidatePath(`/vehiculos/${data.id_vehiculo}`);
    return { success: true };
  } catch (error) { console.error('Error registrando movimiento en caja:', error); return { success: false, error: 'Ocurrió un error al registrar el movimiento.' }; }
}
