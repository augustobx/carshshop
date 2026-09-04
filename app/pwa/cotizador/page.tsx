import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import CotizadorMobileClient from './CotizadorMobileClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PWACotizadorPage() {
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [vehiculosDb, clientesDb] = await Promise.all([
    db.vehiculo.findMany({
      where: { tenantId: tenant.id, estado: { in: ['LISTO_PARA_VENTA', 'EN_CONSIGNACION', 'SENADO'] } },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
      take: 300,
    }),
    db.cliente.findMany({ where: { tenantId: tenant.id }, orderBy: { nombre_completo: 'asc' }, take: 500 }),
  ]);

  const vehiculos = vehiculosDb.map((v) => ({
    id_vehiculo: v.id_vehiculo,
    tipo_vehiculo: v.tipo_vehiculo,
    marca: v.marca || '', modelo: v.modelo || '', version: v.version || '', anio: v.anio || 0,
    patente: v.patente || 'S/P', km: v.km || 0, estado: v.estado,
    precio_venta_ars: Number(v.precio_venta_ars || 0), precio_venta_usd: Number(v.precio_venta_usd || 0),
    precio_compra_ars: Number(v.precio_compra_ars || 0), precio_compra_usd: Number(v.precio_compra_usd || 0),
  }));
  const clientes = clientesDb.map((c) => ({ id_cliente: c.id_cliente, nombre_completo: c.nombre_completo, dni: c.dni, cuit_cuil: c.cuit_cuil, telefono: c.telefono }));

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}>
      <CotizadorMobileClient vehiculos={vehiculos} clientes={clientes} dolarActual={dolarActual} />
    </Suspense>
  );
}
