'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function agregarAnotacion(idVehiculo: number, texto: string) {
    try {
        // 1. Obtenemos el usuario que está logueado en este momento
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !(session.user as any).id) {
            return { success: false, error: 'Sesión expirada o usuario no válido.' };
        }

        const idUsuario = parseInt((session.user as any).id);

        // 2. Guardamos la nota relacionándola al vehículo y al usuario
        await db.anotacion.create({
            data: {
                id_vehiculo: idVehiculo,
                id_usuario: idUsuario, // ¡Acá está el dato que faltaba!
                texto: texto
            }
        });

        // 3. Recargamos la página del vehículo
        revalidatePath(`/vehiculos/${idVehiculo}`);
        return { success: true };

    } catch (error: any) {
        console.error("Error agregando anotación:", error);
        return { success: false, error: 'No se pudo guardar la anotación en la base de datos.' };
    }
}