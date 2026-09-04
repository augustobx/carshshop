import { redirect } from 'next/navigation';
import { RolMembresia } from '@prisma/client';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { prisma as db } from '@/lib/prisma';
import ConfiguracionClient from './ConfiguracionClient';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const tenant = await getTenantContext();
  try {
    await requireTenantRole(tenant.id, [RolMembresia.OWNER, RolMembresia.MANAGER]);
  } catch {
    redirect('/');
  }

  const s = await db.tenantSettings.findUnique({ where: { tenantId: tenant.id } });
  return <ConfiguracionClient initial={{
    tenantName: tenant.name,
    appName: s?.appName || tenant.name,
    logoUrl: s?.logoUrl || null,
    primaryColor: s?.primaryColor || '#2563eb',
    secondaryColor: s?.secondaryColor || '#0f172a',
    dolarActual: s?.dolarActual || 1400,
    tipoDolar: s?.tipoDolar || 'blue',
    tnaFinanciacion: s?.tnaFinanciacion || 48,
    comisionVentaDefecto: s?.comisionVentaDefecto || 3,
    telefonoContacto: s?.telefonoContacto || tenant.phone || '',
    emailContacto: s?.emailContacto || tenant.email || '',
    whatsappLead: s?.whatsappLead || '',
    cuit: s?.cuit || tenant.cuit || '',
    razonSocial: s?.razonSocial || tenant.name,
    direccion: s?.direccion || tenant.address || '',
    pieImpresion: s?.pieImpresion || '',
  }} />;
}
