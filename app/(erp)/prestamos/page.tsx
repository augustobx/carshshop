import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import PrestamosClient from "./PrestamosClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrestamosPage() {
    const tenant = await getTenantContext();
    const dolarActual = Number(tenant.settings?.dolarActual || 1400);

    const prestamosDb = await db.prestamo.findMany({
        where: { tenantId: tenant.id },
        orderBy: { fecha_prestamo: 'desc' },
        include: { cliente: true, cuotas: { orderBy: { numero_cuota: 'asc' } } }
    });

    const prestamos = prestamosDb.map((p: any) => ({
        ...p,
        capital_entregado_usd: Number(p.capital_entregado_usd),
        total_devolver_usd: Number(p.total_devolver_usd),
        cotizacion_dolar_prestamo: Number(p.cotizacion_dolar_prestamo),
        fecha_str: p.fecha_prestamo.toISOString(),
        cuotas: p.cuotas.map((c: any) => ({
            ...c,
            monto_usd: Number(c.monto_usd),
            monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
            cotizacion_pago: c.cotizacion_pago ? Number(c.cotizacion_pago) : null,
            fecha_vto_str: c.fecha_vencimiento.toISOString(),
            fecha_pago_str: c.fecha_pago ? c.fecha_pago.toISOString() : null,
        }))
    }));

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <PrestamosClient prestamos={prestamos} dolarActual={dolarActual} />
        </Suspense>
    );
}
