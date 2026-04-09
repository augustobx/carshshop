'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateConfig(clave: string, valor: string) {
  try {
    await db.configuracion.upsert({
      where: { clave },
      update: { valor },
      create: { clave, valor }
    });
    revalidatePath('/', 'layout'); // Fuerza la recarga de la barra superior
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error guardando configuración' };
  }
}

export async function syncDolarApi(tipo: string = 'blue') {
  try {
    const res = await fetch(`https://dolarapi.com/v1/dolares/${tipo}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API no responde');

    const data = await res.json();
    const valorVenta = data.venta;

    if (valorVenta) {
      // Guardamos el nuevo valor en la base de datos
      await updateConfig('dolar_actual', valorVenta.toString());
      return { success: true, valor: valorVenta };
    }
    return { success: false, error: 'Cotización no encontrada' };
  } catch (error) {
    return { success: false, error: 'Error conectando con DolarAPI' };
  }
}