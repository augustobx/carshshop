'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function guardarNotaVehiculo(id_vehiculo: number, nota: string) {
    try {
        await db.vehiculo.update({
            where: { id_vehiculo },
            data: { notas_internas: nota }
        });

        // Refrescamos la PWA y el ERP de escritorio para que sea en tiempo real
        revalidatePath(`/pwa/vehiculo/${id_vehiculo}`);
        revalidatePath('/vehiculos');
        return { success: true };
    } catch (error: any) {
        console.error("Error guardando nota:", error);
        // Ahora si falla, te va a decir el motivo exacto en la pantalla del celular
        return { success: false, error: `Error BD: ${error.message || 'Desconocido'}` };
    }
}