import { db } from "@/lib/prisma";
import VehiculoForm from "@/components/vehiculos/VehiculoForm";
import { notFound } from "next/navigation";

export default async function EditarVehiculo({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const vehiculoDb = await db.vehiculo.findUnique({ where: { id_vehiculo: parseInt(id) } });

    if (!vehiculoDb) notFound();

    const vehiculoData = {
        ...vehiculoDb,
        precio_compra_usd: Number(vehiculoDb.precio_compra_usd),
        precio_compra_ars: Number(vehiculoDb.precio_compra_ars),
        precio_venta_usd: Number(vehiculoDb.precio_venta_usd),
        precio_venta_ars: Number(vehiculoDb.precio_venta_ars),
        comision_consignacion_pct: Number(vehiculoDb.comision_consignacion_pct),
        estado: vehiculoDb.estado as any,
        tipo_ingreso: vehiculoDb.tipo_ingreso as any,
    };

    return <div className="p-6 bg-slate-50 min-h-screen"><VehiculoForm vehiculo={vehiculoData as any} /></div>;
}