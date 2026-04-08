'use server';

import { prisma as db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function agregarTarea(idVehiculo: number, descripcion: string) {
  try {
    await db.tarea.create({
      data: {
        id_vehiculo: idVehiculo,
        descripcion,
        estado_tarea: 'PENDIENTE'
      }
    });
    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al crear la tarea' };
  }
}

export async function cambiarEstadoTarea(idTarea: number, nuevoEstado: 'PENDIENTE' | 'FINALIZADA', idVehiculo: number) {
  try {
    await db.tarea.update({
      where: { id_tarea: idTarea },
      data: { estado_tarea: nuevoEstado }
    });
    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al actualizar tarea' };
  }
}

export async function agregarGasto(idTarea: number, idVehiculo: number, montoUsd: number, descripcion: string) {
  try {
    await db.gasto.create({
      data: {
        id_tarea: idTarea,
        monto_usd: montoUsd,
        descripcion
      }
    });
    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al registrar el gasto' };
  }
}