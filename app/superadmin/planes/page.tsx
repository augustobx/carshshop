import { redirect } from 'next/navigation';
import { getLoggedUser } from '@/lib/user-auth';
import { getPlansAction } from '@/actions/superadmin';
import PlansClient from './PlansClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPlansPage() {
  const user = await getLoggedUser();
  if (!user?.isSuperAdmin) redirect('/superadmin/login');

  const data = await getPlansAction();
  return <PlansClient plans={data.plans} />;
}
