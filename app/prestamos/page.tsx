import { prisma as db } from "@/lib/prisma";
import PrestamosClient from "./PrestamosClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrestamosPage() {
    // Buscamos todos los préstamos con sus clientes y cuotas
    const prestamosDb = await db.prestamo.findMany({
        orderBy: { fecha_prestamo: 'desc' },
        include: {
            cliente: true,
            cuotas: {
                orderBy: { numero_cuota: 'asc' }
            }
        }
    });

    // LIMPIEZA ABSOLUTA DE DECIMALES Y FECHAS (A prueba de balas para Next.js)
    const prestamosPlanos = prestamosDb.map((p: any) => ({
        ...p,
        capital_entregado_usd: Number(p.capital_entregado_usd),
        total_devolver_usd: Number(p.total_devolver_usd),
        cotizacion_dolar_prestamo: Number(p.cotizacion_dolar_prestamo),
        // Empaquetamos la fecha a texto seguro
        fecha_str: p.fecha_prestamo ? new Date(p.fecha_prestamo).toISOString() : new Date().toISOString(),
        cuotas: p.cuotas.map((c: any) => ({
            ...c,
            monto_usd: Number(c.monto_usd),
            monto_pagado_ars: c.monto_pagado_ars ? Number(c.monto_pagado_ars) : null,
            cotizacion_pago: c.cotizacion_pago ? Number(c.cotizacion_pago) : null,
            fecha_vto_str: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toISOString() : null,
            fecha_pago_str: c.fecha_pago ? new Date(c.fecha_pago).toISOString() : null,
        }))
    }));

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <PrestamosClient prestamos={prestamosPlanos} />
        </Suspense>
    );
}