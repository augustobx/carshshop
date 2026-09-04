import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { normalizeSellerPwaConfig } from '@/lib/seller-pwa-config';
import VehiculoMobileClient from './VehiculoMobileClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PWAVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);
  const idVehiculo = Number(resolvedParams.id);

  const [vehiculoDb, sellerPwaFeature] = await Promise.all([
    db.vehiculo.findFirst({
      where: { id_vehiculo: idVehiculo, tenantId: tenant.id },
      include: {
        fotos: { orderBy: [{ orden: 'asc' }, { id_foto: 'asc' }] },
        anotaciones: { include: { usuario: true }, orderBy: { fecha: 'desc' } },
        senias: {
          where: { estado: 'ACTIVA' },
          include: {
            cliente: { select: { nombre_completo: true } },
            cotizacionRef: { select: { id_cotizacion: true, precio_final_usd: true, cotizacion_dolar: true, createdAt: true } },
          },
          orderBy: { fecha_senia: 'desc' },
          take: 1,
        },
      },
    }),
    db.tenantFeature.findUnique({ where: { tenantId_featureKey: { tenantId: tenant.id, featureKey: 'seller_pwa' } } }),
  ]);

  if (!vehiculoDb) return notFound();

  const ventaUsd = Number(vehiculoDb.precio_venta_usd || 0);
  const compraUsd = Number(vehiculoDb.precio_compra_usd || 0);
  const reserva = vehiculoDb.senias[0] || null;
  const vehiculoPlano = {
    id_vehiculo: vehiculoDb.id_vehiculo,
    tipo_vehiculo: vehiculoDb.tipo_vehiculo,
    marca: vehiculoDb.marca || '', modelo: vehiculoDb.modelo || '', version: vehiculoDb.version || '',
    anio: vehiculoDb.anio || 0, km: vehiculoDb.km || 0, patente: vehiculoDb.patente || 'S/P', vin: vehiculoDb.vin || '',
    motor: vehiculoDb.motor || '', combustible: vehiculoDb.combustible || '', transmision: vehiculoDb.transmision || '', traccion: vehiculoDb.traccion || '', color: vehiculoDb.color || '',
    estado: vehiculoDb.estado === 'SENADO' ? 'LISTO_PARA_VENTA' : vehiculoDb.estado,
    precio_venta_ars: ventaUsd > 0 ? ventaUsd * dolarActual : Number(vehiculoDb.precio_venta_ars || 0), precio_venta_usd: ventaUsd,
    precio_compra_ars: compraUsd > 0 ? compraUsd * dolarActual : Number(vehiculoDb.precio_compra_ars || 0), precio_compra_usd: compraUsd,
    fotos: vehiculoDb.fotos.map((f) => ({ id_foto: f.id_foto, url: f.url_foto, orden: f.orden })),
    anotaciones: vehiculoDb.anotaciones.map((a) => ({ id_anotacion: a.id_anotacion, texto: a.texto, fecha: a.fecha.toISOString(), usuario: a.usuario ? { name: a.usuario.name, nombre: a.usuario.name } : null })),
    reserva: reserva ? {
      id_senia: reserva.id_senia, id_cliente: reserva.id_cliente, cliente_nombre: reserva.cliente.nombre_completo,
      monto_ars: Number(reserva.monto_ars || 0), monto_usd: Number(reserva.monto_usd || 0), cotizacion_reserva: Number(reserva.cotizacion || dolarActual),
      fecha_senia: reserva.fecha_senia.toISOString(), fecha_limite: reserva.fecha_limite?.toISOString() || null, recibo_nro: reserva.recibo_nro,
      cotizacion_original: reserva.cotizacionRef ? { id_cotizacion: reserva.cotizacionRef.id_cotizacion, precio_usd: Number(reserva.cotizacionRef.precio_final_usd || 0), rate: Number(reserva.cotizacionRef.cotizacion_dolar || reserva.cotizacion || dolarActual), fecha: reserva.cotizacionRef.createdAt.toISOString() } : null,
    } : null,
  };

  return <VehiculoMobileClient vehiculo={vehiculoPlano} dolarActual={dolarActual} pwaConfig={normalizeSellerPwaConfig(sellerPwaFeature?.config)} />;
}
