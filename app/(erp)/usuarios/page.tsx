import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import UsuariosClient from './UsuariosClient';
import { RolMembresia } from '@prisma/client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const tenant = await getTenantContext();
  let auth;
  try { auth = await requireTenantRole(tenant.id, [RolMembresia.OWNER, RolMembresia.MANAGER]); } catch { redirect('/'); }

  const [memberships, locations] = await Promise.all([
    db.tenantMembership.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: { user: { select: { id: true, name: true, email: true, phone: true } }, location: { select: { id: true, name: true } } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    }),
    db.location.findMany({ where: { tenantId: tenant.id, isActive: true }, select: { id: true, name: true, code: true, address: true }, orderBy: [{ isMain: 'desc' }, { name: 'asc' }] }),
  ]);

  const usuarios = memberships.map((m) => ({
    id_usuario: m.id,
    userId: m.userId,
    nombre: m.user.name || 'Usuario',
    email: m.user.email,
    telefono: m.user.phone,
    rol: m.role,
    commissionPct: Number(m.commissionPct || 0),
    locationId: m.locationId,
    sucursal: m.location?.name || 'Sin sucursal asignada',
  }));

  return <UsuariosClient usuarios={usuarios} locations={locations} maxUsers={tenant.plan.maxUsers} canCreateOwner={auth.role === RolMembresia.OWNER || auth.user.isSuperAdmin} />;
}
