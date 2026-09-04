'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

export async function guardarCliente(data: {
  nombre_completo: string;
  dni?: string;
  cuit_cuil?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  localidad?: string;
  provincia?: string;
  notas?: string;
}) {
  try {
    const tenant = await getTenantContext();

    await db.cliente.create({
      data: {
        tenantId: tenant.id,
        nombre_completo: data.nombre_completo.trim(),
        dni: data.dni ? data.dni.trim() : null,
        cuit_cuil: data.cuit_cuil ? data.cuit_cuil.trim() : null,
        telefono: data.telefono || null,
        email: data.email || null,
        domicilio: data.domicilio || null,
        localidad: data.localidad || null,
        provincia: data.provincia || null,
        notas: data.notas || null,
      },
    });

    revalidatePath('/clientes');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'El DNI ya está registrado en esta concesionaria.' };
    }
    console.error('Error guardando cliente:', error);
    return { success: false, error: 'Ocurrió un error al guardar el cliente.' };
  }
}

export async function actualizarCliente(
  id_cliente: number,
  data: {
    nombre_completo: string;
    dni?: string;
    cuit_cuil?: string;
    telefono?: string;
    email?: string;
    domicilio?: string;
    localidad?: string;
    provincia?: string;
    notas?: string;
  }
) {
  try {
    const tenant = await getTenantContext();

    await db.cliente.update({
      where: { id_cliente, tenantId: tenant.id },
      data: {
        nombre_completo: data.nombre_completo.trim(),
        dni: data.dni ? data.dni.trim() : null,
        cuit_cuil: data.cuit_cuil ? data.cuit_cuil.trim() : null,
        telefono: data.telefono || null,
        email: data.email || null,
        domicilio: data.domicilio || null,
        localidad: data.localidad || null,
        provincia: data.provincia || null,
        notas: data.notas || null,
      },
    });

    revalidatePath('/clientes');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: 'El DNI ya está registrado en esta concesionaria.' };
    }
    console.error('Error actualizando cliente:', error);
    return { success: false, error: 'Ocurrió un error al actualizar el cliente.' };
  }
}