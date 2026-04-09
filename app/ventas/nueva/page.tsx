import { prisma as db } from "@/lib/prisma";
import CotizadorClient from "./CotizadorClient";

export const dynamic = "force-dynamic";

export default async function NuevaVentaPage() {
    const vehiculosDb = await db.vehiculo.findMany({
        where: {
            estado: { in: ['LISTO_PARA_VENTA', 'SENADO'] }
        },
        orderBy: { marca: 'asc' }
    });

    const clientesDb = await db.cliente.findMany({
        orderBy: { nombre_completo: 'asc' }
    });

    // Mapeo seguro: Extraemos los valores en ARS como fuente principal de verdad
    const vehiculosDisponibles = vehiculosDb.map(v => ({
        id_vehiculo: v.id_vehiculo,
        nombre: `${v.marca} ${v.modelo} (${v.anio})`,
        patente: v.patente || 'S/N',
        estado: v.estado,
        precio_sugerido_ars: Number(v.precio_venta_ars) || 0,
        precio_costo_ars: Number(v.precio_compra_ars) || 0
    }));

    return <CotizadorClient vehiculos={vehiculosDisponibles} clientes={clientesDb} />;
}