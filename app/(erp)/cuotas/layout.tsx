import { ADMIN_ROLES, guardTenantRoles } from '@/lib/route-guard';

export default async function CuotasLayout({ children }: { children: React.ReactNode }) {
  await guardTenantRoles(ADMIN_ROLES);
  return children;
}
