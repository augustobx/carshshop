'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const FINANCE_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];

export async function registrarPrestamo(data: {
  id_cliente: number;
  capital_entregado_usd: number;
  total_devolver_usd: number;
  cotizacion_dolar: number;
  cuotas: { numero_cuota: number; monto_usd: number; fecha_vencimiento: string }[];
}) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, FINANCE_ROLES);

    const capital = Number(data.capital_entregado_usd);
    const total = Number(data.total_devolver_usd);
    const rate = Number(data.cotizacion_dolar);
    if (capital <= 0 || total < capital || rate <= 0) return { success: false, error: 'Capital, total a devolver o cotización inválidos.' };
    if (!data.cuotas?.length) return { success: false, error: 'El préstamo requiere un plan de cuotas.' };

    const cliente = await db.cliente.findFirst({ where: { id_cliente: data.id_cliente, tenantId: tenant.id } });
    if (!cliente) return { success: false, error: 'El cliente seleccionado no pertenece a esta concesionaria.' };

    const cuotas = data.cuotas.map((c, index) => ({
      numero_cuota: Number(c.numero_cuota || index + 1),
      monto_usd: Number(c.monto_usd),
      fecha_vencimiento: new Date(c.fecha_vencimiento),
    }));
    if (cuotas.some((c) => c.monto_usd <= 0 || Number.isNaN(c.fecha_vencimiento.getTime()))) return { success: false, error: 'El plan de cuotas contiene valores inválidos.' };

    const result = await db.$transaction(async (tx) => {
      const prestamo = await tx.prestamo.create({ data: { tenantId: tenant.id, id_cliente: data.id_cliente, capital_entregado_usd: capital, total_devolver_usd: total, cotizacion_dolar_prestamo: rate, fecha_prestamo: new Date(), estado: 'ACTIVO' } });
      await tx.prestamoCuota.createMany({ data: cuotas.map((c) => ({ tenantId: tenant.id, id_prestamo: prestamo.id_prestamo, numero_cuota: c.numero_cuota, monto_usd: c.monto_usd, fecha_vencimiento: c.fecha_vencimiento, estado: 'PENDIENTE' })) });
      return prestamo;
    });

    revalidatePath('/prestamos'); revalidatePath('/cuotas'); revalidatePath('/caja');
    return { success: true, id_prestamo: result.id_prestamo };
  } catch (error) {
    console.error('Error registrando préstamo:', error);
    return { success: false, error: 'Ocurrió un error al registrar el préstamo.' };
  }
}
