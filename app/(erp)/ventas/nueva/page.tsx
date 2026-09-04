import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import CotizadorClient from "./CotizadorClient";

export const dynamic = "force-dynamic";

export default async function NuevaVentaPage() {
    const tenant = await getTenantContext();
    const dolarActual = Number(tenant.settings?.dolarActual || 1400);

    const [vehiculosDb, clientesDb] = await Promise.all([
        db.vehiculo.findMany({
            where: {
                tenantId: tenant.id,
                estado: { in: ['LISTO_PARA_VENTA', 'SENADO'] }
            },
            orderBy: [{ marca: 'asc' }, { modelo: 'asc' }]
        }),
        db.cliente.findMany({
            where: { tenantId: tenant.id },
            orderBy: { nombre_completo: 'asc' }
        })
    ]);

    const vehiculos = vehiculosDb.map(v => ({
        id_vehiculo: v.id_vehiculo,
        nombre: `${v.marca || ''} ${v.modelo || ''}${v.version ? ` ${v.version}` : ''}`.trim(),
        marca: v.marca || '',
        modelo: v.modelo || '',
        version: v.version || '',
        anio: v.anio || 0,
        patente: v.patente || 'S/P',
        estado: v.estado,
        precio_venta_ars: Number(v.precio_venta_ars) || 0,
        precio_venta_usd: Number(v.precio_venta_usd) || 0,
        precio_costo_ars: Number(v.precio_compra_ars) || 0,
        precio_costo_usd: Number(v.precio_compra_usd) || 0,
    }));

    const clientes = clientesDb.map(c => ({
        id_cliente: c.id_cliente,
        nombre_completo: c.nombre_completo,
        dni: c.dni,
        cuit_cuil: c.cuit_cuil,
        telefono: c.telefono,
        email: c.email,
    }));

    return <CotizadorClient vehiculos={vehiculos} clientes={clientes} dolarActual={dolarActual} />;
}
