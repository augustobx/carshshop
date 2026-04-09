'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function registrarVenta(data: {
    id_vehiculo: number,
    id_cliente: number,
    precio_final_usd: number,
    cotizacion_dolar: number,
    forma_pago: 'Contado' | 'Cuotas',
    cuotas?: { numero_cuota: number, monto_usd: number, fecha_vencimiento: string }[]
}) {
    try {
        // Transacción segura: Todo o nada
        const result = await db.$transaction(async (tx) => {

            // 1. Crear la Venta principal
            const venta = await tx.venta.create({
                data: {
                    id_vehiculo: data.id_vehiculo,
                    id_cliente: data.id_cliente,
                    precio_final_usd: data.precio_final_usd,
                    cotizacion_dolar_venta: data.cotizacion_dolar,
                    forma_pago: data.forma_pago,
                    // Si tienes Auth implementado, aquí iría el id del vendedor en sesión
                }
            });

            // 2. Si es financiado, inyectar el plan de cuotas exacto del cotizador
            if (data.forma_pago === 'Cuotas' && data.cuotas && data.cuotas.length > 0) {
                await tx.ventaCuota.createMany({
                    data: data.cuotas.map(c => ({
                        id_venta: venta.id_venta,
                        numero_cuota: c.numero_cuota,
                        monto_usd: c.monto_usd,
                        fecha_vencimiento: new Date(c.fecha_vencimiento),
                        estado: 'PENDIENTE'
                    }))
                });
            }

            // 3. Cambiar estado del Vehículo a VENDIDO
            await tx.vehiculo.update({
                where: { id_vehiculo: data.id_vehiculo },
                data: { estado: 'VENDIDO' }
            });

            // 4. Cancelar cualquier Seña que haya estado activa en este auto
            await tx.senia.updateMany({
                where: { id_vehiculo: data.id_vehiculo, estado: 'ACTIVA' },
                data: { estado: 'CANCELADA' }
            });

            return venta;
        });

        revalidatePath('/vehiculos');
        revalidatePath('/ventas');
        return { success: true, id_venta: result.id_venta };
    } catch (error) {
        console.error("Error crítico en transacción de venta:", error);
        return { success: false, error: 'Ocurrió un error al registrar la venta. La operación fue abortada.' };
    }
}