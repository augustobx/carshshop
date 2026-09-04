"use server";

import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export async function getDashboardData() {
  const tenant = await getTenantContext();

  const [vehiculosProceso, vehiculosListos, ventas, gastos, cuotasArray] = await Promise.all([
    prisma.vehiculo.count({ where: { tenantId: tenant.id, estado: 'EN_PREPARACION' } }),
    prisma.vehiculo.count({ where: { tenantId: tenant.id, estado: 'LISTO_PARA_VENTA' } }),
    prisma.venta.count({ where: { tenantId: tenant.id } }),
    prisma.gasto.findMany({ where: { tenantId: tenant.id } }),
    prisma.ventaCuota.findMany({ where: { venta: { tenantId: tenant.id } } })
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

