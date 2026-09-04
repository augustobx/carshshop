import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import ClientesClient from './ClientesClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { RolMembresia } from '@prisma/client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
const ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];

export default async function ClientesPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const q = String(params.q || '').trim();
  const tenant = await getTenantContext();
  try { await requireTenantRole(tenant.id, ROLES); } catch { redirect('/'); }

  const where: any = { tenantId: tenant.id };
  if (q) where.OR = [
    { nombre_completo: { contains: q } }, { dni: { contains: q } }, { cuit_cuil: { contains: q } },
    { telefono: { contains: q } }, { email: { contains: q } }, { localidad: { contains: q } },
  ];

  const clientesDb = await db.cliente.findMany({
    where,
    orderBy: { id_cliente: 'desc' },
    include: { _count: { select: { ventas: true, prestamos: true, senias: true } } },
    take: 300,
  });

  return <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}><ClientesClient clientes={clientesDb} /></Suspense>;
}
