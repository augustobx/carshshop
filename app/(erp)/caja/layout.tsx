import { ADMIN_ROLES, guardTenantRoles } from '@/lib/route-guard';

export default async function CajaLayout({ children }: { children: React.ReactNode }) {
  await guardTenantRoles(ADMIN_ROLES);
  return children;
}
