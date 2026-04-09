'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function guardarSenia(data: {
    id_vehiculo: number,
    id_cliente: number,
    monto_ars: number,
    monto_usd: number,
    cotizacion: number,
    fecha_senia: string
}) {
    try {
        // 1. Crear el registro de la seña
        await db.senia.create({
            data: {
                id_vehiculo: data.id_vehiculo,
                id_cliente: data.id_cliente,
                monto_ars: data.monto_ars,
                monto_usd: data.monto_usd,
                cotizacion: data.cotizacion,
                fecha_senia: new Date(data.fecha_senia),
                estado: 'ACTIVA'
            }
        });

        // 2. Cambiar el estado del vehículo a "SEÑADO" automáticamente
        await db.vehiculo.update({
            where: { id_vehiculo: data.id_vehiculo },
            data: { estado: 'SENADO' }
        });

        // Recargar la página del vehículo para ver los cambios
        revalidatePath(`/vehiculos/${data.id_vehiculo}`);
        return { success: true };
    } catch (error) {
        console.error("Error guardando seña:", error);
        return { success: false, error: 'Ocurrió un error al guardar la seña.' };
    }
}

export async function cancelarSenia(id_senia: number, id_vehiculo: number) {
    try {
        // 1. Marcar la seña actual como cancelada
        await db.senia.update({
            where: { id_senia },
            data: { estado: 'CANCELADA' }
        });

        // 2. Verificar si quedan otras señas activas para este auto
        const seniasActivas = await db.senia.count({
            where: { id_vehiculo, estado: 'ACTIVA' }
        });

        // Si no quedan señas, devolvemos el auto a "LISTO PARA VENTA"
        if (seniasActivas === 0) {
            await db.vehiculo.update({
                where: { id_vehiculo },
                data: { estado: 'LISTO_PARA_VENTA' }
            });
        }

        revalidatePath(`/vehiculos/${id_vehiculo}`);
        return { success: true };
    } catch (error) {
        console.error("Error cancelando seña:", error);
        return { success: false, error: 'Ocurrió un error al cancelar la seña.' };
    }
}