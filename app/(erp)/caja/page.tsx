import { prisma as db } from "@/lib/prisma";
import CajaClient from "./CajaClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
    const ventasDb = await db.venta.findMany({ include: { cliente: true, vehiculo: true } });

    // Cuotas de autos cobradas
    const cuotasVentasDb = await db.ventaCuota.findMany({
        where: { estado: 'PAGADA' },
        include: { venta: { include: { cliente: true, vehiculo: true } } }
    });

    // Cuotas de préstamos cobradas (¡El código clave para que impacte la plata!)
    const cuotasPrestamosDb = await db.prestamoCuota.findMany({
        where: { estado: 'PAGADA' },
        include: { prestamo: { include: { cliente: true } } }
    });

    const movimientosDb = await db.gasto.findMany();

    const transacciones: any[] = [];

    // A. Ventas
    ventasDb.forEach(v => {
        transacciones.push({
            id: `VTA-${v.id_venta}`,
            fecha_str: v.fecha_venta ? new Date(v.fecha_venta).toISOString() : new Date().toISOString(),
            concepto: `Venta: ${v.vehiculo?.marca} ${v.vehiculo?.modelo} (${v.cliente?.nombre_completo})`,
            categoria: 'Venta Vehículo',
            tipo: 'INGRESO',
            monto_ars: Number(v.precio_final_usd) * Number(v.cotizacion_dolar_venta),
            monto_usd: Number(v.precio_final_usd),
            referencia: 'ERP-Ventas'
        });
    });

    // B. Cuotas Autos
    cuotasVentasDb.forEach(c => {
        const fechaUso = c.fecha_pago || c.fecha_vencimiento;
        transacciones.push({
            id: `CVTA-${c.id_cuota}`,
            fecha_str: fechaUso ? new Date(fechaUso).toISOString() : new Date().toISOString(),
            concepto: `Cobro Cuota Auto ${c.numero_cuota} - ${c.venta?.cliente?.nombre_completo}`,
            categoria: 'Cobro Financiación',
            tipo: 'INGRESO',
            monto_ars: Number(c.monto_pagado_ars || 0),
            monto_usd: Number(c.monto_usd || 0),
            referencia: 'ERP-Cuotas'
        });
    });

    // C. Cuotas Préstamos
    cuotasPrestamosDb.forEach(c => {
        const fechaUso = c.fecha_pago || c.fecha_vencimiento;
        transacciones.push({
            id: `CPRE-${c.id_cuota}`,
            fecha_str: fechaUso ? new Date(fechaUso).toISOString() : new Date().toISOString(),
            concepto: `Cobro Cuota Préstamo ${c.numero_cuota} - ${c.prestamo?.cliente?.nombre_completo}`,
            categoria: 'Cobro Financiación',
            tipo: 'INGRESO',
            monto_ars: Number(c.monto_pagado_ars || 0),
            monto_usd: Number(c.monto_usd || 0),
            referencia: 'ERP-Cuotas'
        });
    });

    // D. Movimientos Manuales
    movimientosDb.forEach(m => {
        transacciones.push({
            id: `MOV-${m.id_gasto}`,
            fecha_str: m.fecha ? new Date(m.fecha).toISOString() : new Date().toISOString(),
            concepto: m.descripcion || 'Sin descripción',
            categoria: m.categoria || 'Gasto General',
            tipo: (m as any).tipo_movimiento || 'EGRESO',
            monto_ars: Number(m.monto_ars || 0),
            monto_usd: Number(m.monto_usd || 0),
            referencia: 'Manual'
        });
    });

    transacciones.sort((a, b) => new Date(b.fecha_str).getTime() - new Date(a.fecha_str).getTime());

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <CajaClient transacciones={transacciones} />
        </Suspense>
    );
}