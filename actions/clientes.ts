'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function guardarCliente(data: { nombre_completo: string, dni?: string, telefono?: string, email?: string, domicilio?: string }) {
    try {
        await db.cliente.create({
            data: {
                nombre_completo: data.nombre_completo,
                dni: data.dni || null,
                telefono: data.telefono || null,
                email: data.email || null,
                domicilio: data.domicilio || null,
            }
        });
        revalidatePath('/clientes');
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, error: 'El DNI ya está registrado en otro cliente.' };
        return { success: false, error: 'Ocurrió un error al guardar el cliente.' };
    }
}

export async function actualizarCliente(id_cliente: number, data: { nombre_completo: string, dni?: string, telefono?: string, email?: string, domicilio?: string }) {
    try {
        await db.cliente.update({
            where: { id_cliente },
            data: {
                nombre_completo: data.nombre_completo,
                dni: data.dni || null,
                telefono: data.telefono || null,
                email: data.email || null,
                domicilio: data.domicilio || null,
            }
        });
        revalidatePath('/clientes');
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') return { success: false, error: 'El DNI ya está registrado en otro cliente.' };
        return { success: false, error: 'Ocurrió un error al actualizar el cliente.' };
    }
}