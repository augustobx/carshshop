import { redirect } from 'next/navigation';
import { getLoggedUser } from '@/lib/user-auth';
import { getTenantsAction } from '@/actions/superadmin';
import TenantsClient from './TenantsClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminTenantsPage() {
  const user = await getLoggedUser();
  if (!user?.isSuperAdmin) redirect('/superadmin/login');

  const data = await getTenantsAction();
  return <TenantsClient initialData={data} />;
}
