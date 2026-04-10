import { prisma as db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VehiculoDashboardClient from "./VehiculoDashboardClient";

export const dynamic = "force-dynamic";

export default async function DetalleVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const idVehiculo = parseInt(id, 10);

    if (isNaN(idVehiculo)) notFound();

    // Traemos el vehículo con todas sus relaciones (Tareas y Gastos)
    const clientesDb = await db.cliente.findMany({ orderBy: { nombre_completo: 'asc' } });
    const vehiculoDb = await db.vehiculo.findUnique({
        where: { id_vehiculo: idVehiculo },
        include: {
            tareas: { include: { gastos: true }, orderBy: { id_tarea: 'desc' } },
            senias: { include: { cliente: true }, orderBy: { id_senia: 'desc' } } // <-- AGREGAR ESTO
            anotaciones: { include: { usuario: true }, orderBy: { fecha: 'desc' } }
        }
    });

    if (!vehiculoDb) notFound();

    // Normalizamos el objeto para el cliente
    const vehiculoData = {
        ...vehiculoDb,
        precio_compra_usd: Number(vehiculoDb.precio_compra_usd),
        precio_compra_ars: Number(vehiculoDb.precio_compra_ars),
        precio_venta_usd: Number(vehiculoDb.precio_venta_usd),
        precio_venta_ars: Number(vehiculoDb.precio_venta_ars),
        comision_consignacion_pct: Number(vehiculoDb.comision_consignacion_pct),
        estado: vehiculoDb.estado as any,
        tipo_ingreso: vehiculoDb.tipo_ingreso as any,
        tareas: vehiculoDb.tareas.map(t => ({
            ...t,
            gastos: t.gastos.map(g => ({ ...g, monto_usd: Number(g.monto_usd) }))
        }))
    };

    return <VehiculoDashboardClient vehiculo={vehiculoData as any} clientes={clientesDb} />;
}