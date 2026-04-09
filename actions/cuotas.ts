'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 1. COBRO DE CUOTA DE VEHÍCULO
export async function registrarPagoCuota(id_cuota: number, data: { monto_cobrado_ars: number, cotizacion_dia: number }) {
    try {
        await db.ventaCuota.update({
            where: { id_cuota },
            data: {
                estado: 'PAGADA',
                monto_pagado_ars: data.monto_cobrado_ars,
                cotizacion_pago: data.cotizacion_dia,
                fecha_pago: new Date()
            }
        });

        revalidatePath('/cuotas');
        revalidatePath('/ventas');
        revalidatePath('/caja');
        return { success: true };
    } catch (error) {
        console.error("Error registrando pago de cuota:", error);
        return { success: false, error: 'No se pudo procesar el pago de la cuota del vehículo.' };
    }
}

// 2. COBRO DE CUOTA DE PRÉSTAMO PERSONAL
export async function registrarPagoCuotaPrestamo(id_cuota: number, data: { monto_cobrado_ars: number, cotizacion_dia: number }) {
    try {
        await db.prestamoCuota.update({
            where: { id_cuota },
            data: {
                estado: 'PAGADA',
                monto_pagado_ars: data.monto_cobrado_ars,
                cotizacion_pago: data.cotizacion_dia,
                fecha_pago: new Date()
            }
        });

        // Verificamos si el préstamo ya se saldó por completo para cerrarlo automáticamente
        const cuota = await db.prestamoCuota.findUnique({ where: { id_cuota } });
        if (cuota) {
            const pendientes = await db.prestamoCuota.count({
                where: { id_prestamo: cuota.id_prestamo, estado: 'PENDIENTE' }
            });
            if (pendientes === 0) {
                await db.prestamo.update({
                    where: { id_prestamo: cuota.id_prestamo },
                    data: { estado: 'FINALIZADO' }
                });
            }
        }

        revalidatePath('/cuotas');
        revalidatePath('/prestamos');
        revalidatePath('/caja');
        return { success: true };
    } catch (error) {
        console.error("Error registrando pago de cuota de préstamo:", error);
        return { success: false, error: 'No se pudo procesar el pago de la cuota del préstamo.' };
    }
}