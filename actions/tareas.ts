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

// CORRECCIÓN ACÁ ABAJO 👇: 
// 1. Ahora la función recibe el monto en ARS y la cotización.
// 2. Calcula el USD automáticamente.
// 3. Guarda el monto_ars en la base de datos para que TypeScript no se queje.
export async function agregarGasto(idTarea: number, idVehiculo: number, montoArs: number, cotizacionDolar: number, descripcion: string) {
  try {
    const montoUsd = montoArs / cotizacionDolar;

    await db.gasto.create({
      data: {
        id_tarea: idTarea,
        monto_ars: montoArs, // ¡Acá está lo que TypeScript exigía!
        monto_usd: montoUsd,
        descripcion: descripcion,
        // Si tu esquema exige categoría o tipo_movimiento, descomentá esto:
        // categoria: 'Reparación/Mantenimiento', 
        // tipo_movimiento: 'EGRESO'
      }
    });
    revalidatePath(`/vehiculos/${idVehiculo}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Error al registrar el gasto' };
  }
}