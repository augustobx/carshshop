import { prisma as db } from "@/lib/prisma";
import DashboardMobileClient from "./DashboardMobileClient";

export const dynamic = "force-dynamic";

export default async function PWADashboardPage() {
    // Buscamos todo lo que NO esté vendido
    const vehiculosDb = await db.vehiculo.findMany({
        where: { estado: { not: 'VENDIDO' } },
        orderBy: { marca: 'asc' }
    });

    // LIMPIEZA ABSOLUTA DE TODOS LOS DECIMALES
    const vehiculosPlanos = vehiculosDb.map((v: any) => ({
        ...v,
        precio_venta_ars: Number(v.precio_venta_ars || 0),
        precio_venta_usd: Number(v.precio_venta_usd || 0),
        precio_compra_ars: Number(v.precio_compra_ars || 0),
        precio_compra_usd: Number(v.precio_compra_usd || 0),
        comision_consignacion_pct: Number(v.comision_consignacion_pct || 0),
        fecha_str: v.fecha_ingreso ? new Date(v.fecha_ingreso).toISOString() : new Date().toISOString()
    }));

    return <DashboardMobileClient vehiculos={vehiculosPlanos} />;
}