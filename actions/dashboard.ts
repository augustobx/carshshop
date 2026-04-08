"use server"

import { prisma } from "../lib/prisma";

export async function getDashboardData() {
  const [vehiculosProceso, vehiculosListos, ventas, gastos, cuotasArray] = await Promise.all([
    prisma.vehiculo.count({ where: { estado: 'EN_PREPARACION' } }),
    prisma.vehiculo.count({ where: { estado: 'LISTO_PARA_VENTA' } }),
    prisma.venta.count(),
    prisma.gasto.findMany(),
    prisma.ventaCuota.findMany()
  ]);

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto_usd), 0);
  const totalIngresosEsperados = cuotasArray.filter(c => c.estado === 'PENDIENTE').reduce((sum, c) => sum + Number(c.monto_usd), 0);
  const totalIngresosCobrados = cuotasArray.filter(c => c.estado === 'PAGADA').reduce((sum, c) => sum + Number(c.monto_usd), 0);

  return {
    vehiculosProceso,
    vehiculosListos,
    ventasTotales: ventas,
    totalGastos,
    totalIngresosEsperados,
    totalIngresosCobrados,
    chartData: [
      { name: "Ingresos Cobrados", value: totalIngresosCobrados },
      { name: "Ingresos Pendientes", value: totalIngresosEsperados },
      { name: "Gastos", value: totalGastos }
    ]
  };
}
