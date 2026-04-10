import { prisma as db } from "@/lib/prisma";
import ConsignacionDetalleClient from "./ConsignacionDetalleClient";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConsignacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const idVehiculo = parseInt(resolvedParams.id);

    if (isNaN(idVehiculo)) return notFound();

    // Buscamos el vehículo con su dueño y chequeamos si tiene una Venta asociada
    const vehiculoDb = await db.vehiculo.findUnique({
        where: { id_vehiculo: idVehiculo },
        include: {
            cliente: true,
            ventas: {
                include: {
                    cliente: true // El comprador final
                }
            }
        }
    });

    if (!vehiculoDb || vehiculoDb.tipo_ingreso !== 'CONSIGNACION') return notFound();

    // Limpieza extrema de decimales
    const vehiculoPlano = {
        ...vehiculoDb,
        precio_compra_usd: Number(vehiculoDb.precio_compra_usd || 0),
        precio_compra_ars: Number(vehiculoDb.precio_compra_ars || 0),
        precio_venta_usd: Number(vehiculoDb.precio_venta_usd || 0),
        precio_venta_ars: Number(vehiculoDb.precio_venta_ars || 0),
        comision_consignacion_pct: Number(vehiculoDb.comision_consignacion_pct || 0),
        ventas: vehiculoDb.ventas.map(v => ({
            ...v,
            precio_final_usd: Number(v.precio_final_usd),
            cotizacion_dolar_venta: Number(v.cotizacion_dolar_venta)
        }))
    };

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-fuchsia-600" /></div>}>
            <ConsignacionDetalleClient vehiculo={vehiculoPlano} />
        </Suspense>
    );
}