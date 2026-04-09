import { prisma as db } from "@/lib/prisma";
import VentaDetalleClient from "./VentaDetalleClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VentaDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const idVenta = parseInt(resolvedParams.id);

    if (isNaN(idVenta)) return notFound();

    const ventaDb = await db.venta.findUnique({
        where: { id_venta: idVenta },
        include: {
            cliente: true,
            vehiculo: true,
            cuotas: {
                orderBy: { numero_cuota: 'asc' }
            }
        }
    });

    if (!ventaDb) return notFound();

    // LIMPIEZA ABSOLUTA DE DECIMALES PARA NEXT.JS
    const ventaPlana = {
        ...ventaDb,
        precio_final_usd: Number(ventaDb.precio_final_usd),
        cotizacion_dolar_venta: Number(ventaDb.cotizacion_dolar_venta),
        vehiculo: ventaDb.vehiculo ? {
            ...ventaDb.vehiculo,
            precio_compra_usd: Number(ventaDb.vehiculo.precio_compra_usd),
            precio_compra_ars: Number(ventaDb.vehiculo.precio_compra_ars),
            precio_venta_usd: Number(ventaDb.vehiculo.precio_venta_usd),
            precio_venta_ars: Number(ventaDb.vehiculo.precio_venta_ars),
            comision_consignacion_pct: Number(ventaDb.vehiculo.comision_consignacion_pct),
        } : null,
        cuotas: ventaDb.cuotas.map(c => ({
            ...c,
            monto_usd: Number(c.monto_usd),
            monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
            cotizacion_pago: c.cotizacion_pago ? Number(c.cotizacion_pago) : null,
        }))
    };

    return <VentaDetalleClient venta={ventaPlana} />;
}