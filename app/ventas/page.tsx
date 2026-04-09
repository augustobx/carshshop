import { prisma as db } from "@/lib/prisma";
import VentasClient from "./VentasClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
    const ventasDb = await db.venta.findMany({
        orderBy: { fecha_venta: 'desc' },
        include: {
            cliente: true,
            vehiculo: true,
            cuotas: {
                orderBy: { numero_cuota: 'asc' }
            }
        }
    });

    // LIMPIEZA PROFUNDA DE DECIMALES (Incluyendo los del vehículo anidado)
    const ventasPlanas = ventasDb.map(v => ({
        ...v,
        precio_final_usd: Number(v.precio_final_usd),
        cotizacion_dolar_venta: Number(v.cotizacion_dolar_venta),
        vehiculo: v.vehiculo ? {
            ...v.vehiculo,
            precio_compra_usd: Number(v.vehiculo.precio_compra_usd),
            precio_compra_ars: Number(v.vehiculo.precio_compra_ars),
            precio_venta_usd: Number(v.vehiculo.precio_venta_usd),
            precio_venta_ars: Number(v.vehiculo.precio_venta_ars),
            comision_consignacion_pct: Number(v.vehiculo.comision_consignacion_pct),
        } : null,
        cuotas: v.cuotas.map(c => ({
            ...c,
            monto_usd: Number(c.monto_usd),
            monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
            cotizacion_pago: c.cotizacion_pago ? Number(c.cotizacion_pago) : null,
        }))
    }));

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <VentasClient ventas={ventasPlanas} />
        </Suspense>
    );
}