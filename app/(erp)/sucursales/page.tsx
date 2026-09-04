import { obtenerSucursales } from '@/actions/sucursales';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { RolMembresia } from '@prisma/client';
import { redirect } from 'next/navigation';
import SucursalesClient from './SucursalesClient';

export const dynamic = 'force-dynamic';

export default async function SucursalesPage() {
  const tenant = await getTenantContext();
  try { await requireTenantRole(tenant.id, [RolMembresia.OWNER, RolMembresia.MANAGER]); } catch { redirect('/'); }
  const sucursales = await obtenerSucursales();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Gestión</p><h1 className="text-3xl font-black text-slate-900 mt-1">Sucursales y puntos de venta</h1><p className="text-sm text-slate-500 mt-1">Sedes comerciales, talleres y depósitos con su stock y operaciones vinculadas.</p></div>
      <SucursalesClient initialSucursales={sucursales} maxLocations={tenant.plan.maxLocations} />
    </div>
  );
}
