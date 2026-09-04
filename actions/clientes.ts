'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const CLIENT_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];

function clean(data: any) {
  return {
    nombre_completo: String(data.nombre_completo || '').trim(),
    dni: String(data.dni || '').trim() || null,
    cuit_cuil: String(data.cuit_cuil || '').trim() || null,
    telefono: String(data.telefono || '').trim() || null,
    email: String(data.email || '').trim().toLowerCase() || null,
    domicilio: String(data.domicilio || '').trim() || null,
    localidad: String(data.localidad || '').trim() || null,
    provincia: String(data.provincia || '').trim() || null,
    notas: String(data.notas || '').trim() || null,
  };
}

export async function guardarCliente(data: any) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CLIENT_ROLES);
    const normalized = clean(data);
    if (!normalized.nombre_completo) return { success: false, error: 'El nombre completo es obligatorio.' };

    const cliente = await db.cliente.create({ data: { tenantId: tenant.id, ...normalized } });
    revalidatePath('/clientes');
    return { success: true, id_cliente: cliente.id_cliente };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'El DNI ya está registrado en esta concesionaria.' };
    console.error('Error guardando cliente:', error);
    return { success: false, error: 'Ocurrió un error al guardar el cliente.' };
  }
}

export async function actualizarCliente(id_cliente: number, data: any) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CLIENT_ROLES);
    const normalized = clean(data);
    if (!normalized.nombre_completo) return { success: false, error: 'El nombre completo es obligatorio.' };

    const existing = await db.cliente.findFirst({ where: { id_cliente, tenantId: tenant.id }, select: { id_cliente: true } });
    if (!existing) return { success: false, error: 'Cliente inexistente.' };

    await db.cliente.update({ where: { id_cliente }, data: normalized });
    revalidatePath('/clientes');
    revalidatePath(`/clientes/${id_cliente}`);
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: 'El DNI ya está registrado en esta concesionaria.' };
    console.error('Error actualizando cliente:', error);
    return { success: false, error: 'Ocurrió un error al actualizar el cliente.' };
  }
}
