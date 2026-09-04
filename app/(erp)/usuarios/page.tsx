import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import UsuariosClient from "./UsuariosClient";

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const tenant = await getTenantContext();

  const memberships = await db.tenantMembership.findMany({
    where: { tenantId: tenant.id, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      location: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const usuarios = memberships.map((m) => ({
    id_usuario: m.id,
    nombre: m.user.name || 'Usuario',
    email: m.user.email,
    rol: m.role,
    sucursal: m.location?.name || 'Casa Central',
  }));

  return <UsuariosClient usuarios={usuarios} />;
}