'use server';

import { prisma as db } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function crearUsuario(data: { nombre: string, email: string, password_plana: string, rol: 'Admin' | 'Vendedor' | 'RRHH' }) {
    try {
        const existe = await db.usuario.findUnique({ where: { email: data.email } });
        if (existe) return { success: false, error: 'El email ya está registrado.' };

        // Encriptamos la clave antes de guardarla (NUNCA guardar claves planas)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password_plana, salt);

        await db.usuario.create({
            data: {
                nombre: data.nombre,
                email: data.email,
                password: hashedPassword,
                rol: data.rol
            }
        });

        revalidatePath('/usuarios');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Error al crear usuario.' };
    }
}