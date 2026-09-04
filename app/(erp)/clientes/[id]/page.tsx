import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { notFound, redirect } from 'next/navigation';
import { RolMembresia } from '@prisma/client';
import ClienteCarpetaClient from './ClienteCarpetaClient';

export const dynamic = 'force-dynamic';
const ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];

export default async function DetalleClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idCliente = Number(id);
  if (!Number.isInteger(idCliente)) notFound();

  const tenant = await getTenantContext();
  try { await requireTenantRole(tenant.id, ROLES); } catch { redirect('/'); }

  const clienteDb = await db.cliente.findUnique({
    where: { id_cliente: idCliente, tenantId: tenant.id },
    include: {
      ventas: { include: { vehiculo: true, cuotas: { orderBy: { numero_cuota: 'asc' } } }, orderBy: { fecha_venta: 'desc' } },
      prestamos: { include: { cuotas: { orderBy: { numero_cuota: 'asc' } } }, orderBy: { fecha_prestamo: 'desc' } },
      senias: { include: { vehiculo: true }, orderBy: { fecha_senia: 'desc' } },
      prospectos: { include: { vehiculo_interes: true, cotizaciones: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { updatedAt: 'desc' } },
    },
  });
  if (!clienteDb) notFound();

  const cliente = {
    ...clienteDb,
    ventas: clienteDb.ventas.map((v) => ({
      ...v,
      precio_final_usd: Number(v.precio_final_usd || 0), cotizacion_dolar_venta: Number(v.cotizacion_dolar_venta || 0),
      anticipo_usd: Number(v.anticipo_usd || 0), saldo_financiado_usd: Number(v.saldo_financiado_usd || 0),
      vehiculo: v.vehiculo ? { ...v.vehiculo, precio_venta_usd: Number(v.vehiculo.precio_venta_usd || 0), precio_venta_ars: Number(v.vehiculo.precio_venta_ars || 0) } : null,
      cuotas: v.cuotas.map((c) => ({ ...c, monto_usd: Number(c.monto_usd || 0), monto_pagado_ars: Number(c.monto_pagado_ars || 0), cotizacion_pago: Number(c.cotizacion_pago || 0) })),
    })),
    prestamos: clienteDb.prestamos.map((p) => ({ ...p, capital_entregado_usd: Number(p.capital_entregado_usd || 0), total_devolver_usd: Number(p.total_devolver_usd || 0), cotizacion_dolar_prestamo: Number(p.cotizacion_dolar_prestamo || 0), cuotas: p.cuotas.map((c) => ({ ...c, monto_usd: Number(c.monto_usd || 0), monto_pagado_ars: Number(c.monto_pagado_ars || 0), cotizacion_pago: Number(c.cotizacion_pago || 0) })) })),
    senias: clienteDb.senias.map((s) => ({ ...s, monto_usd: Number(s.monto_usd || 0), monto_ars: Number(s.monto_ars || 0), cotizacion: Number(s.cotizacion || 0) })),
    prospectos: clienteDb.prospectos.map((p) => ({ ...p, presupuesto_estimado_usd: Number(p.presupuesto_estimado_usd || 0), vehiculo_interes: p.vehiculo_interes ? { ...p.vehiculo_interes, precio_venta_usd: Number(p.vehiculo_interes.precio_venta_usd || 0), precio_venta_ars: Number(p.vehiculo_interes.precio_venta_ars || 0) } : null, cotizaciones: p.cotizaciones.map((c) => ({ ...c, precio_final_usd: Number(c.precio_final_usd || 0), cotizacion_dolar: Number(c.cotizacion_dolar || 0) })) })),
  };

  return <ClienteCarpetaClient cliente={cliente as any} dolarActual={tenant.settings?.dolarActual || 1400} />;
}
