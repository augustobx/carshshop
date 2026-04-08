"use server"

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export async function getVehiculos() {
  return prisma.vehiculo.findMany({
    orderBy: { id_vehiculo: 'desc' },
    include: {
      tareas: {
        include: {
          gastos: true
        }
      }
    }
  });
}

export async function createVehiculo(data: any) {
  const vehiculo = await prisma.vehiculo.create({ data });
  revalidatePath('/inventario');
  return vehiculo;
}

export async function updateVehiculo(id: number, data: any) {
  const vehiculo = await prisma.vehiculo.update({ where: { id_vehiculo: id }, data });
  revalidatePath('/inventario');
  return vehiculo;
}
