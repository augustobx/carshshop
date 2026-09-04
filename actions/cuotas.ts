'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const COLLECTION_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];

function validPayment(data: { monto_cobrado_ars: number; cotizacion_dia: number }) {
  return Number(data.monto_cobrado_ars) > 0 && Number(data.cotizacion_dia) > 0;
}

export async function registrarPagoCuota(id_cuota: number, data: { monto_cobrado_ars: number; cotizacion_dia: number }) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, COLLECTION_ROLES);
    if (!validPayment(data)) return { success: false, error: 'Monto cobrado y cotización deben ser mayores a cero.' };

    const cuota = await db.ventaCuota.findFirst({ where: { id_cuota, tenantId: tenant.id }, include: { venta: { select: { id_venta: true } } } });
    if (!cuota) return { success: false, error: 'Cuota inexistente.' };
    if (cuota.estado === 'PAGADA') return { success: false, error: 'La cuota ya figura como pagada.' };

    const reciboNro = `REC-V-${new Date().getFullYear()}-${String(id_cuota).padStart(7, '0')}`;
    await db.ventaCuota.update({ where: { id_cuota }, data: { estado: 'PAGADA', monto_pagado_ars: Number(data.monto_cobrado_ars), cotizacion_pago: Number(data.cotizacion_dia), fecha_pago: new Date(), recibo_nro: reciboNro } });

    revalidatePath('/cuotas'); revalidatePath('/ventas'); revalidatePath(`/ventas/${cuota.venta.id_venta}`); revalidatePath('/caja');
    return { success: true, recibo_nro: reciboNro };
  } catch (error) { console.error('Error registrando pago de cuota:', error); return { success: false, error: 'No se pudo procesar el pago de la cuota del vehículo.' }; }
}

export async function registrarPagoCuotaPrestamo(id_cuota: number, data: { monto_cobrado_ars: number; cotizacion_dia: number }) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, COLLECTION_ROLES);
    if (!validPayment(data)) return { success: false, error: 'Monto cobrado y cotización deben ser mayores a cero.' };

    const cuota = await db.prestamoCuota.findFirst({ where: { id_cuota, tenantId: tenant.id } });
    if (!cuota) return { success: false, error: 'Cuota inexistente.' };
    if (cuota.estado === 'PAGADA') return { success: false, error: 'La cuota ya figura como pagada.' };

    const reciboNro = `REC-P-${new Date().getFullYear()}-${String(id_cuota).padStart(7, '0')}`;
    await db.$transaction(async (tx) => {
      await tx.prestamoCuota.update({ where: { id_cuota }, data: { estado: 'PAGADA', monto_pagado_ars: Number(data.monto_cobrado_ars), cotizacion_pago: Number(data.cotizacion_dia), fecha_pago: new Date(), recibo_nro: reciboNro } });
      const pendientes = await tx.prestamoCuota.count({ where: { id_prestamo: cuota.id_prestamo, tenantId: tenant.id, estado: 'PENDIENTE' } });
      if (!pendientes) await tx.prestamo.update({ where: { id_prestamo: cuota.id_prestamo }, data: { estado: 'FINALIZADO' } });
    });

    revalidatePath('/cuotas'); revalidatePath('/prestamos'); revalidatePath('/caja');
    return { success: true, recibo_nro: reciboNro };
  } catch (error) { console.error('Error registrando pago de préstamo:', error); return { success: false, error: 'No se pudo procesar el pago de la cuota del préstamo.' }; }
}
