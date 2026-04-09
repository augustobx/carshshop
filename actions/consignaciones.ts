'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function registrarConsignacion(data: {
    id_cliente: number;
    marca: string;
    modelo: string;
    anio: number;
    patente: string;
    km: number;
    precio_venta_ars: number; // <- AHORA RECIBE PESOS
    comision_pct: number;
    cotizacion_dolar: number;
}) {
    try {
        // MATEMÁTICA ARS PRIMERO
        const precioVentaUsd = data.precio_venta_ars / data.cotizacion_dolar;

        // Calculamos el costo (lo que le damos al dueño) descontando la comisión
        const costoArs = data.precio_venta_ars * (1 - (data.comision_pct / 100));
        const costoUsd = costoArs / data.cotizacion_dolar;

        await db.vehiculo.create({
            data: {
                id_cliente: data.id_cliente,
                marca: data.marca,
                modelo: data.modelo,
                anio: data.anio,
                patente: data.patente.toUpperCase(),
                km: data.km,
                tipo_ingreso: 'CONSIGNACION',
                estado: 'LISTO_PARA_VENTA',
                precio_venta_ars: data.precio_venta_ars,
                precio_venta_usd: precioVentaUsd,
                precio_compra_ars: costoArs,
                precio_compra_usd: costoUsd,
                comision_consignacion_pct: data.comision_pct,
                fecha_ingreso: new Date()
            }
        });

        revalidatePath('/consignaciones');
        revalidatePath('/vehiculos');
        revalidatePath('/ventas/nueva');
        return { success: true };
    } catch (error: any) {
        console.error("Error registrando consignación:", error);
        // Ahora si falla, devolvemos el error exacto de Prisma para que lo veas en pantalla
        return { success: false, error: error.message || 'Ocurrió un error al registrar el vehículo.' };
    }
}

export async function liquidarConsignacion(id_vehiculo: number, data: {
    monto_ars: number,
    cotizacion_dolar: number,
    descripcion: string
}) {
    try {
        const montoUsd = data.monto_ars / data.cotizacion_dolar;

        // Registramos la salida de dinero en la Caja general
        await db.gasto.create({
            data: {
                descripcion: data.descripcion,
                categoria: 'Pago a Consignante',
                tipo_movimiento: 'EGRESO',
                monto_ars: data.monto_ars,
                monto_usd: montoUsd,
                fecha: new Date(),
            }
        });

        // Opcional: Si en tu base tenés un estado de liquidación, se actualizaría acá.
        // Por ahora, el registro en la caja es el comprobante oficial.

        revalidatePath('/consignaciones');
        revalidatePath('/caja');
        return { success: true };
    } catch (error: any) {
        console.error("Error liquidando consignación:", error);
        return { success: false, error: error.message || 'Ocurrió un error al registrar el pago al dueño.' };
    }
}