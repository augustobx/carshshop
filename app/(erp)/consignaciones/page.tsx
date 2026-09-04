import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import ConsignacionesClient from "./ConsignacionesClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConsignacionesPage() {
    const tenant = await getTenantContext();
    const dolarActual = Number(tenant.settings?.dolarActual || 1400);

    const [clientesDb, consignacionesDb] = await Promise.all([
        db.cliente.findMany({ where: { tenantId: tenant.id }, orderBy: { nombre_completo: 'asc' } }),
        db.vehiculo.findMany({
            where: { tenantId: tenant.id, tipo_ingreso: 'Consignacion' },
            include: { cliente: true },
            orderBy: { fecha_ingreso: 'desc' }
        })
    ]);

    const vehiculos = consignacionesDb.map(v => ({
        ...v,
        precio_compra_usd: Number(v.precio_compra_usd || 0),
        precio_compra_ars: Number(v.precio_compra_ars || 0),
        precio_venta_usd: Number(v.precio_venta_usd || 0),
        precio_venta_ars: Number(v.precio_venta_ars || 0),
        comision_consignacion_pct: Number(v.comision_consignacion_pct || 0),
        fecha_str: v.fecha_ingreso.toISOString()
    }));

    const clientes = clientesDb.map(c => ({
        id_cliente: c.id_cliente, nombre_completo: c.nombre_completo, dni: c.dni, cuit_cuil: c.cuit_cuil, telefono: c.telefono, email: c.email
    }));

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <ConsignacionesClient vehiculos={vehiculos} clientes={clientes} dolarActual={dolarActual} />
        </Suspense>
    );
}
