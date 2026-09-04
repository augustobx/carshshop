'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { normalizeSellerPwaConfig, SellerPwaConfig } from '@/lib/seller-pwa-config';
import { getObjectStorage } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const CONFIG_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER];
const DOLAR_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.ADMINISTRATIVO];
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

async function syncVehicleArsPrices(tx: any, tenantId: string, rate: number) {
  if (!Number.isFinite(rate) || rate <= 0) return;
  await tx.$executeRaw`UPDATE Vehiculo SET precio_venta_ars = ROUND(precio_venta_usd * ${rate}, 2) WHERE tenantId = ${tenantId} AND precio_venta_usd IS NOT NULL AND precio_venta_usd > 0`;
  await tx.$executeRaw`UPDATE Vehiculo SET precio_compra_ars = ROUND(precio_compra_usd * ${rate}, 2) WHERE tenantId = ${tenantId} AND precio_compra_usd IS NOT NULL AND precio_compra_usd > 0`;
}

function revalidateFinancialViews() {
  revalidatePath('/', 'layout');
  revalidatePath('/vehiculos');
  revalidatePath('/motos');
  revalidatePath('/ventas');
  revalidatePath('/ventas/nueva');
  revalidatePath('/prospectos');
  revalidatePath('/consignaciones');
  revalidatePath('/documentos', 'layout');
  revalidatePath('/pwa/dashboard');
  revalidatePath('/pwa/cotizador');
  revalidatePath('/pwa/operaciones');
}

async function normalizeLogoUrl(tenantId: string, logoUrl?: string | null): Promise<string | null> {
  const value = String(logoUrl || '').trim();
  if (!value) return null;
  if (!value.startsWith('data:')) return value;

  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp|avif));base64,(.+)$/i);
  if (!match) throw new Error('El logo inline legacy tiene un formato no soportado.');
  const mimeType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : mimeType.includes('avif') ? 'avif' : 'jpg';
  const uploaded = await getObjectStorage().upload({ tenantId, folder: 'branding', fileName: `logo_legacy.${extension}`, mimeType, buffer });
  return uploaded.url;
}

export async function subirLogoTenant(formData: FormData) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CONFIG_ROLES);
    const file = formData.get('file') as File | null;
    if (!file || !file.size) return { success: false, error: 'Seleccioná una imagen.' };

    const uploaded = await getObjectStorage().upload({ tenantId: tenant.id, folder: 'branding', fileName: file.name, mimeType: file.type, buffer: Buffer.from(await file.arrayBuffer()) });
    await db.tenantSettings.upsert({ where: { tenantId: tenant.id }, update: { logoUrl: uploaded.url }, create: { tenantId: tenant.id, appName: tenant.name, logoUrl: uploaded.url } });
    revalidatePath('/', 'layout');
    revalidatePath('/configuracion');
    revalidatePath('/pwa', 'layout');
    return { success: true, url: uploaded.url };
  } catch (error: any) {
    console.error('Error subiendo logo:', error);
    return { success: false, error: error?.message || 'No se pudo subir el logo.' };
  }
}

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

    const logoUrl = await normalizeLogoUrl(tenant.id, data.logoUrl);
    const settings = await db.$transaction(async (tx) => {
      await tx.tenant.update({ where: { id: tenant.id }, data: { name: appName, cuit, address: direccion, phone: telefono, email } });
      const values = {
        appName,
        dolarActual: dolar,
        tipoDolar: data.tipoDolar,
        tnaFinanciacion: Math.max(0, Number(data.tnaFinanciacion || 0)),
        comisionVentaDefecto: Math.max(0, Number(data.comisionVentaDefecto || 0)),
        logoUrl,
        primaryColor: data.primaryColor || '#2563eb',
        secondaryColor: data.secondaryColor || '#0f172a',
        telefonoContacto: telefono,
        emailContacto: email,
        whatsappLead: data.whatsappLead?.trim() || null,
        cuit,
        razonSocial,
        direccion,
        pieImpresion: data.pieImpresion?.trim() || null,
      };
      const saved = await tx.tenantSettings.upsert({ where: { tenantId: tenant.id }, update: values, create: { tenantId: tenant.id, ...values } });
      await syncVehicleArsPrices(tx, tenant.id, dolar);
      return saved;
    });

    revalidateFinancialViews();
    revalidatePath('/configuracion');
    return { success: true, settings };
  } catch (error: any) {
    console.error('Error guardando configuración:', error);
    return { success: false, error: error?.message || 'No se pudo guardar la configuración.' };
  }
}

export async function guardarPwaVendedorConfig(input: SellerPwaConfig) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CONFIG_ROLES);
    const config = normalizeSellerPwaConfig(input);
    await db.tenantFeature.upsert({ where: { tenantId_featureKey: { tenantId: tenant.id, featureKey: 'seller_pwa' } }, update: { isEnabled: true, config }, create: { tenantId: tenant.id, featureKey: 'seller_pwa', isEnabled: true, config } });
    revalidatePath('/configuracion');
    revalidatePath('/pwa', 'layout');
    return { success: true, config };
  } catch (error) {
    console.error('Error guardando configuración PWA vendedor:', error);
    return { success: false, error: 'No se pudo guardar la configuración de la app de vendedores.' };
  }
}

export async function updateConfig(clave: string, valor: string) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, CONFIG_ROLES);
    const dataToUpdate: Record<string, unknown> = {};
    let newRate: number | null = null;

    if (clave === 'dolar_actual') { newRate = parseFloat(valor) || 1400; dataToUpdate.dolarActual = newRate; }
    else if (clave === 'tipo_dolar' && ['blue', 'oficial', 'mep'].includes(valor)) dataToUpdate.tipoDolar = valor;
    else if (clave === 'empresa_logo') dataToUpdate.logoUrl = valor || null;
    else if (clave === 'tna') dataToUpdate.tnaFinanciacion = Math.max(0, parseFloat(valor) || 0);
    else if (clave === 'empresa_tema') {
      const parsed = JSON.parse(valor);
      if (parsed.primary && HEX_RE.test(parsed.primary)) dataToUpdate.primaryColor = parsed.primary;
      if (parsed.secondary && HEX_RE.test(parsed.secondary)) dataToUpdate.secondaryColor = parsed.secondary;
    } else return { success: false, error: 'Configuración no permitida.' };

    await db.$transaction(async (tx) => {
      await tx.tenantSettings.upsert({ where: { tenantId: tenant.id }, update: dataToUpdate, create: { tenantId: tenant.id, appName: tenant.name, ...dataToUpdate } });
      if (newRate) await syncVehicleArsPrices(tx, tenant.id, newRate);
    });
    revalidateFinancialViews();
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

    await db.$transaction(async (tx) => {
      await tx.tenantSettings.upsert({ where: { tenantId: tenant.id }, update: { dolarActual: valorVenta, tipoDolar: tipo }, create: { tenantId: tenant.id, appName: tenant.name, dolarActual: valorVenta, tipoDolar: tipo } });
      await syncVehicleArsPrices(tx, tenant.id, valorVenta);
    });
    revalidateFinancialViews();
    return { success: true, valor: valorVenta };
  } catch (error) {
    console.error('Error sincronizando dólar:', error);
    return { success: false, error: 'No se pudo actualizar la cotización.' };
  }
}
