import { prisma as db } from "@/lib/prisma";
import VehiculoMobileClient from "./VehiculoMobileClient";
import { notFound } from "next/navigation";

export default async function PWAVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const vehiculoDb = await db.vehiculo.findUnique({
        where: { id_vehiculo: parseInt(resolvedParams.id) }
    });

    if (!vehiculoDb) return notFound();

    // LIMPIEZA ABSOLUTA DE DECIMALES ANTES DE ENVIAR AL CLIENTE
    const vehiculoPlano = {
        ...vehiculoDb,
        precio_venta_ars: Number(vehiculoDb.precio_venta_ars || 0),
        precio_venta_usd: Number(vehiculoDb.precio_venta_usd || 0),
        precio_compra_ars: Number(vehiculoDb.precio_compra_ars || 0),
        precio_compra_usd: Number(vehiculoDb.precio_compra_usd || 0),
        comision_consignacion_pct: Number(vehiculoDb.comision_consignacion_pct || 0),
        fecha_ingreso: vehiculoDb.fecha_ingreso ? new Date(vehiculoDb.fecha_ingreso).toISOString() : new Date().toISOString()
    };

    return <VehiculoMobileClient vehiculo={vehiculoPlano} />;
}