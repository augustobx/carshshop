import { prisma as db } from "@/lib/prisma";
import NuevoPrestamoClient from "./NuevoPrestamoClient";

export const dynamic = "force-dynamic";

export default async function NuevoPrestamoPage() {
    // Solo necesitamos los clientes, no hay vehículos
    const clientesDb = await db.cliente.findMany({
        orderBy: { nombre_completo: 'asc' }
    });

    return <NuevoPrestamoClient clientes={clientesDb} />;
}