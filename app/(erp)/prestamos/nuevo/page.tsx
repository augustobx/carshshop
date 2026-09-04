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

    const clientes = clientesDb.map(c => ({
        id_cliente: c.id_cliente,
        nombre_completo: c.nombre_completo,
        dni: c.dni,
        cuit_cuil: c.cuit_cuil,
        telefono: c.telefono,
        email: c.email,
    }));

    return <NuevoPrestamoClient clientes={clientes} dolarActual={Number(tenant.settings?.dolarActual || 1400)} />;
}
