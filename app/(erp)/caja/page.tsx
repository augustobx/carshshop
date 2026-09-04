import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import CajaClient from "./CajaClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
    const tenant = await getTenantContext();
    const dolarActual = Number(tenant.settings?.dolarActual || 1400);

    const [ventasDb, cuotasVentasDb, cuotasPrestamosDb, movimientosDb, vehiculosDb] = await Promise.all([
        db.venta.findMany({ where: { tenantId: tenant.id }, include: { cliente: true, vehiculo: true } }),
        db.ventaCuota.findMany({ where: { estado: 'PAGADA', tenantId: tenant.id }, include: { venta: { include: { cliente: true, vehiculo: true } } } }),
        db.prestamoCuota.findMany({ where: { estado: 'PAGADA', tenantId: tenant.id }, include: { prestamo: { include: { cliente: true } } } }),
        db.gasto.findMany({ where: { tenantId: tenant.id }, include: { vehiculo: true } }),
        db.vehiculo.findMany({
            where: { tenantId: tenant.id },
            select: { id_vehiculo: true, marca: true, modelo: true, anio: true, patente: true, estado: true },
            orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
        }),
    ]);

    const transacciones: any[] = [];

    ventasDb.forEach(v => transacciones.push({
        id: `VTA-${v.id_venta}`,
        fecha_str: v.fecha_venta.toISOString(),
        concepto: `Venta: ${v.vehiculo?.marca || ''} ${v.vehiculo?.modelo || ''} (${v.cliente?.nombre_completo || 'Cliente'})`,
        categoria: 'Venta Vehículo', tipo: 'INGRESO',
        monto_ars: Number(v.precio_final_usd) * Number(v.cotizacion_dolar_venta || dolarActual),
        monto_usd: Number(v.precio_final_usd), referencia: 'ERP-Ventas'
    }));

    cuotasVentasDb.forEach(c => transacciones.push({
        id: `CVTA-${c.id_cuota}`,
        fecha_str: (c.fecha_pago || c.fecha_vencimiento).toISOString(),
        concepto: `Cobro cuota auto ${c.numero_cuota} - ${c.venta?.cliente?.nombre_completo || 'Cliente'}`,
        categoria: 'Cobro Financiación', tipo: 'INGRESO',
        monto_ars: Number(c.monto_pagado_ars || (Number(c.monto_usd || 0) * Number(c.cotizacion_pago || dolarActual))),
        monto_usd: Number(c.monto_usd || 0), referencia: 'ERP-Cuotas'
    }));

    cuotasPrestamosDb.forEach(c => transacciones.push({
        id: `CPRE-${c.id_cuota}`,
        fecha_str: (c.fecha_pago || c.fecha_vencimiento).toISOString(),
        concepto: `Cobro cuota préstamo ${c.numero_cuota} - ${c.prestamo?.cliente?.nombre_completo || 'Cliente'}`,
        categoria: 'Cobro Financiación', tipo: 'INGRESO',
        monto_ars: Number(c.monto_pagado_ars || (Number(c.monto_usd || 0) * Number(c.cotizacion_pago || dolarActual))),
        monto_usd: Number(c.monto_usd || 0), referencia: 'ERP-Cuotas'
    }));

    movimientosDb.forEach(m => transacciones.push({
        id: `MOV-${m.id_gasto}`,
        fecha_str: m.fecha.toISOString(),
        concepto: m.descripcion || 'Sin descripción', categoria: m.categoria || 'Gasto General',
        tipo: m.tipo_movimiento || 'EGRESO', monto_ars: Number(m.monto_ars || 0), monto_usd: Number(m.monto_usd || 0),
        referencia: m.vehiculo ? `${m.vehiculo.marca || ''} ${m.vehiculo.modelo || ''} · ${m.vehiculo.patente || 'S/P'}` : 'Manual'
    }));

    transacciones.sort((a, b) => new Date(b.fecha_str).getTime() - new Date(a.fecha_str).getTime());

    const vehiculos = vehiculosDb.map(v => ({
        id_vehiculo: v.id_vehiculo,
        label: `${v.marca || ''} ${v.modelo || ''}`.trim(),
        description: `${v.anio || 'S/A'} · ${v.patente || 'S/P'} · ${v.estado.replace(/_/g, ' ')}`,
    }));

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <CajaClient transacciones={transacciones} vehiculos={vehiculos} dolarActual={dolarActual} />
        </Suspense>
    );
}
