import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import CajaClient from './CajaClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { RolMembresia } from '@prisma/client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
const CASH_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];

export default async function CajaPage() {
  const tenant = await getTenantContext();
  try { await requireTenantRole(tenant.id, CASH_ROLES); } catch { redirect('/'); }
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [ventasDb, cuotasVentasDb, prestamosDb, cuotasPrestamosDb, seniasDb, movimientosDb, vehiculosDb] = await Promise.all([
    db.venta.findMany({ where: { tenantId: tenant.id }, include: { cliente: true, vehiculo: true } }),
    db.ventaCuota.findMany({ where: { estado: 'PAGADA', tenantId: tenant.id }, include: { venta: { include: { cliente: true, vehiculo: true } } } }),
    db.prestamo.findMany({ where: { tenantId: tenant.id }, include: { cliente: true } }),
    db.prestamoCuota.findMany({ where: { estado: 'PAGADA', tenantId: tenant.id }, include: { prestamo: { include: { cliente: true } } } }),
    db.senia.findMany({ where: { tenantId: tenant.id }, include: { cliente: true, vehiculo: true } }),
    db.gasto.findMany({ where: { tenantId: tenant.id }, include: { vehiculo: true } }),
    db.vehiculo.findMany({ where: { tenantId: tenant.id }, select: { id_vehiculo: true, marca: true, modelo: true, anio: true, patente: true, estado: true }, orderBy: [{ marca: 'asc' }, { modelo: 'asc' }] }),
  ]);

  const transacciones: any[] = [];
  const seniasAplicadas = new Set<number>();

  // En una venta sólo entra efectivo por el pago inicial: total si es contado, anticipo si es financiada.
  // Si antes hubo una seña vinculada, esa plata ya ingresó el día de la reserva y se descuenta del ingreso del cierre.
  ventasDb.forEach((v) => {
    const rate = Number(v.cotizacion_dolar_venta || dolarActual);
    const seniasVenta = seniasDb.filter((s) => {
      if (s.id_vehiculo !== v.id_vehiculo || s.id_cliente !== v.id_cliente || s.fecha_senia > v.fecha_venta) return false;
      if (s.prospectoId && v.prospectoId) return s.prospectoId === v.prospectoId;
      if (s.cotizacionId && v.cotizacionId) return s.cotizacionId === v.cotizacionId;
      return !s.prospectoId && !s.cotizacionId;
    });
    const seniasUsd = seniasVenta.reduce((sum, s) => { seniasAplicadas.add(s.id_senia); return sum + Number(s.monto_usd || 0); }, 0);
    const inicialUsd = v.forma_pago === 'Contado' ? Number(v.precio_final_usd || 0) : Number(v.anticipo_usd || 0);
    const efectivoCierreUsd = Math.max(0, inicialUsd - seniasUsd);
    if (efectivoCierreUsd > 0) transacciones.push({
      id: `VTA-${v.id_venta}`, fecha_str: v.fecha_venta.toISOString(),
      concepto: `${v.forma_pago === 'Contado' ? 'Cobro venta contado' : 'Anticipo venta'}: ${v.vehiculo?.marca || ''} ${v.vehiculo?.modelo || ''} (${v.cliente?.nombre_completo || 'Cliente'})`,
      categoria: 'Venta Vehículo', tipo: 'INGRESO', monto_ars: efectivoCierreUsd * rate, monto_usd: efectivoCierreUsd,
      referencia: v.numero_boleto || `Venta #${v.id_venta}`,
    });
  });

  // La seña es un ingreso de caja en la fecha real de recepción. Una cancelada sin venta asociada se considera liberada/reintegrada y no integra el saldo histórico.
  seniasDb.forEach((s) => {
    if (s.estado !== 'ACTIVA' && !seniasAplicadas.has(s.id_senia)) return;
    transacciones.push({
      id: `SEN-${s.id_senia}`, fecha_str: s.fecha_senia.toISOString(),
      concepto: `Reserva: ${s.vehiculo?.marca || ''} ${s.vehiculo?.modelo || ''} (${s.cliente?.nombre_completo || 'Cliente'})`,
      categoria: 'Seña / Reserva', tipo: 'INGRESO', monto_ars: Number(s.monto_ars || 0), monto_usd: Number(s.monto_usd || 0),
      referencia: s.recibo_nro || `Reserva #${s.id_senia}`,
    });
  });

  cuotasVentasDb.forEach((c) => transacciones.push({
    id: `CVTA-${c.id_cuota}`, fecha_str: (c.fecha_pago || c.fecha_vencimiento).toISOString(),
    concepto: `Cobro cuota venta ${c.numero_cuota} - ${c.venta?.cliente?.nombre_completo || 'Cliente'}`,
    categoria: 'Cobro Financiación', tipo: 'INGRESO',
    monto_ars: Number(c.monto_pagado_ars || (Number(c.monto_usd || 0) * Number(c.cotizacion_pago || dolarActual))),
    monto_usd: Number(c.monto_usd || 0), referencia: c.recibo_nro || 'Cuota de venta',
  }));

  // Otorgar un préstamo es una salida real de caja al momento de entregar el capital.
  prestamosDb.forEach((p) => {
    const rate = Number(p.cotizacion_dolar_prestamo || dolarActual);
    const usd = Number(p.capital_entregado_usd || 0);
    transacciones.push({
      id: `PRE-${p.id_prestamo}`, fecha_str: p.fecha_prestamo.toISOString(),
      concepto: `Capital entregado préstamo #${p.id_prestamo} - ${p.cliente?.nombre_completo || 'Cliente'}`,
      categoria: 'Préstamo Otorgado', tipo: 'EGRESO', monto_ars: usd * rate, monto_usd: usd, referencia: `Préstamo #${p.id_prestamo}`,
    });
  });

  cuotasPrestamosDb.forEach((c) => transacciones.push({
    id: `CPRE-${c.id_cuota}`, fecha_str: (c.fecha_pago || c.fecha_vencimiento).toISOString(),
    concepto: `Cobro cuota préstamo ${c.numero_cuota} - ${c.prestamo?.cliente?.nombre_completo || 'Cliente'}`,
    categoria: 'Cobro Préstamo', tipo: 'INGRESO',
    monto_ars: Number(c.monto_pagado_ars || (Number(c.monto_usd || 0) * Number(c.cotizacion_pago || dolarActual))),
    monto_usd: Number(c.monto_usd || 0), referencia: c.recibo_nro || 'Cuota de préstamo',
  }));

  movimientosDb.forEach((m) => transacciones.push({
    id: `MOV-${m.id_gasto}`, fecha_str: m.fecha.toISOString(), concepto: m.descripcion || 'Sin descripción', categoria: m.categoria || 'Movimiento General',
    tipo: m.tipo_movimiento || 'EGRESO', monto_ars: Number(m.monto_ars || 0), monto_usd: Number(m.monto_usd || 0),
    referencia: m.vehiculo ? `${m.vehiculo.marca || ''} ${m.vehiculo.modelo || ''} · ${m.vehiculo.patente || 'S/P'}` : 'Manual',
  }));

  transacciones.sort((a, b) => new Date(b.fecha_str).getTime() - new Date(a.fecha_str).getTime());
  const vehiculos = vehiculosDb.map((v) => ({ id_vehiculo: v.id_vehiculo, label: `${v.marca || ''} ${v.modelo || ''}`.trim(), description: `${v.anio || 'S/A'} · ${v.patente || 'S/P'} · ${v.estado.replace(/_/g, ' ')}` }));

  return <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}><CajaClient transacciones={transacciones} vehiculos={vehiculos} dolarActual={dolarActual} /></Suspense>;
}
