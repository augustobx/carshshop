'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function subirFotoVehiculo(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const idVehiculo = parseInt(formData.get('idVehiculo') as string);

        if (!file || isNaN(idVehiculo)) {
            return { success: false, error: 'Datos inválidos' };
        }

        // Convertimos la imagen a Base64 para guardarla fácilmente
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const url_foto = `data:${file.type};base64,${base64}`;

        await db.vehiculoFoto.create({
            data: {
                id_vehiculo: idVehiculo,
                url_foto: url_foto
            }
        });

        revalidatePath(`/vehiculos/${idVehiculo}`);
        return { success: true };
    } catch (error) {
        console.error("Error subiendo foto:", error);
        return { success: false, error: 'Error al procesar la imagen.' };
    }
}

export async function eliminarFotoVehiculo(idFoto: number, idVehiculo: number) {
    try {
        await db.vehiculoFoto.delete({
            where: { id_foto: idFoto }
        });

        revalidatePath(`/vehiculos/${idVehiculo}`);
        return { success: true };
    } catch (error) {
        console.error("Error eliminando foto:", error);
        return { success: false, error: 'Error al eliminar la imagen.' };
    }
}