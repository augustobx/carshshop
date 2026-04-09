import { prisma as db } from "@/lib/prisma";
import CotizadorMobileClient from "./CotizadorMobileClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PWACotizadorPage() {
    // Buscamos solo autos que se puedan vender (usando los estados exactos de tu base de datos)
    const vehiculosDb = await db.vehiculo.findMany({
        where: {
            estado: { in: ['LISTO_PARA_VENTA', 'EN_CONSIGNACION'] }
        },
        orderBy: { marca: 'asc' }
    });

    const clientesDb = await db.cliente.findMany({
        orderBy: { nombre_completo: 'asc' }
    });

    // Limpieza TOTAL de todos los campos Decimal del esquema
    const vehiculosPlanos = vehiculosDb.map(v => ({
        ...v,
        precio_venta_ars: Number(v.precio_venta_ars || 0),
        precio_venta_usd: Number(v.precio_venta_usd || 0),
        precio_compra_ars: Number(v.precio_compra_ars || 0),
        precio_compra_usd: Number(v.precio_compra_usd || 0),
        comision_consignacion_pct: Number(v.comision_consignacion_pct || 0),
        fecha_ingreso: v.fecha_ingreso ? new Date(v.fecha_ingreso).toISOString() : new Date().toISOString()
    }));

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <CotizadorMobileClient vehiculos={vehiculosPlanos} clientes={clientesDb} />
        </Suspense>
    );
}