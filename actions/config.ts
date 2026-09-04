'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const CONFIG_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER];
const DOLAR_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export async function guardarConfiguracion(data: {
  appName?: string;
  dolarActual: number;
  tipoDolar: string;
  tnaFinanciacion?: number;
  comisionVentaDefecto?: number;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  whatsappLead?: string;
  cuit?: string;
  razonSocial?: string;
  direccion?: string;
  pieImpresion?: string;
}) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CONFIG_ROLES);

    const dolar = Number(data.dolarActual);
    const appName = data.appName?.trim() || tenant.name;
    const razonSocial = data.razonSocial?.trim() || appName;
    const telefono = data.telefonoContacto?.trim() || null;
    const email = data.emailContacto?.trim() || null;
    const cuit = data.cuit?.trim() || null;
    const direccion = data.direccion?.trim() || null;

    if (!Number.isFinite(dolar) || dolar <= 0) return { success: false, error: 'La cotización del dólar debe ser mayor a cero.' };
    if (!['blue', 'oficial', 'mep'].includes(data.tipoDolar)) return { success: false, error: 'Tipo de dólar inválido.' };
    if (data.primaryColor && !HEX_RE.test(data.primaryColor)) return { success: false, error: 'Color principal inválido.' };
    if (data.secondaryColor && !HEX_RE.test(data.secondaryColor)) return { success: false, error: 'Color secundario inválido.' };
    if (data.logoUrl?.startsWith('data:') && data.logoUrl.length > 1_500_000) return { success: false, error: 'El logo es demasiado pesado. Usá una imagen menor a 1 MB.' };

    const settings = await db.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenant.id },
        data: { name: appName, cuit, address: direccion, phone: telefono, email },
      });

      return tx.tenantSettings.upsert({
        where: { tenantId: tenant.id },
        update: {
          appName,
          dolarActual: dolar,
          tipoDolar: data.tipoDolar,
          tnaFinanciacion: Math.max(0, Number(data.tnaFinanciacion || 0)),
          comisionVentaDefecto: Math.max(0, Number(data.comisionVentaDefecto || 0)),
          logoUrl: data.logoUrl || null,
          primaryColor: data.primaryColor || '#2563eb',
          secondaryColor: data.secondaryColor || '#0f172a',
          telefonoContacto: telefono,
          emailContacto: email,
          whatsappLead: data.whatsappLead?.trim() || null,
          cuit,
          razonSocial,
          direccion,
          pieImpresion: data.pieImpresion?.trim() || null,
        },
        create: {
          tenantId: tenant.id,
          appName,
          dolarActual: dolar,
          tipoDolar: data.tipoDolar,
          tnaFinanciacion: Math.max(0, Number(data.tnaFinanciacion || 0)),
          comisionVentaDefecto: Math.max(0, Number(data.comisionVentaDefecto || 0)),
          logoUrl: data.logoUrl || null,
          primaryColor: data.primaryColor || '#2563eb',
          secondaryColor: data.secondaryColor || '#0f172a',
          telefonoContacto: telefono,
          emailContacto: email,
          whatsappLead: data.whatsappLead?.trim() || null,
          cuit,
          razonSocial,
          direccion,
          pieImpresion: data.pieImpresion?.trim() || null,
        },
      });
    });

    revalidatePath('/', 'layout');
    revalidatePath('/configuracion');
    revalidatePath('/documentos', 'layout');
    return { success: true, settings };
  } catch (error: any) {
    console.error('Error guardando configuración:', error);
    return { success: false, error: 'No se pudo guardar la configuración.' };
  }
}

export async function updateConfig(clave: string, valor: string) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CONFIG_ROLES);
    const dataToUpdate: Record<string, unknown> = {};
    if (clave === 'dolar_actual') dataToUpdate.dolarActual = parseFloat(valor) || 1400;
    else if (clave === 'tipo_dolar' && ['blue', 'oficial', 'mep'].includes(valor)) dataToUpdate.tipoDolar = valor;
    else if (clave === 'empresa_logo') dataToUpdate.logoUrl = valor || null;
    else if (clave === 'tna') dataToUpdate.tnaFinanciacion = Math.max(0, parseFloat(valor) || 0);
    else if (clave === 'empresa_tema') {
      const parsed = JSON.parse(valor);
      if (parsed.primary && HEX_RE.test(parsed.primary)) dataToUpdate.primaryColor = parsed.primary;
      if (parsed.secondary && HEX_RE.test(parsed.secondary)) dataToUpdate.secondaryColor = parsed.secondary;
    } else return { success: false, error: 'Configuración no permitida.' };

    await db.tenantSettings.upsert({ where: { tenantId: tenant.id }, update: dataToUpdate, create: { tenantId: tenant.id, appName: tenant.name, ...dataToUpdate } });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error guardando configuración legacy:', error);
    return { success: false, error: 'Error guardando configuración.' };
  }
}

export async function syncDolarApi(tipo: string = 'blue') {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, DOLAR_ROLES);
    if (!['blue', 'oficial', 'mep'].includes(tipo)) return { success: false, error: 'Tipo de dólar inválido.' };

    const res = await fetch(`https://dolarapi.com/v1/dolares/${tipo}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API no responde');
    const data = await res.json();
    const valorVenta = Number(data.venta);
    if (!Number.isFinite(valorVenta) || valorVenta <= 0) return { success: false, error: 'Cotización no encontrada.' };

    await db.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: { dolarActual: valorVenta, tipoDolar: tipo },
      create: { tenantId: tenant.id, appName: tenant.name, dolarActual: valorVenta, tipoDolar: tipo },
    });

    revalidatePath('/', 'layout');
    return { success: true, valor: valorVenta };
  } catch (error) {
    console.error('Error sincronizando dólar:', error);
    return { success: false, error: 'No se pudo actualizar la cotización.' };
  }
}
