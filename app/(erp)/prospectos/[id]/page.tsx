import { notFound } from 'next/navigation';
import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import OperacionComercialClient from './OperacionComercialClient';

export const dynamic = 'force-dynamic';

function moneyDetail(usd: number, rate: number) {
  const ars = Number(usd || 0) * Number(rate || 0);
  return `$ ${ars.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS · U$S ${Number(usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export default async function OperacionComercialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prospectoId = Number(id);
  if (!Number.isInteger(prospectoId)) notFound();

  const tenant = await getTenantContext();
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const [prospectoDb, vehiculosDb] = await Promise.all([
    db.prospecto.findFirst({
      where: { id_prospecto: prospectoId, tenantId: tenant.id },
      include: {
        cliente: true,
        vehiculo_interes: true,
        cotizaciones: {
          include: { vehiculo: true, cliente: true, vendedor: true },
          orderBy: { createdAt: 'desc' },
        },
        senias: {
          include: { vehiculo: true, cliente: true, cotizacionRef: true },
          orderBy: { fecha_senia: 'desc' },
        },
        ventas: {
          include: { vehiculo: true, cliente: true, vendedor: true, cotizacion: true, entrega: true },
          orderBy: { fecha_venta: 'desc' },
        },
      },
    }),
    db.vehiculo.findMany({
      where: {
        tenantId: tenant.id,
        estado: { in: ['EN_PREPARACION', 'LISTO_PARA_VENTA', 'EN_CONSIGNACION', 'SENADO'] },
      },
      select: {
        id_vehiculo: true,
        marca: true,
        modelo: true,
        version: true,
        anio: true,
        patente: true,
        estado: true,
        precio_venta_usd: true,
        precio_venta_ars: true,
      },
      orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
    }),
  ]);

  if (!prospectoDb) notFound();

  const prospecto = {
    ...prospectoDb,
    presupuesto_estimado_usd: Number(prospectoDb.presupuesto_estimado_usd || 0),
    vehiculo_interes: prospectoDb.vehiculo_interes
      ? {
          ...prospectoDb.vehiculo_interes,
          precio_venta_usd: Number(prospectoDb.vehiculo_interes.precio_venta_usd || 0),
          precio_venta_ars: Number(prospectoDb.vehiculo_interes.precio_venta_ars || 0),
        }
      : null,
    cotizaciones: prospectoDb.cotizaciones.map((c) => ({
      ...c,
      precio_final_usd: Number(c.precio_final_usd),
      cotizacion_dolar: Number(c.cotizacion_dolar),
      anticipo_usd: Number(c.anticipo_usd || 0),
      saldo_financiado_usd: Number(c.saldo_financiado_usd || 0),
      valor_cuota_usd: Number(c.valor_cuota_usd || 0),
      valor_permuta_usd: Number(c.valor_permuta_usd || 0),
    })),
    senias: prospectoDb.senias.map((s) => ({
      ...s,
      monto_usd: Number(s.monto_usd),
      monto_ars: Number(s.monto_ars),
      cotizacion: Number(s.cotizacion),
    })),
    ventas: prospectoDb.ventas.map((v) => ({
      ...v,
      precio_final_usd: Number(v.precio_final_usd),
      cotizacion_dolar_venta: Number(v.cotizacion_dolar_venta || 0),
      anticipo_usd: Number(v.anticipo_usd || 0),
      saldo_financiado_usd: Number(v.saldo_financiado_usd || 0),
      valor_toma_permuta_usd: Number(v.valor_toma_permuta_usd || 0),
    })),
  };

  const vehiculos = vehiculosDb.map((v) => ({
    ...v,
    precio_venta_usd: Number(v.precio_venta_usd || 0),
    precio_venta_ars: Number(v.precio_venta_ars || 0),
  }));

  const timeline = [
    {
      id: `prospecto-${prospectoDb.id_prospecto}`,
      type: 'PROSPECTO',
      title: 'Prospecto ingresado',
      detail: `${prospectoDb.origen || 'SHOWROOM'} · ${prospectoDb.nombre}`,
      date: prospectoDb.createdAt,
    },
    ...prospectoDb.cotizaciones.map((c) => ({
      id: `cotizacion-${c.id_cotizacion}`,
      type: 'COTIZACION',
      title: `Cotización #${c.id_cotizacion}`,
      detail: `${c.estado} · ${moneyDetail(Number(c.precio_final_usd), Number(c.cotizacion_dolar))}`,
      date: c.createdAt,
    })),
    ...prospectoDb.senias.map((s) => ({
      id: `reserva-${s.id_senia}`,
      type: 'RESERVA',
      title: `Reserva ${s.recibo_nro || `#${s.id_senia}`}`,
      detail: `${s.estado} · $ ${Number(s.monto_ars).toLocaleString('es-AR')} ARS · U$S ${Number(s.monto_usd).toLocaleString('es-AR')}`,
      date: s.fecha_senia,
    })),
    ...prospectoDb.ventas.flatMap((v) => [
      {
        id: `venta-${v.id_venta}`,
        type: 'VENTA',
        title: `Venta ${v.numero_boleto || `#${v.id_venta}`}`,
        detail: moneyDetail(Number(v.precio_final_usd), Number(v.cotizacion_dolar_venta || dolarActual)),
        date: v.fecha_venta,
      },
      ...(v.entrega
        ? [{
            id: `entrega-${v.entrega.id_entrega}`,
            type: 'ENTREGA',
            title: v.entrega.estado === 'ENTREGADA' ? 'Unidad entregada' : 'Entrega programada',
            detail: v.entrega.fecha_programada ? new Date(v.entrega.fecha_programada).toLocaleString('es-AR') : v.entrega.estado,
            date: v.entrega.fecha_entrega || v.entrega.fecha_programada || v.entrega.createdAt,
          }]
        : []),
    ]),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <OperacionComercialClient
      prospecto={prospecto as any}
      vehiculos={vehiculos as any[]}
      dolarActual={dolarActual}
      timeline={timeline as any[]}
    />
  );
}
