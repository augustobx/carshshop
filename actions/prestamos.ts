'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function registrarPrestamo(data: {
    id_cliente: number,
    capital_entregado_usd: number, // Guardamos USD histórico para balance
    total_devolver_usd: number,
    cotizacion_dolar: number,
    cuotas: { numero_cuota: number, monto_usd: number, fecha_vencimiento: string }[]
}) {
    try {
        const result = await db.$transaction(async (tx) => {

            // 1. Crear el Préstamo principal
            const prestamo = await tx.prestamo.create({
                data: {
                    id_cliente: data.id_cliente,
                    capital_entregado_usd: data.capital_entregado_usd,
                    total_devolver_usd: data.total_devolver_usd,
                    cotizacion_dolar_prestamo: data.cotizacion_dolar,
                    fecha_prestamo: new Date(),
                    estado: 'ACTIVO'
                }
            });

            // 2. Inyectar el plan de cuotas exacto del cotizador
            if (data.cuotas && data.cuotas.length > 0) {
                await tx.prestamoCuota.createMany({
                    data: data.cuotas.map(c => ({
                        id_prestamo: prestamo.id_prestamo,
                        numero_cuota: c.numero_cuota,
                        monto_usd: c.monto_usd,
                        fecha_vencimiento: new Date(c.fecha_vencimiento),
                        estado: 'PENDIENTE'
                    }))
                });
            }

            return prestamo;
        });

        revalidatePath('/prestamos');
        revalidatePath('/caja'); // Porque salió plata de la caja
        return { success: true, id_prestamo: result.id_prestamo };
    } catch (error) {
        console.error("Error crítico en transacción de préstamo:", error);
        return { success: false, error: 'Ocurrió un error al registrar el préstamo. La operación fue abortada.' };
    }
}