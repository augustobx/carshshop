import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import DashboardClient from "./DashboardClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);
  const treintaDiasAtras = new Date();
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

  const [
    stockDisponible,
    tareasPendientes,
    ventasMes,
    enReparacion,
    totalOperaciones,
    capitalStock,
  ] = await Promise.all([
    db.vehiculo.count({ where: { tenantId: tenant.id, estado: 'LISTO_PARA_VENTA' } }),
    db.tarea.count({ where: { vehiculo: { tenantId: tenant.id }, estado_tarea: 'PENDIENTE' } }),
    db.venta.findMany({
      where: { tenantId: tenant.id, fecha_venta: { gte: treintaDiasAtras } },
      select: { precio_final_usd: true, cotizacion_dolar_venta: true },
    }),
    db.vehiculo.count({ where: { tenantId: tenant.id, estado: 'EN_PREPARACION' } }),
    db.venta.count({ where: { tenantId: tenant.id } }),
    db.vehiculo.findMany({
      where: { tenantId: tenant.id, estado: { not: 'VENDIDO' } },
      select: { precio_compra_usd: true, precio_compra_ars: true },
    }),
  ]);

  const ventasMesUsd = ventasMes.reduce((sum, v) => sum + Number(v.precio_final_usd || 0), 0);
  const ventasMesArs = ventasMes.reduce((sum, v) => sum + Number(v.precio_final_usd || 0) * Number(v.cotizacion_dolar_venta || dolarActual), 0);
  const capitalStockUsd = capitalStock.reduce((sum, v) => sum + Number(v.precio_compra_usd || 0), 0);
  const capitalStockArs = capitalStock.reduce((sum, v) => {
    const storedArs = Number(v.precio_compra_ars || 0);
    return sum + (storedArs > 0 ? storedArs : Number(v.precio_compra_usd || 0) * dolarActual);
  }, 0);

  return (
    <DashboardClient
      dolarActual={dolarActual}
      stats={{
        stockDisponible,
        tareasPendientes,
        ventasMesUsd,
        ventasMesArs,
        enReparacion,
        totalOperaciones,
        capitalStockUsd,
        capitalStockArs,
      }}
    />
  );
}
