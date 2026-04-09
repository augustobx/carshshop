'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function agregarAnotacion(idVehiculo: number, texto: string) {
    try {
        await db.anotacion.create({
            data: {
                id_vehiculo: idVehiculo,
                texto: texto
            }
        });

        // Recarga la página del vehículo para mostrar la nueva nota al instante
        revalidatePath(`/vehiculos/${idVehiculo}`);
        return { success: true };
    } catch (error) {
        console.error("Error agregando anotación:", error);
        return { success: false, error: 'No se pudo guardar la anotación.' };
    }
}