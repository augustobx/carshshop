import { obtenerProspectos } from '@/actions/prospectos';
import ProspectosClient from './ProspectosClient';
import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export default async function ProspectosPage() {
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [prospectos, vehiculos] = await Promise.all([
    obtenerProspectos(),
    db.vehiculo.findMany({
      where: {
        tenantId: tenant.id,
        estado: { in: ['LISTO_PARA_VENTA', 'EN_PREPARACION', 'EN_CONSIGNACION', 'SENADO'] },
      },
      select: {
        id_vehiculo: true,
        marca: true,
        modelo: true,
        version: true,
        anio: true,
        patente: true,
        estado: true,
        precio_venta_usd: true,
        precio_venta_ars: true,
      },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
    }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Comercial</p>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">Pipeline de operaciones</h1>
        <p className="text-sm text-slate-500 mt-1">
          Lead → contacto → cotización → reserva → venta → entrega, con importes visibles en pesos y dólares.
        </p>
      </div>

      <ProspectosClient
        initialProspectos={prospectos as any[]}
        vehiculos={vehiculos as any[]}
        dolarActual={dolarActual}
      />
    </div>
  );
}
