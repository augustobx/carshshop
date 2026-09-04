'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { RolMembresia } from '@prisma/client';

const DOC_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];

async function contextoDocumental() {
  const tenant = await getTenantContext();
  await requireTenantRole(tenant.id, DOC_ROLES);
  const settings = await db.tenantSettings.findUnique({ where: { tenantId: tenant.id } });
  return { tenant, settings };
}

export async function obtenerDatosBoleto(id_venta: number) {
  const { tenant, settings } = await contextoDocumental();
  const venta = await db.venta.findUnique({
    where: { id_venta, tenantId: tenant.id },
    include: {
      vehiculo: true,
      cliente: true,
      vendedor: { select: { name: true, email: true } },
      cuotas: { orderBy: { numero_cuota: 'asc' } },
      location: true,
    },
  });
  if (!venta) throw new Error('Venta no encontrada.');

  const vehiculoPermuta = venta.id_vehiculo_permuta
    ? await db.vehiculo.findUnique({ where: { id_vehiculo: venta.id_vehiculo_permuta, tenantId: tenant.id } })
    : null;

  return {
    venta,
    vehiculoPermuta,
    concesionaria: {
      nombre: settings?.razonSocial || settings?.appName || tenant.name,
      nombreComercial: settings?.appName || tenant.name,
      cuit: settings?.cuit || tenant.cuit || 'S/D',
      direccion: settings?.direccion || tenant.address || 'Sede Comercial',
      ciudad: tenant.city || '',
      telefono: settings?.telefonoContacto || tenant.phone || '',
      email: settings?.emailContacto || tenant.email || '',
      logoUrl: settings?.logoUrl || null,
      pieImpresion: settings?.pieImpresion || '',
    },
  };
}

export async function obtenerDatosReciboSenia(id_senia: number) {
  const { tenant, settings } = await contextoDocumental();
  const senia = await db.senia.findUnique({
    where: { id_senia, tenantId: tenant.id },
    include: { vehiculo: true, cliente: true, location: true },
  });
  if (!senia) throw new Error('Seña no encontrada.');

  return {
    senia,
    concesionaria: {
      nombre: settings?.razonSocial || settings?.appName || tenant.name,
      nombreComercial: settings?.appName || tenant.name,
      cuit: settings?.cuit || tenant.cuit || 'S/D',
      direccion: settings?.direccion || tenant.address || 'Sede Comercial',
      telefono: settings?.telefonoContacto || tenant.phone || '',
      logoUrl: settings?.logoUrl || null,
      pieImpresion: settings?.pieImpresion || '',
    },
  };
}

export async function obtenerFichaParabrisas(id_vehiculo: number) {
  const { tenant, settings } = await contextoDocumental();
  const vehiculo = await db.vehiculo.findUnique({
    where: { id_vehiculo, tenantId: tenant.id },
    include: { location: true },
  });
  if (!vehiculo) throw new Error('Vehículo no encontrado.');

  return {
    vehiculo,
    concesionaria: {
      nombre: settings?.appName || tenant.name,
      telefono: settings?.telefonoContacto || tenant.phone || '',
      whatsapp: settings?.whatsappLead || '',
      dolar: settings?.dolarActual || 1400,
      tna: settings?.tnaFinanciacion || 48,
      logoUrl: settings?.logoUrl || null,
      pieImpresion: settings?.pieImpresion || '',
    },
  };
}
