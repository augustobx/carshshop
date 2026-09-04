import 'server-only';

import { redirect } from 'next/navigation';
import { RolMembresia } from '@prisma/client';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';

export const COMMERCIAL_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR] as const;
export const ADMIN_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO] as const;
export const MANAGEMENT_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER] as const;

export async function guardTenantRoles(roles: readonly RolMembresia[]) {
  const tenant = await getTenantContext();
  try {
    const auth = await requireTenantRole(tenant.id, [...roles]);
    return { tenant, auth };
  } catch (error: any) {
    if (String(error?.message || '').startsWith('UNAUTHORIZED')) redirect('/login');
    redirect('/');
  }
}
