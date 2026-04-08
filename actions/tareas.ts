"use server"

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTarea(id_vehiculo: number, descripcion: string) {
  const tarea = await prisma.tarea.create({
    data: { id_vehiculo, descripcion, estado_tarea: 'PENDIENTE' }
  });
  revalidatePath('/inventario');
  return tarea;
}

export async function updateEstadoTarea(id_tarea: number, estado: 'PENDIENTE' | 'FINALIZADA') {
  const tarea = await prisma.tarea.update({
    where: { id_tarea },
    data: { estado_tarea: estado }
  });
  revalidatePath('/inventario');
  return tarea;
}

export async function addGasto(id_tarea: number, descripcion: string, monto_usd: number) {
  const gasto = await prisma.gasto.create({
    data: { id_tarea, descripcion, monto_usd }
  });
  // Actualizar también la tarea a PENDIENTE de vuelta si se agregó un gasto extra? Opcional
  revalidatePath('/inventario');
  return gasto;
}
