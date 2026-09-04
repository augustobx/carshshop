import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import CotizadorMobileClient from './CotizadorMobileClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PWACotizadorPage() {
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);
  const tnaFinanciacion = Number(tenant.settings?.tnaFinanciacion || 48);

  const [vehiculosDb, clientesDb, reservasDb] = await Promise.all([
    db.vehiculo.findMany({
      where: { tenantId: tenant.id, estado: { in: ['EN_PREPARACION', 'LISTO_PARA_VENTA', 'EN_CONSIGNACION', 'SENADO'] } },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
      take: 300,
    }),
    db.cliente.findMany({ where: { tenantId: tenant.id }, orderBy: { nombre_completo: 'asc' }, take: 500 }),
    db.senia.findMany({
      where: { tenantId: tenant.id, estado: 'ACTIVA' },
      select: { id_senia: true, id_vehiculo: true, id_cliente: true, monto_ars: true, monto_usd: true, cotizacion: true, recibo_nro: true, prospectoId: true, cotizacionId: true, cliente: { select: { nombre_completo: true } } },
    }),
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
    prospectoId: s.prospectoId,
    cotizacionId: s.cotizacionId,
    cliente_nombre: s.cliente.nombre_completo,
  }));

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}>
      <CotizadorMobileClient vehiculos={vehiculos} clientes={clientes} dolarActual={dolarActual} tnaFinanciacion={tnaFinanciacion} reservasActivas={reservas} />
    </Suspense>
  );
}
