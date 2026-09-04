import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { normalizeSellerPwaConfig } from '@/lib/seller-pwa-config';
import CotizadorMobileClient from './CotizadorMobileClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PWACotizadorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);
  const tnaFinanciacion = Number(tenant.settings?.tnaFinanciacion || 48);
  const initialVehicleId = typeof params.v === 'string' ? params.v : '';

  const [vehiculosDb, clientesDb, reservasDb, sellerPwaFeature] = await Promise.all([
    db.vehiculo.findMany({
      where: { tenantId: tenant.id, estado: { in: ['EN_PREPARACION', 'LISTO_PARA_VENTA', 'EN_CONSIGNACION', 'SENADO'] } },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
      take: 300,
    }),
    db.cliente.findMany({ where: { tenantId: tenant.id }, orderBy: { nombre_completo: 'asc' }, take: 500 }),
    db.senia.findMany({
      where: { tenantId: tenant.id, estado: 'ACTIVA' },
      include: {
        cliente: { select: { nombre_completo: true } },
        cotizacionRef: { select: { id_cotizacion: true, precio_final_usd: true, cotizacion_dolar: true, createdAt: true, forma_pago: true, anticipo_usd: true, cantidad_cuotas: true, valor_cuota_usd: true } },
      },
      orderBy: { fecha_senia: 'desc' },
    }),
    db.tenantFeature.findUnique({ where: { tenantId_featureKey: { tenantId: tenant.id, featureKey: 'seller_pwa' } } }),
  ]);

  const vehiculos = vehiculosDb.map((v) => {
    const ventaUsd = Number(v.precio_venta_usd || 0);
    const compraUsd = Number(v.precio_compra_usd || 0);
    return {
      id_vehiculo: v.id_vehiculo,
      tipo_vehiculo: v.tipo_vehiculo,
      marca: v.marca || '', modelo: v.modelo || '', version: v.version || '', anio: v.anio || 0,
      patente: v.patente || 'S/P', km: v.km || 0, estado: v.estado === 'SENADO' ? 'LISTO_PARA_VENTA' : v.estado,
      precio_venta_ars: ventaUsd > 0 ? ventaUsd * dolarActual : Number(v.precio_venta_ars || 0), precio_venta_usd: ventaUsd,
      precio_compra_ars: compraUsd > 0 ? compraUsd * dolarActual : Number(v.precio_compra_ars || 0), precio_compra_usd: compraUsd,
    };
  });
  const clientes = clientesDb.map((c) => ({ id_cliente: c.id_cliente, nombre_completo: c.nombre_completo, dni: c.dni, cuit_cuil: c.cuit_cuil, telefono: c.telefono }));
  const reservas = reservasDb.map((s) => ({
    id_senia: s.id_senia,
    id_vehiculo: s.id_vehiculo,
    id_cliente: s.id_cliente,
    monto_ars: Number(s.monto_ars || 0),
    monto_usd: Number(s.monto_usd || 0),
    cotizacion: Number(s.cotizacion || dolarActual),
    recibo_nro: s.recibo_nro,
    fecha_senia: s.fecha_senia.toISOString(),
    fecha_limite: s.fecha_limite?.toISOString() || null,
    prospectoId: s.prospectoId,
    cotizacionId: s.cotizacionId,
    cliente_nombre: s.cliente.nombre_completo,
    cotizacion_original: s.cotizacionRef ? {
      id_cotizacion: s.cotizacionRef.id_cotizacion,
      precio_usd: Number(s.cotizacionRef.precio_final_usd || 0),
      rate: Number(s.cotizacionRef.cotizacion_dolar || s.cotizacion || dolarActual),
      fecha: s.cotizacionRef.createdAt.toISOString(),
      forma_pago: s.cotizacionRef.forma_pago,
      anticipo_usd: Number(s.cotizacionRef.anticipo_usd || 0),
      cantidad_cuotas: s.cotizacionRef.cantidad_cuotas,
      valor_cuota_usd: Number(s.cotizacionRef.valor_cuota_usd || 0),
    } : null,
  }));

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}>
      <CotizadorMobileClient
        vehiculos={vehiculos}
        clientes={clientes}
        dolarActual={dolarActual}
        tnaFinanciacion={tnaFinanciacion}
        reservasActivas={reservas}
        initialVehicleId={initialVehicleId}
        pwaConfig={normalizeSellerPwaConfig(sellerPwaFeature?.config)}
      />
    </Suspense>
  );
}
