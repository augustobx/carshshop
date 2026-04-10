import { prisma as db } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Calculamos la fecha de hace 30 días con Javascript nativo
  const treintaDiasAtras = new Date();
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

  // Consultas en paralelo a Prisma para máxima velocidad
  const [
    stockDisponible,
    tareasPendientes,
    ventasMes,
    enReparacion,
    totalOperaciones,
    capitalStock
  ] = await Promise.all([
    db.vehiculo.count({ where: { estado: 'LISTO_PARA_VENTA' } }),
    db.tarea.count({ where: { estado_tarea: 'PENDIENTE' } }),
    db.venta.aggregate({
      _sum: { precio_final_usd: true },
      where: { fecha_venta: { gte: treintaDiasAtras } }
    }),
    db.vehiculo.count({ where: { estado: 'EN_PREPARACION' } }),
    db.venta.count(),
    db.vehiculo.aggregate({
      _sum: { precio_compra_usd: true },
      where: { estado: { not: 'VENDIDO' } }
    })
  ]);

  return (
    <DashboardClient
      stats={{
        stockDisponible,
        tareasPendientes,
        ventasMesUsd: Number(ventasMes._sum.precio_final_usd || 0),
        enReparacion,
        totalOperaciones,
        capitalStockUsd: Number(capitalStock._sum.precio_compra_usd || 0)
      }}
    />
  );
}