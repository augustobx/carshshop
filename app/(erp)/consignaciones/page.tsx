import { prisma as db } from "@/lib/prisma";
import ConsignacionesClient from "./ConsignacionesClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConsignacionesPage() {
    // Traemos los clientes para el buscador
    const clientesDb = await db.cliente.findMany({
        orderBy: { nombre_completo: 'asc' }
    });

    // Traemos las consignaciones INCLUYENDO al cliente dueño
    const consignacionesDb = await db.vehiculo.findMany({
        where: { tipo_ingreso: 'CONSIGNACION' },
        include: { cliente: true }, // <- NUEVO
        orderBy: { fecha_ingreso: 'desc' }
    });

    const vehiculosPlanos = consignacionesDb.map(v => ({
        ...v,
        precio_compra_usd: Number(v.precio_compra_usd || 0),
        precio_compra_ars: Number(v.precio_compra_ars || 0),
        precio_venta_usd: Number(v.precio_venta_usd || 0),
        precio_venta_ars: Number(v.precio_venta_ars || 0),
        comision_consignacion_pct: Number(v.comision_consignacion_pct || 0),
        fecha_str: v.fecha_ingreso ? new Date(v.fecha_ingreso).toISOString() : new Date().toISOString()
    }));

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            {/* LE PASAMOS LOS CLIENTES AL DASHBOARD */}
            <ConsignacionesClient vehiculos={vehiculosPlanos} clientes={clientesDb} />
        </Suspense>
    );
}