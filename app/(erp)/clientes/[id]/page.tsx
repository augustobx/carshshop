import { prisma as db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ClienteCarpetaClient from "./ClienteCarpetaClient";

export const dynamic = "force-dynamic";

export default async function DetalleClientePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const idCliente = parseInt(id, 10);

    if (isNaN(idCliente)) notFound();

    // Traemos TODA la vida del cliente en la agencia
    const clienteDb = await db.cliente.findUnique({
        where: { id_cliente: idCliente },
        include: {
            ventas: {
                include: { vehiculo: true },
                orderBy: { fecha_venta: 'desc' }
            },
            prestamos: {
                orderBy: { fecha_prestamo: 'desc' }
            },
            senias: {
                include: { vehiculo: true },
                orderBy: { fecha_senia: 'desc' }
            }
        }
    });

    if (!clienteDb) notFound();

    return <ClienteCarpetaClient cliente={clienteDb} />;
}