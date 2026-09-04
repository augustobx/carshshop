'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { EstadoProspecto, RolMembresia } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const PWA_ROLES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR];
const FOLLOWUP_STATES = new Set<string>(['CONTACTADO', 'COTIZADO', 'NEGOCIACION', 'PERDIDO']);

function revalidatePwa(prospectoId?: number, vehiculoId?: number) {
  revalidatePath('/pwa/dashboard');
  revalidatePath('/pwa/cotizador');
  revalidatePath('/pwa/operaciones');
  if (prospectoId) {
    revalidatePath(`/pwa/operaciones/${prospectoId}`);
    revalidatePath(`/prospectos/${prospectoId}`);
  }
  if (vehiculoId) revalidatePath(`/pwa/vehiculo/${vehiculoId}`);
  revalidatePath('/prospectos');
}

export async function guardarNotaVehiculo(id_vehiculo: number, nota: string) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, PWA_ROLES);
    const updated = await db.vehiculo.updateMany({
      where: { id_vehiculo, tenantId: tenant.id },
      data: { notas_internas: String(nota || '').trim() || null },
    });
    if (!updated.count) return { success: false, error: 'Vehículo inexistente.' };
    revalidatePwa(undefined, id_vehiculo);
    revalidatePath('/vehiculos');
    return { success: true };
  } catch (error: any) {
    console.error('Error guardando nota PWA:', error);
    return { success: false, error: 'No se pudo guardar la nota.' };
  }
}

export async function guardarCotizacionPwa(data: {
  prospectoId?: number;
  id_cliente: number;
  id_vehiculo: number;
  precio_final_usd: number;
  cotizacion_dolar: number;
  forma_pago: 'Contado' | 'Cuotas';
  anticipo_usd?: number;
  cantidad_cuotas?: number;
  valor_cuota_usd?: number;
  tiene_permuta?: boolean;
  detalle_permuta?: string;
  valor_permuta_usd?: number;
  observaciones?: string;
  validez_dias?: number;
  proxima_accion?: string;
}) {
  try {
    const tenant = await getTenantContext();
    const { user, role } = await requireTenantRole(tenant.id, PWA_ROLES);
    const precio = Number(data.precio_final_usd);
    const rate = Number(data.cotizacion_dolar);
    const clienteId = Number(data.id_cliente);
    const vehiculoId = Number(data.id_vehiculo);
    const tienePermuta = Boolean(data.tiene_permuta);
    const valorPermuta = tienePermuta ? Math.max(0, Number(data.valor_permuta_usd || 0)) : 0;
    const detallePermuta = tienePermuta ? String(data.detalle_permuta || '').trim() || null : null;

    if (!Number.isFinite(precio) || precio <= 0 || !Number.isFinite(rate) || rate <= 0) {
      return { success: false, error: 'Precio y cotización del dólar deben ser mayores a cero.' };
    }
    if (!['Contado', 'Cuotas'].includes(data.forma_pago)) return { success: false, error: 'Forma de pago inválida.' };
    if (valorPermuta >= precio) return { success: false, error: 'El valor estimado de la permuta debe ser menor al precio del vehículo.' };
    if (tienePermuta && !detallePermuta) return { success: false, error: 'Describí brevemente el vehículo que se tomaría en permuta.' };

    const cuotas = data.forma_pago === 'Cuotas' ? Math.max(1, Number(data.cantidad_cuotas || 0)) : 0;
    const anticipo = data.forma_pago === 'Cuotas' ? Math.max(0, Number(data.anticipo_usd || 0)) : 0;
    if (data.forma_pago === 'Cuotas' && cuotas < 1) return { success: false, error: 'Indicá una cantidad de cuotas válida.' };
    if (data.forma_pago === 'Cuotas' && anticipo + valorPermuta >= precio) return { success: false, error: 'Anticipo + permuta deben ser menores al precio final para financiar saldo.' };

    const [cliente, vehiculo, reserva] = await Promise.all([
      db.cliente.findFirst({ where: { id_cliente: clienteId, tenantId: tenant.id } }),
      db.vehiculo.findFirst({ where: { id_vehiculo: vehiculoId, tenantId: tenant.id, estado: { not: 'VENDIDO' } } }),
      db.senia.findFirst({ where: { tenantId: tenant.id, id_vehiculo: vehiculoId, estado: 'ACTIVA' } }),
    ]);
    if (!cliente || !vehiculo) return { success: false, error: 'Cliente o vehículo inválido.' };
    if (reserva && reserva.id_cliente !== clienteId) return { success: false, error: 'La unidad tiene una reserva activa para otro cliente.' };

    const nextAction = data.proxima_accion ? new Date(data.proxima_accion) : null;
    if (nextAction && Number.isNaN(nextAction.getTime())) return { success: false, error: 'La fecha de seguimiento es inválida.' };
    const validezHasta = new Date();
    validezHasta.setDate(validezHasta.getDate() + Math.min(90, Math.max(1, Number(data.validez_dias || 7))));

    const result = await db.$transaction(async (tx) => {
      let prospecto = data.prospectoId
        ? await tx.prospecto.findFirst({ where: { id_prospecto: Number(data.prospectoId), tenantId: tenant.id } })
        : null;

      if (prospecto && role === RolMembresia.VENDEDOR && prospecto.vendedorId && prospecto.vendedorId !== user.id) {
        throw new Error('Esta oportunidad pertenece a otro vendedor.');
      }

      if (!prospecto) {
        prospecto = await tx.prospecto.findFirst({
          where: {
            tenantId: tenant.id,
            id_cliente: clienteId,
            id_vehiculo_interes: vehiculoId,
            vendedorId: user.id,
            estado: { notIn: ['GANADO', 'PERDIDO'] },
          },
          orderBy: { updatedAt: 'desc' },
        });
      }

      const targetState = reserva ? EstadoProspecto.RESERVADO : EstadoProspecto.COTIZADO;
      const prospectData = {
        id_cliente: clienteId,
        id_vehiculo_interes: vehiculoId,
        estado: targetState,
        presupuesto_estimado_usd: precio,
        tiene_permuta: tienePermuta,
        detalle_permuta: detallePermuta,
        notas: data.observaciones?.trim() || null,
        proxima_accion: nextAction || validezHasta,
      };

      if (!prospecto) {
        prospecto = await tx.prospecto.create({
          data: {
            tenantId: tenant.id,
            nombre: cliente.nombre_completo,
            telefono: cliente.telefono,
            email: cliente.email,
            vendedorId: user.id,
            origen: 'PWA_VENDEDOR',
            ...prospectData,
          },
        });
      } else {
        prospecto = await tx.prospecto.update({
          where: { id_prospecto: prospecto.id_prospecto },
          data: { ...prospectData, vendedorId: prospecto.vendedorId || user.id },
        });
      }

      await tx.cotizacion.updateMany({
        where: { tenantId: tenant.id, prospectoId: prospecto.id_prospecto, estado: 'ENVIADA' },
        data: { estado: 'VENCIDA' },
      });

      const saldo = data.forma_pago === 'Cuotas' ? Math.max(0, precio - anticipo - valorPermuta) : 0;
      const quote = await tx.cotizacion.create({
        data: {
          tenantId: tenant.id,
          prospectoId: prospecto.id_prospecto,
          id_cliente: clienteId,
          id_vehiculo: vehiculoId,
          vendedorId: user.id,
          estado: 'ENVIADA',
          precio_final_usd: precio,
          cotizacion_dolar: rate,
          forma_pago: data.forma_pago,
          anticipo_usd: anticipo,
          saldo_financiado_usd: saldo,
          cantidad_cuotas: data.forma_pago === 'Cuotas' ? cuotas : null,
          valor_cuota_usd: data.forma_pago === 'Cuotas' ? Math.max(0, Number(data.valor_cuota_usd || 0)) || null : null,
          tiene_permuta: tienePermuta,
          detalle_permuta: detallePermuta,
          valor_permuta_usd: valorPermuta,
          validez_hasta: validezHasta,
          observaciones: data.observaciones?.trim() || null,
        },
      });

      return { prospectoId: prospecto.id_prospecto, cotizacionId: quote.id_cotizacion };
    });

    revalidatePwa(result.prospectoId, vehiculoId);
    return { success: true, id_prospecto: result.prospectoId, id_cotizacion: result.cotizacionId };
  } catch (error: any) {
    console.error('Error guardando cotización PWA:', error);
    return { success: false, error: error?.message || 'No se pudo guardar la cotización.' };
  }
}

export async function actualizarSeguimientoPwa(data: {
  prospectoId: number;
  proxima_accion?: string;
  notas?: string;
  estado?: string;
}) {
  try {
    const tenant = await getTenantContext();
    const { user, role } = await requireTenantRole(tenant.id, PWA_ROLES);
    const prospecto = await db.prospecto.findFirst({ where: { id_prospecto: Number(data.prospectoId), tenantId: tenant.id } });
    if (!prospecto) return { success: false, error: 'Oportunidad inexistente.' };
    if (role === RolMembresia.VENDEDOR && prospecto.vendedorId && prospecto.vendedorId !== user.id) return { success: false, error: 'Esta oportunidad pertenece a otro vendedor.' };

    const nextAction = data.proxima_accion ? new Date(data.proxima_accion) : null;
    if (nextAction && Number.isNaN(nextAction.getTime())) return { success: false, error: 'Fecha de seguimiento inválida.' };

    const estadoRaw = data.estado ? String(data.estado).toUpperCase() : undefined;
    if (estadoRaw && !FOLLOWUP_STATES.has(estadoRaw)) return { success: false, error: 'Estado no permitido desde la PWA.' };
    if (estadoRaw === 'PERDIDO') {
      const reserva = await db.senia.findFirst({ where: { tenantId: tenant.id, prospectoId: prospecto.id_prospecto, estado: 'ACTIVA' } });
      if (reserva) return { success: false, error: 'Cancelá primero la reserva activa antes de marcar la oportunidad como perdida.' };
    }

    await db.prospecto.update({
      where: { id_prospecto: prospecto.id_prospecto },
      data: {
        estado: estadoRaw ? estadoRaw as EstadoProspecto : undefined,
        proxima_accion: data.proxima_accion !== undefined ? nextAction : undefined,
        notas: data.notas !== undefined ? data.notas.trim() || null : undefined,
      },
    });

    revalidatePwa(prospecto.id_prospecto, prospecto.id_vehiculo_interes || undefined);
    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando seguimiento PWA:', error);
    return { success: false, error: 'No se pudo actualizar el seguimiento.' };
  }
}
