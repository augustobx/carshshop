import { COMMERCIAL_ROLES, guardTenantRoles } from '@/lib/route-guard';

export default async function ProspectosLayout({ children }: { children: React.ReactNode }) {
  await guardTenantRoles(COMMERCIAL_ROLES);
  return children;
}
