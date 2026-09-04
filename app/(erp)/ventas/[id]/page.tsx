import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import VentaDetalleClient from "./VentaDetalleClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VentaDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const idVenta = Number(id);
    if (!Number.isInteger(idVenta)) return notFound();

    const tenant = await getTenantContext();
    const ventaDb = await db.venta.findUnique({
        where: { id_venta: idVenta, tenantId: tenant.id },
        include: { cliente: true, vehiculo: true, cuotas: { orderBy: { numero_cuota: 'asc' } }, entrega: true, cotizacion: true }
    });
    if (!ventaDb) return notFound();

    const venta = {
        ...ventaDb,
        precio_final_usd: Number(ventaDb.precio_final_usd),
        cotizacion_dolar_venta: Number(ventaDb.cotizacion_dolar_venta || tenant.settings?.dolarActual || 1400),
        anticipo_usd: Number(ventaDb.anticipo_usd || 0),
        saldo_financiado_usd: Number(ventaDb.saldo_financiado_usd || 0),
        comision_vendedor_usd: Number(ventaDb.comision_vendedor_usd || 0),
        valor_toma_permuta_usd: Number(ventaDb.valor_toma_permuta_usd || 0),
        vehiculo: ventaDb.vehiculo ? {
            ...ventaDb.vehiculo,
            precio_compra_usd: Number(ventaDb.vehiculo.precio_compra_usd || 0),
            precio_compra_ars: Number(ventaDb.vehiculo.precio_compra_ars || 0),
            precio_venta_usd: Number(ventaDb.vehiculo.precio_venta_usd || 0),
            precio_venta_ars: Number(ventaDb.vehiculo.precio_venta_ars || 0),
            comision_consignacion_pct: Number(ventaDb.vehiculo.comision_consignacion_pct || 0),
        } : null,
        cotizacion: ventaDb.cotizacion ? {
            ...ventaDb.cotizacion,
            precio_final_usd: Number(ventaDb.cotizacion.precio_final_usd),
            cotizacion_dolar: Number(ventaDb.cotizacion.cotizacion_dolar),
        } : null,
        cuotas: ventaDb.cuotas.map(c => ({
            ...c,
            monto_usd: Number(c.monto_usd),
            monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
            cotizacion_pago: c.cotizacion_pago ? Number(c.cotizacion_pago) : null,
        }))
    };

    return <VentaDetalleClient venta={venta} />;
}
