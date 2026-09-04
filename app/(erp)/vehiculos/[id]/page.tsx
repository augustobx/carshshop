import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { notFound } from 'next/navigation';
import VehiculoDashboardClient from './VehiculoDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DetalleVehiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idVehiculo = Number(id);
  if (!Number.isInteger(idVehiculo)) notFound();

  const tenant = await getTenantContext();

  const [clientesDb, vehiculoDb] = await Promise.all([
    db.cliente.findMany({
      where: { tenantId: tenant.id },
      orderBy: { nombre_completo: 'asc' },
    }),
    db.vehiculo.findFirst({
      where: { id_vehiculo: idVehiculo, tenantId: tenant.id },
      include: {
        cliente: true,
        location: true,
        tareas: { include: { gastos: true }, orderBy: { id_tarea: 'desc' } },
        senias: { include: { cliente: true, prospecto: true }, orderBy: { id_senia: 'desc' } },
        anotaciones: { include: { usuario: true }, orderBy: { fecha: 'desc' } },
        fotos: { orderBy: { orden: 'asc' } },
        prospectos: {
          include: {
            cliente: true,
            cotizaciones: { orderBy: { createdAt: 'desc' }, take: 3 },
            senias: { where: { estado: 'ACTIVA' }, take: 1 },
            ventas: { orderBy: { fecha_venta: 'desc' }, take: 1 },
          },
          orderBy: { updatedAt: 'desc' },
        },
        cotizaciones: {
          include: { prospecto: true, cliente: true, vendedor: true },
          orderBy: { createdAt: 'desc' },
        },
        ventas: {
          include: { cliente: true, vendedor: true, prospecto: true, entrega: true },
          orderBy: { fecha_venta: 'desc' },
        },
      },
    }),
  ]);

  if (!vehiculoDb) notFound();

  const vehiculoData = {
    ...vehiculoDb,
    precio_compra_usd: Number(vehiculoDb.precio_compra_usd || 0),
    precio_compra_ars: Number(vehiculoDb.precio_compra_ars || 0),
    precio_venta_usd: Number(vehiculoDb.precio_venta_usd || 0),
    precio_venta_ars: Number(vehiculoDb.precio_venta_ars || 0),
    gastos_preparacion_usd: Number(vehiculoDb.gastos_preparacion_usd || 0),
    gastos_gestoria_usd: Number(vehiculoDb.gastos_gestoria_usd || 0),
    costo_total_real_usd: Number(vehiculoDb.costo_total_real_usd || 0),
    comision_consignacion_pct: Number(vehiculoDb.comision_consignacion_pct || 0),
    tareas: vehiculoDb.tareas.map((t) => ({
      ...t,
      gastos: t.gastos.map((g) => ({ ...g, monto_usd: Number(g.monto_usd), monto_ars: Number(g.monto_ars) })),
    })),
    senias: vehiculoDb.senias.map((s) => ({ ...s, monto_usd: Number(s.monto_usd), monto_ars: Number(s.monto_ars), cotizacion: Number(s.cotizacion) })),
    prospectos: vehiculoDb.prospectos.map((p) => ({
      ...p,
      presupuesto_estimado_usd: Number(p.presupuesto_estimado_usd || 0),
      cotizaciones: p.cotizaciones.map((c) => ({ ...c, precio_final_usd: Number(c.precio_final_usd) })),
      senias: p.senias.map((s) => ({ ...s, monto_usd: Number(s.monto_usd) })),
    })),
    cotizaciones: vehiculoDb.cotizaciones.map((c) => ({
      ...c,
      precio_final_usd: Number(c.precio_final_usd),
      cotizacion_dolar: Number(c.cotizacion_dolar),
      anticipo_usd: Number(c.anticipo_usd || 0),
      valor_permuta_usd: Number(c.valor_permuta_usd || 0),
    })),
    ventas: vehiculoDb.ventas.map((v) => ({
      ...v,
      precio_final_usd: Number(v.precio_final_usd),
      cotizacion_dolar_venta: Number(v.cotizacion_dolar_venta || 0),
      valor_toma_permuta_usd: Number(v.valor_toma_permuta_usd || 0),
    })),
  };

  const timeline = [
    { id: `ingreso-${vehiculoDb.id_vehiculo}`, type: 'INGRESO', title: 'Ingreso al inventario', detail: vehiculoDb.tipo_ingreso || 'Propio', date: vehiculoDb.fecha_ingreso },
    ...vehiculoDb.anotaciones.map((a) => ({ id: `nota-${a.id_anotacion}`, type: 'NOTA', title: 'Nota de bitácora', detail: a.texto, date: a.fecha })),
    ...vehiculoDb.tareas.map((t) => ({ id: `tarea-${t.id_tarea}`, type: 'TAREA', title: t.descripcion, detail: t.estado_tarea, date: t.fecha_fin || t.fecha_inicio })),
    ...vehiculoDb.prospectos.map((p) => ({ id: `prospecto-${p.id_prospecto}`, type: 'PROSPECTO', title: `Interés: ${p.nombre}`, detail: p.estado, date: p.createdAt })),
    ...vehiculoDb.cotizaciones.map((c) => ({ id: `cotizacion-${c.id_cotizacion}`, type: 'COTIZACION', title: `Cotización #${c.id_cotizacion}`, detail: `${c.estado} · USD ${Number(c.precio_final_usd).toLocaleString('es-AR')}`, date: c.createdAt })),
    ...vehiculoDb.senias.map((s) => ({ id: `reserva-${s.id_senia}`, type: 'RESERVA', title: `Reserva ${s.recibo_nro || `#${s.id_senia}`}`, detail: `${s.estado} · ${s.cliente.nombre_completo}`, date: s.fecha_senia })),
    ...vehiculoDb.ventas.flatMap((v) => [
      { id: `venta-${v.id_venta}`, type: 'VENTA', title: `Venta ${v.numero_boleto || `#${v.id_venta}`}`, detail: `${v.cliente.nombre_completo} · USD ${Number(v.precio_final_usd).toLocaleString('es-AR')}`, date: v.fecha_venta },
      ...(v.entrega ? [{ id: `entrega-${v.entrega.id_entrega}`, type: 'ENTREGA', title: v.entrega.estado === 'ENTREGADA' ? 'Unidad entregada' : 'Entrega programada', detail: v.entrega.estado, date: v.entrega.fecha_entrega || v.entrega.fecha_programada || v.entrega.createdAt }] : []),
    ]),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return <VehiculoDashboardClient vehiculo={vehiculoData as any} clientes={clientesDb as any[]} timeline={timeline as any[]} />;
}
