import { prisma as db } from "@/lib/prisma";
import CuotasClient from "./CuotasClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CuotasPage() {
    // 1. Buscamos las ventas financiadas
    const ventasFinanciadas = await db.venta.findMany({
        where: { forma_pago: 'Cuotas' },
        include: { cliente: true, vehiculo: true, cuotas: { orderBy: { numero_cuota: 'asc' } } }
    });

    // 2. Buscamos los préstamos personales activos
    const prestamosActivos = await db.prestamo.findMany({
        include: { cliente: true, cuotas: { orderBy: { numero_cuota: 'asc' } } }
    });

    // 3. UNIFICAMOS TODO EN UNA SOLA CARTERA Y LIMPIAMOS DECIMALES Y FECHAS
    const carteraUnificada = [
        ...ventasFinanciadas.map(v => ({
            id_operacion: `VTA-${v.id_venta}`,
            tipo_operacion: 'VENTA',
            cliente: v.cliente,
            detalle_operacion: `${v.vehiculo?.marca} ${v.vehiculo?.modelo} [${v.vehiculo?.patente}]`,
            cuotas: v.cuotas.map(c => ({
                id_cuota_real: c.id_cuota,
                numero_cuota: c.numero_cuota,
                monto_usd: Number(c.monto_usd),
                estado: c.estado,
                monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
                fecha_vto_str: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toISOString() : null,
                fecha_pago_str: c.fecha_pago ? new Date(c.fecha_pago).toISOString() : null,
            }))
        })),
        ...prestamosActivos.map(p => ({
            id_operacion: `PRE-${p.id_prestamo}`,
            tipo_operacion: 'PRESTAMO',
            cliente: p.cliente,
            detalle_operacion: `Préstamo Personal #${p.id_prestamo}`,
            cuotas: p.cuotas.map(c => ({
                id_cuota_real: c.id_cuota,
                numero_cuota: c.numero_cuota,
                monto_usd: Number(c.monto_usd),
                estado: c.estado,
                monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
                fecha_vto_str: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toISOString() : null,
                fecha_pago_str: c.fecha_pago ? new Date(c.fecha_pago).toISOString() : null,
            }))
        }))
    ];

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <CuotasClient carteraInicial={carteraUnificada} />
        </Suspense>
    );
}