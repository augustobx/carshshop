import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import VentasClient from "./VentasClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
    const tenant = await getTenantContext();
    const dolarActual = Number(tenant.settings?.dolarActual || 1400);

    const ventasDb = await db.venta.findMany({
        where: { tenantId: tenant.id },
        orderBy: { fecha_venta: 'desc' },
        include: {
            cliente: true,
            vehiculo: true,
            cuotas: { orderBy: { numero_cuota: 'asc' } }
        }
    });

    const ventasPlanas = ventasDb.map(v => ({
        ...v,
        precio_final_usd: Number(v.precio_final_usd),
        cotizacion_dolar_venta: Number(v.cotizacion_dolar_venta),
        anticipo_usd: Number(v.anticipo_usd || 0),
        saldo_financiado_usd: Number(v.saldo_financiado_usd || 0),
        valor_toma_permuta_usd: Number(v.valor_toma_permuta_usd || 0),
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
            <VentasClient ventas={ventasPlanas} dolarActual={dolarActual} />
        </Suspense>
    );
}
