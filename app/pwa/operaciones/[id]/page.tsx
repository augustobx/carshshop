import { notFound, redirect } from 'next/navigation';
import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { normalizeSellerPwaConfig } from '@/lib/seller-pwa-config';
import { RolMembresia } from '@prisma/client';
import OperacionMobileClient from './OperacionMobileClient';

export const dynamic = 'force-dynamic';

export default async function PwaOperacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prospectoId = Number(id);
  if (!Number.isFinite(prospectoId)) notFound();

  const tenant = await getTenantContext();
  const { user, role } = await requireTenantRole(tenant.id, [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR]);
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [p, feature] = await Promise.all([
    db.prospecto.findFirst({
      where: { id_prospecto: prospectoId, tenantId: tenant.id },
      include: {
        cliente: true,
        vehiculo_interes: true,
        cotizaciones: { orderBy: { createdAt: 'desc' }, take: 8 },
        senias: { where: { estado: 'ACTIVA' }, orderBy: { fecha_senia: 'desc' }, take: 1 },
        ventas: { orderBy: { fecha_venta: 'desc' }, take: 1 },
      },
    }),
    db.tenantFeature.findUnique({ where: { tenantId_featureKey: { tenantId: tenant.id, featureKey: 'seller_pwa' } } }),
  ]);

  if (!p) notFound();
  if (role === RolMembresia.VENDEDOR && p.vendedorId !== user.id) redirect('/pwa/operaciones');

  const data = {
    id_prospecto: p.id_prospecto,
    estado: p.estado,
    nombre: p.cliente?.nombre_completo || p.nombre,
    id_cliente: p.cliente?.id_cliente || p.id_cliente,
    telefono: p.cliente?.telefono || p.telefono,
    email: p.cliente?.email || p.email,
    notas: p.notas || '',
    proxima_accion: p.proxima_accion?.toISOString() || null,
    vehiculo: p.vehiculo_interes ? {
      id: p.vehiculo_interes.id_vehiculo,
      nombre: `${p.vehiculo_interes.marca} ${p.vehiculo_interes.modelo}${p.vehiculo_interes.version ? ` ${p.vehiculo_interes.version}` : ''}`,
      patente: p.vehiculo_interes.patente || 'S/P',
      estado: p.vehiculo_interes.estado,
      ventaUsd: Number(p.vehiculo_interes.precio_venta_usd || 0),
      ventaArs: Number(p.vehiculo_interes.precio_venta_usd || 0) > 0 ? Number(p.vehiculo_interes.precio_venta_usd) * dolarActual : Number(p.vehiculo_interes.precio_venta_ars || 0),
    } : null,
    cotizaciones: p.cotizaciones.map((q) => ({
      id: q.id_cotizacion,
      estado: q.estado,
      usd: Number(q.precio_final_usd || 0),
      rate: Number(q.cotizacion_dolar || dolarActual),
      ars: Number(q.precio_final_usd || 0) * Number(q.cotizacion_dolar || dolarActual),
      forma_pago: q.forma_pago,
      anticipo_usd: Number(q.anticipo_usd || 0),
      saldo_usd: Number(q.saldo_financiado_usd || 0),
      cantidad_cuotas: q.cantidad_cuotas,
      valor_cuota_usd: Number(q.valor_cuota_usd || 0),
      fecha: q.createdAt.toISOString(),
      validez: q.validez_hasta?.toISOString() || null,
      observaciones: q.observaciones || '',
    })),
    reserva: p.senias[0] ? {
      id: p.senias[0].id_senia,
      ars: Number(p.senias[0].monto_ars || 0),
      usd: Number(p.senias[0].monto_usd || 0),
      rate: Number(p.senias[0].cotizacion || dolarActual),
      fecha: p.senias[0].fecha_senia.toISOString(),
      limite: p.senias[0].fecha_limite?.toISOString() || null,
      recibo: p.senias[0].recibo_nro,
      cotizacionId: p.senias[0].cotizacionId,
    } : null,
    venta: p.ventas[0] ? { id: p.ventas[0].id_venta, boleto: p.ventas[0].numero_boleto, fecha: p.ventas[0].fecha_venta.toISOString() } : null,
  };

  return <OperacionMobileClient operacion={data} dolarActual={dolarActual} pwaConfig={normalizeSellerPwaConfig(feature?.config)} />;
}
