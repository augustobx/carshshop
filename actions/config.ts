"use server"

import { prisma } from "../lib/prisma";

export async function getConfigData() {
  const [dolarObj, tnaObj] = await Promise.all([
    prisma.configuracion.findUnique({ where: { clave: "dolar_blue" } }),
    prisma.configuracion.findUnique({ where: { clave: "tna" } })
  ]);
  
  return {
    dolar_blue: dolarObj?.valor || "1000",
    tna: tnaObj?.valor || "0.05"
  };
}
