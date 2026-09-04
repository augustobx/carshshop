import { notFound, redirect } from 'next/navigation';
import { getLoggedUser } from '@/lib/user-auth';
import { getTenantDetailAction } from '@/actions/superadmin';
import TenantDetailClient from './TenantDetailClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminTenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getLoggedUser();
  if (!user?.isSuperAdmin) redirect('/superadmin/login');

  const { id } = await params;
  const data = await getTenantDetailAction(id);
  if (!data.tenant) notFound();

  return <TenantDetailClient initialData={data} />;
}
