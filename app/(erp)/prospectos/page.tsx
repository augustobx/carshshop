import { obtenerProspectos } from '@/actions/prospectos';
import ProspectosClient from './ProspectosClient';
import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export default async function ProspectosPage() {
  const tenant = await getTenantContext();
  const [prospectos, vehiculos] = await Promise.all([
    obtenerProspectos(),
    db.vehiculo.findMany({
      where: {
        tenantId: tenant.id,
        estado: { in: ['LISTO_PARA_VENTA', 'EN_PREPARACION', 'EN_CONSIGNACION'] },
      },
      select: { id_vehiculo: true, marca: true, modelo: true, anio: true, precio_venta_usd: true },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
    }),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM y Seguimiento de Prospectos</h1>
        <p className="text-sm text-slate-500">
          Gestioná los clientes interesados, consultas de showroom, permutas en análisis y estado de negociación.
        </p>
      </div>

      <ProspectosClient initialProspectos={prospectos} vehiculos={vehiculos} />
    </div>
  );
}
