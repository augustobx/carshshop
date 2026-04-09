'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function registrarMovimiento(data: {
    descripcion: string,
    tipo: 'INGRESO' | 'EGRESO',
    monto_ars: number,
    cotizacion_dia: number,
    categoria: string
}) {
    try {
        // Mantenemos la regla de oro: El ARS es el rey, el USD se calcula
        const montoUsd = parseFloat((data.monto_ars / data.cotizacion_dia).toFixed(2));

        // Asumiendo que tu tabla se llama "gasto" o "movimiento". 
        // Si se llama distinto en tu Prisma, ajustá el nombre aquí (ej: db.movimientoCaja.create)
        await db.gasto.create({
            data: {
                descripcion: data.descripcion,
                categoria: data.categoria,
                tipo_movimiento: data.tipo, // INGRESO o EGRESO
                monto_ars: data.monto_ars,
                monto_usd: montoUsd,
                fecha: new Date(),
            }
        });

        revalidatePath('/caja');
        return { success: true };
    } catch (error) {
        console.error("Error registrando movimiento en caja:", error);
        return { success: false, error: 'Ocurrió un error al registrar el movimiento.' };
    }
}