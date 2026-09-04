import { redirect } from 'next/navigation';
import { getLoggedUser } from '@/lib/user-auth';
import SuperAdminLoginClient from './SuperAdminLoginClient';

export default async function SuperAdminLoginPage() {
  const user = await getLoggedUser();
  if (user?.isSuperAdmin) redirect('/superadmin');
  return <SuperAdminLoginClient />;
}
