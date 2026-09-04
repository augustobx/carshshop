'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';

export async function obtenerDatosBoleto(id_venta: number) {
  const tenant = await getTenantContext();

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

  if (!venta) {
    throw new Error('Venta no encontrada.');
  }

  // Si hubo permuta, buscar el vehículo entregado
  let vehiculoPermuta = null;
  if (venta.id_vehiculo_permuta) {
    vehiculoPermuta = await db.vehiculo.findUnique({
      where: { id_vehiculo: venta.id_vehiculo_permuta, tenantId: tenant.id },
    });
  }

  return {
    venta,
    vehiculoPermuta,
    concesionaria: {
      nombre: tenant.name,
      cuit: tenant.cuit || '30-XXXXXXXX-X',
      direccion: tenant.address || 'Sede Comercial',
      ciudad: tenant.city || 'Ciudad Autónoma de Buenos Aires',
      telefono: tenant.phone || '',
      email: tenant.email || '',
      logoUrl: tenant.settings?.logoUrl || null,
    },
  };
}

export async function obtenerDatosReciboSenia(id_senia: number) {
  const tenant = await getTenantContext();

  const senia = await db.senia.findUnique({
    where: { id_senia, tenantId: tenant.id },
    include: {
      vehiculo: true,
      cliente: true,
      location: true,
    },
  });

  if (!senia) {
    throw new Error('Seña no encontrada.');
  }

  return {
    senia,
    concesionaria: {
      nombre: tenant.name,
      cuit: tenant.cuit || '30-XXXXXXXX-X',
      direccion: tenant.address || 'Sede Comercial',
      telefono: tenant.phone || '',
      logoUrl: tenant.settings?.logoUrl || null,
    },
  };
}

export async function obtenerFichaParabrisas(id_vehiculo: number) {
  const tenant = await getTenantContext();

  const vehiculo = await db.vehiculo.findUnique({
    where: { id_vehiculo, tenantId: tenant.id },
    include: {
      location: true,
    },
  });

  if (!vehiculo) {
    throw new Error('Vehículo no encontrado.');
  }

  return {
    vehiculo,
    concesionaria: {
      nombre: tenant.name,
      telefono: tenant.settings?.telefonoContacto || tenant.phone || '',
      whatsapp: tenant.settings?.whatsappLead || '',
      dolar: tenant.settings?.dolarActual || 1400,
      tna: tenant.settings?.tnaFinanciacion || 48,
    },
  };
}
