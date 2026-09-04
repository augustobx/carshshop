'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { revalidatePath } from 'next/cache';

export async function updateConfig(clave: string, valor: string) {
  try {
    const tenant = await getTenantContext();

    const dataToUpdate: any = {};
    if (clave === 'dolar_actual') dataToUpdate.dolarActual = parseFloat(valor) || 1400;
    else if (clave === 'tipo_dolar') dataToUpdate.tipoDolar = valor;
    else if (clave === 'empresa_logo') dataToUpdate.logoUrl = valor;
    else if (clave === 'tna') dataToUpdate.tnaFinanciacion = parseFloat(valor) || 48;
    else if (clave === 'empresa_tema') {
      try {
        const parsed = JSON.parse(valor);
        if (parsed.primary) dataToUpdate.primaryColor = parsed.primary;
        if (parsed.secondary) dataToUpdate.secondaryColor = parsed.secondary;
      } catch {}
    }

    await db.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: dataToUpdate,
      create: {
        tenantId: tenant.id,
        appName: tenant.name,
        ...dataToUpdate,
      },
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Error guardando configuración:', error);
    return { success: false, error: 'Error guardando configuración' };
  }
}

export async function syncDolarApi(tipo: string = 'blue') {
  try {
    const tenant = await getTenantContext();
    const res = await fetch(`https://dolarapi.com/v1/dolares/${tipo}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API no responde');

    const data = await res.json();
    const valorVenta = data.venta;

    if (valorVenta) {
      await db.tenantSettings.upsert({
        where: { tenantId: tenant.id },
        update: {
          dolarActual: parseFloat(valorVenta),
          tipoDolar: tipo,
        },
        create: {
          tenantId: tenant.id,
          appName: tenant.name,
          dolarActual: parseFloat(valorVenta),
          tipoDolar: tipo,
        },
      });

      revalidatePath('/', 'layout');
      return { success: true, valor: valorVenta };
    }
    return { success: false, error: 'Cotización no encontrada' };
  } catch (error) {
    return { success: false, error: 'Error conectando con DolarAPI' };
  }
}