import { redirect } from 'next/navigation';
import { getSuperAdminOverviewAction } from '@/actions/superadmin';
import { getLoggedUser } from '@/lib/user-auth';
import TenantsManagerClient from './TenantsManagerClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const user = await getLoggedUser();

  if (!user || !user.isSuperAdmin) {
    redirect('/login?error=superadmin_required');
  }

  const data = await getSuperAdminOverviewAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Plano de Control NanoLabs</h1>
        <p className="text-sm text-slate-400">
          Supervisión global de concesionarias, infraestructura, suscripciones y métricas.
        </p>
      </div>

      <TenantsManagerClient initialData={data} />
    </div>
  );
}
