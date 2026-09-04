import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import NuevoPrestamoClient from "./NuevoPrestamoClient";

export const dynamic = "force-dynamic";

export default async function NuevoPrestamoPage() {
    const tenant = await getTenantContext();
    const clientesDb = await db.cliente.findMany({
        where: { tenantId: tenant.id },
        orderBy: { nombre_completo: 'asc' }
    });

    return <NuevoPrestamoClient clientes={clientesDb} />;
}