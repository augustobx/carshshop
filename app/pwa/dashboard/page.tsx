import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { normalizeSellerPwaConfig } from '@/lib/seller-pwa-config';
import DashboardMobileClient from './DashboardMobileClient';

export const dynamic = 'force-dynamic';

export default async function PWADashboardPage() {
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [vehiculosDb, reservasDb, sellerPwaFeature] = await Promise.all([
    db.vehiculo.findMany({
      where: { tenantId: tenant.id, estado: { not: 'VENDIDO' } },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
    }),
    db.senia.findMany({
      where: { tenantId: tenant.id, estado: 'ACTIVA' },
      select: { id_vehiculo: true, id_cliente: true, recibo_nro: true, fecha_limite: true, cliente: { select: { nombre_completo: true } } },
    }),
    db.tenantFeature.findUnique({ where: { tenantId_featureKey: { tenantId: tenant.id, featureKey: 'seller_pwa' } } }),
  ]);

  const reservaByVehicle = new Map(reservasDb.map((s) => [s.id_vehiculo, s]));
  const vehiculosPlanos = vehiculosDb.map((v) => {
    const reserva = reservaByVehicle.get(v.id_vehiculo);
    const ventaUsd = Number(v.precio_venta_usd || 0);
    const compraUsd = Number(v.precio_compra_usd || 0);
    return {
      id_vehiculo: v.id_vehiculo,
      tipo_vehiculo: v.tipo_vehiculo,
      marca: v.marca || '',
      modelo: v.modelo || '',
      version: v.version || '',
      anio: v.anio || 0,
      km: v.km || 0,
      patente: v.patente || 'S/P',
      estado: v.estado === 'SENADO' ? 'LISTO_PARA_VENTA' : v.estado,
      tipo_ingreso: v.tipo_ingreso,
      precio_venta_ars: ventaUsd > 0 ? ventaUsd * dolarActual : Number(v.precio_venta_ars || 0),
      precio_venta_usd: ventaUsd,
      precio_compra_ars: compraUsd > 0 ? compraUsd * dolarActual : Number(v.precio_compra_ars || 0),
      precio_compra_usd: compraUsd,
      reservado: Boolean(reserva),
      reserva_cliente: reserva?.cliente.nombre_completo || null,
      reserva_recibo: reserva?.recibo_nro || null,
      reserva_hasta: reserva?.fecha_limite?.toISOString() || null,
    };
  });

  return <DashboardMobileClient
    vehiculos={vehiculosPlanos}
    pwaConfig={normalizeSellerPwaConfig(sellerPwaFeature?.config)}
  />;
}
