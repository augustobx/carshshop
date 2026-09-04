'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { normalizeSellerPwaConfig } from '@/lib/seller-pwa-config';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const SALE_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR];

export async function registrarVenta(data: {
  id_vehiculo: number;
  id_cliente: number;
  precio_final_usd: number;
  cotizacion_dolar: number;
  forma_pago: 'Contado' | 'Cuotas';
  anticipo_usd?: number;
  saldo_financiado_usd?: number;
  comision_vendedor_usd?: number;
  observaciones?: string;
  prospectoId?: number;
  cotizacionId?: number;
  usarCotizacionReserva?: boolean;
  cuotas?: { numero_cuota: number; monto_usd: number; fecha_vencimiento: string }[];
  permuta?: {
    tipo_vehiculo?: string;
    marca: string;
    modelo: string;
    version?: string;
    anio: number;
    km: number;
    patente?: string;
    color?: string;
    motor?: string;
    valor_toma_usd: number;
  };
}) {
  try {
    const tenant = await getTenantContext();
    const { user, role } = await requireTenantRole(tenant.id, SALE_ROLES);

    if (role === RolMembresia.VENDEDOR && !user.isSuperAdmin) {
      const sellerPwaFeature = await db.tenantFeature.findUnique({ where: { tenantId_featureKey: { tenantId: tenant.id, featureKey: 'seller_pwa' } } });
      if (!normalizeSellerPwaConfig(sellerPwaFeature?.config).allowCloseSales) return { success: false, error: 'El cierre de ventas desde la cuenta de vendedor está deshabilitado por configuración.' };
    }

    const precioUsd = Number(data.precio_final_usd);
    const rate = Number(data.cotizacion_dolar);
    if (!Number.isFinite(precioUsd) || precioUsd <= 0 || !Number.isFinite(rate) || rate <= 0) return { success: false, error: 'Precio final y cotización deben ser mayores a cero.' };
    if (!['Contado', 'Cuotas'].includes(data.forma_pago)) return { success: false, error: 'Forma de pago inválida.' };

    const result = await db.$transaction(async (tx) => {
      const [vehiculoVenta, clienteVenta, reservaActiva] = await Promise.all([
        tx.vehiculo.findFirst({ where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id } }),
        tx.cliente.findFirst({ where: { id_cliente: data.id_cliente, tenantId: tenant.id } }),
        tx.senia.findFirst({
          where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id, estado: 'ACTIVA' },
          include: {
            cliente: { select: { nombre_completo: true } },
            cotizacionRef: { select: { id_cotizacion: true, precio_final_usd: true, cotizacion_dolar: true, prospectoId: true } },
          },
          orderBy: { fecha_senia: 'desc' },
        }),
      ]);
      if (!vehiculoVenta || !clienteVenta) throw new Error('Vehículo o cliente inválido para esta concesionaria.');
      if (vehiculoVenta.estado === 'VENDIDO') throw new Error('La unidad ya figura como vendida.');
      if (reservaActiva && reservaActiva.id_cliente !== data.id_cliente) throw new Error(`La unidad tiene una reserva activa a nombre de ${reservaActiva.cliente.nombre_completo}.`);

      let prospectoId = data.prospectoId || reservaActiva?.prospectoId || null;
      if (prospectoId) {
        const p = await tx.prospecto.findFirst({ where: { id_prospecto: prospectoId, tenantId: tenant.id } });
        if (!p) throw new Error('El prospecto indicado no pertenece a esta concesionaria.');
      } else {
        const p = await tx.prospecto.findFirst({ where: { tenantId: tenant.id, id_cliente: data.id_cliente, id_vehiculo_interes: data.id_vehiculo, estado: { notIn: ['PERDIDO', 'GANADO'] } }, orderBy: { updatedAt: 'desc' } });
        prospectoId = p?.id_prospecto || null;
      }

      const isReservationQuote = Boolean(reservaActiva?.cotizacionId && data.cotizacionId && reservaActiva.cotizacionId === data.cotizacionId);
      const useReservedQuote = Boolean(data.usarCotizacionReserva || isReservationQuote);
      let cotizacionId = data.cotizacionId || (useReservedQuote ? reservaActiva?.cotizacionId || null : null);

      if (useReservedQuote) {
        if (!reservaActiva?.cotizacionRef) throw new Error('La reserva no tiene una cotización histórica vinculada.');
        const qPrice = Number(reservaActiva.cotizacionRef.precio_final_usd || 0);
        const qRate = Number(reservaActiva.cotizacionRef.cotizacion_dolar || 0);
        if (Math.abs(qPrice - precioUsd) > 0.02 || Math.abs(qRate - rate) > 0.02) throw new Error('El precio enviado no coincide con la cotización reservada seleccionada.');
        cotizacionId = reservaActiva.cotizacionRef.id_cotizacion;
      }

      if (cotizacionId) {
        const q = await tx.cotizacion.findFirst({ where: { id_cotizacion: cotizacionId, tenantId: tenant.id, id_vehiculo: data.id_vehiculo } });
        if (!q) throw new Error('La cotización indicada no es válida para esta unidad.');
        if (prospectoId && q.prospectoId && q.prospectoId !== prospectoId) throw new Error('La cotización no pertenece al prospecto indicado.');
      } else if (prospectoId && !reservaActiva) {
        const q = await tx.cotizacion.findFirst({ where: { tenantId: tenant.id, prospectoId, id_vehiculo: data.id_vehiculo, estado: { in: ['ENVIADA', 'ACEPTADA'] } }, orderBy: { createdAt: 'desc' } });
        cotizacionId = q?.id_cotizacion || null;
      }

      let idVehiculoPermuta: number | null = null;
      let valorTomaPermuta = 0;
      if (data.permuta && Number(data.permuta.valor_toma_usd) > 0) {
        valorTomaPermuta = Number(data.permuta.valor_toma_usd);
        if (!data.permuta.marca?.trim() || !data.permuta.modelo?.trim() || !Number.isFinite(Number(data.permuta.anio))) throw new Error('La permuta requiere marca, modelo y año válidos.');
        const permutado = await tx.vehiculo.create({ data: {
          tenantId: tenant.id,
          locationId: vehiculoVenta.locationId || tenant.primaryLocationId || null,
          tipo_vehiculo: data.permuta.tipo_vehiculo || 'Auto',
          marca: data.permuta.marca.trim(), modelo: data.permuta.modelo.trim(), version: data.permuta.version?.trim() || null,
          anio: Number(data.permuta.anio), km: Math.max(0, Number(data.permuta.km || 0)),
          patente: data.permuta.patente?.trim() ? data.permuta.patente.toUpperCase().trim() : null,
          color: data.permuta.color?.trim() || null, motor: data.permuta.motor?.trim() || null,
          tipo_ingreso: 'Permuta', estado: 'EN_PREPARACION',
          precio_compra_usd: valorTomaPermuta, precio_compra_ars: valorTomaPermuta * rate, costo_total_real_usd: valorTomaPermuta,
          id_cliente: data.id_cliente,
        } });
        idVehiculoPermuta = permutado.id_vehiculo;
      }

      const reservaUsdAplicada = reservaActiva ? Number(reservaActiva.monto_ars || 0) / rate : 0;
      const anticipoSolicitado = Math.max(0, Number(data.anticipo_usd || 0));
      const anticipo = data.forma_pago === 'Contado' ? precioUsd : Math.max(anticipoSolicitado, reservaUsdAplicada);
      const saldo = data.forma_pago === 'Cuotas' ? Math.max(0, precioUsd - anticipo - valorTomaPermuta) : 0;

      if (data.forma_pago === 'Cuotas' && anticipo + valorTomaPermuta >= precioUsd) throw new Error('Anticipo y permuta no pueden cubrir o superar el total si la operación se marca financiada.');
      if (data.forma_pago === 'Cuotas' && (!data.cuotas?.length || saldo <= 0)) throw new Error('La venta financiada requiere saldo y plan de cuotas.');

      // Si había reserva y el usuario eligió el precio actual, generamos una nueva cotización
      // de cierre. La cotización histórica de la reserva permanece intacta.
      if (reservaActiva && !useReservedQuote) {
        const closingQuote = await tx.cotizacion.create({ data: {
          tenantId: tenant.id,
          prospectoId,
          id_cliente: data.id_cliente,
          id_vehiculo: data.id_vehiculo,
          vendedorId: user.id,
          estado: 'ACEPTADA',
          precio_final_usd: precioUsd,
          cotizacion_dolar: rate,
          forma_pago: data.forma_pago,
          anticipo_usd: anticipo,
          saldo_financiado_usd: saldo,
          valor_permuta_usd: valorTomaPermuta,
          tiene_permuta: Boolean(idVehiculoPermuta),
          observaciones: 'Cotización de cierre creada al elegir el valor vigente de una unidad reservada.',
        } });
        cotizacionId = closingQuote.id_cotizacion;
      }

      const venta = await tx.venta.create({ data: {
        tenantId: tenant.id, locationId: vehiculoVenta.locationId || tenant.primaryLocationId || null,
        id_vehiculo: data.id_vehiculo, id_cliente: data.id_cliente, vendedorId: user.id,
        prospectoId, cotizacionId, precio_final_usd: precioUsd, cotizacion_dolar_venta: rate,
        forma_pago: data.forma_pago, anticipo_usd: anticipo, saldo_financiado_usd: saldo,
        comision_vendedor_usd: Math.max(0, Number(data.comision_vendedor_usd || 0)),
        id_vehiculo_permuta: idVehiculoPermuta, valor_toma_permuta_usd: valorTomaPermuta,
        observaciones: data.observaciones?.trim() || null,
      } });
      const numeroBoleto = `BOL-${new Date().getFullYear()}-${String(venta.id_venta).padStart(6, '0')}`;
      await tx.venta.update({ where: { id_venta: venta.id_venta }, data: { numero_boleto: numeroBoleto } });

      if (idVehiculoPermuta) await tx.vehiculo.update({ where: { id_vehiculo: idVehiculoPermuta }, data: { permuta_de_venta_id: venta.id_venta, notas_internas: `Ingresado como permuta en ${numeroBoleto}` } });

      if (data.forma_pago === 'Cuotas' && data.cuotas?.length) {
        const cuotas = data.cuotas.map((c, idx) => ({ tenantId: tenant.id, id_venta: venta.id_venta, numero_cuota: Number(c.numero_cuota || idx + 1), monto_usd: Math.max(0, Number(c.monto_usd || 0)), fecha_vencimiento: new Date(c.fecha_vencimiento), estado: 'PENDIENTE' as const }));
        if (cuotas.some((c) => !Number.isFinite(c.monto_usd) || c.monto_usd <= 0 || Number.isNaN(c.fecha_vencimiento.getTime()))) throw new Error('El plan de cuotas contiene valores inválidos.');
        await tx.ventaCuota.createMany({ data: cuotas });
      }

      await tx.vehiculo.update({ where: { id_vehiculo: data.id_vehiculo }, data: { estado: 'VENDIDO' } });
      if (reservaActiva) await tx.senia.update({ where: { id_senia: reservaActiva.id_senia }, data: { estado: 'CANCELADA' } });
      if (cotizacionId) await tx.cotizacion.update({ where: { id_cotizacion: cotizacionId }, data: { estado: 'ACEPTADA', id_cliente: data.id_cliente } });
      if (prospectoId) await tx.prospecto.update({ where: { id_prospecto: prospectoId }, data: { estado: 'GANADO', id_cliente: data.id_cliente, id_vehiculo_interes: data.id_vehiculo, proxima_accion: null } });
      await tx.entrega.create({ data: { tenantId: tenant.id, id_venta: venta.id_venta, estado: 'PENDIENTE', checklist: { documentacion: false, unidad_revisada: false, llaves: false, combustible: false, cliente_notificado: false } } });

      return { id_venta: venta.id_venta, numeroBoleto, prospectoId };
    });

    revalidatePath('/vehiculos'); revalidatePath('/motos'); revalidatePath(`/vehiculos/${data.id_vehiculo}`); revalidatePath('/ventas'); revalidatePath('/ventas/nueva'); revalidatePath('/cuotas'); revalidatePath('/caja'); revalidatePath('/prospectos'); revalidatePath('/pwa/dashboard'); revalidatePath('/pwa/cotizador');
    if (result.prospectoId) revalidatePath(`/prospectos/${result.prospectoId}`);
    return { success: true, id_venta: result.id_venta, numero_boleto: result.numeroBoleto };
  } catch (error: any) {
    console.error('Error registrando venta:', error);
    return { success: false, error: error?.message || 'Ocurrió un error al registrar la venta.' };
  }
}
