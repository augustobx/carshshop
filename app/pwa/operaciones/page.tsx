import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { RolMembresia } from '@prisma/client';
import OperacionesMobileClient from './OperacionesMobileClient';

export const dynamic = 'force-dynamic';

export default async function PwaOperacionesPage() {
  const tenant = await getTenantContext();
  const { user } = await requireTenantRole(tenant.id, [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR]);
  const dolarActual = Number(tenant.settings?.dolarActual || 1400);

  const prospectos = await db.prospecto.findMany({
    where: { tenantId: tenant.id, vendedorId: user.id },
    include: {
      cliente: { select: { id_cliente: true, nombre_completo: true, telefono: true } },
      vehiculo_interes: { select: { id_vehiculo: true, marca: true, modelo: true, version: true, patente: true, anio: true } },
      cotizaciones: { orderBy: { createdAt: 'desc' }, take: 1 },
      senias: { where: { estado: 'ACTIVA' }, orderBy: { fecha_senia: 'desc' }, take: 1 },
      ventas: { orderBy: { fecha_venta: 'desc' }, take: 1 },
    },
    orderBy: [{ proxima_accion: 'asc' }, { updatedAt: 'desc' }],
    take: 300,
  });

  const data = prospectos.map((p) => {
    const q = p.cotizaciones[0];
    const s = p.senias[0];
    const v = p.ventas[0];
    return {
      id_prospecto: p.id_prospecto,
      estado: p.estado,
      nombre: p.cliente?.nombre_completo || p.nombre,
      telefono: p.cliente?.telefono || p.telefono,
      proxima_accion: p.proxima_accion?.toISOString() || null,
      updatedAt: p.updatedAt.toISOString(),
      vehiculo: p.vehiculo_interes ? `${p.vehiculo_interes.marca} ${p.vehiculo_interes.modelo}${p.vehiculo_interes.version ? ` ${p.vehiculo_interes.version}` : ''}` : 'Sin unidad',
      patente: p.vehiculo_interes?.patente || null,
      cotizacion: q ? {
        id: q.id_cotizacion,
        estado: q.estado,
        usd: Number(q.precio_final_usd || 0),
        rate: Number(q.cotizacion_dolar || dolarActual),
        ars: Number(q.precio_final_usd || 0) * Number(q.cotizacion_dolar || dolarActual),
        fecha: q.createdAt.toISOString(),
        validez: q.validez_hasta?.toISOString() || null,
      } : null,
      reserva: s ? { id: s.id_senia, ars: Number(s.monto_ars || 0), usd: Number(s.monto_usd || 0), fecha: s.fecha_senia.toISOString() } : null,
      venta: v ? { id: v.id_venta, boleto: v.numero_boleto, fecha: v.fecha_venta.toISOString() } : null,
    };
  });

  return <OperacionesMobileClient operaciones={data} />;
}
