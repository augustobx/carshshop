import { prisma as db } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Obtener cotización actual
  const cfgDolar = await db.configuracion.findUnique({ where: { clave: 'dolar_blue' } });
  const dolarBlue = cfgDolar ? parseFloat(cfgDolar.valor) : 1000;

  // 2. Obtener estadísticas de vehículos
  const vehiculosEnPrep = await db.vehiculo.count({ where: { estado: 'EN_PREPARACION' } });
  const vehiculosListos = await db.vehiculo.count({ where: { estado: 'LISTO_PARA_VENTA' } });

  // 3. Obtener Capital en Préstamos Activos
  const prestamosActivos = await db.prestamo.findMany({
    where: { estado: 'EN_CURSO' },
    include: { cuotas: { where: { estado: 'PENDIENTE' } } }
  });

  let capitalEnCalleUsd = 0;
  prestamosActivos.forEach(p => {
    p.cuotas.forEach(c => capitalEnCalleUsd += Number(c.monto_usd));
  });

  const stats = {
    dolarBlue,
    vehiculosEnPrep,
    vehiculosListos,
    capitalEnCalleUsd,
    capitalEnCalleArs: capitalEnCalleUsd * dolarBlue,
  };

  return <DashboardClient stats={stats} />;
}