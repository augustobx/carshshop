'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { requireTenantRole } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';
import { RolMembresia } from '@prisma/client';

const SALES = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR];
const DELIVERY = [RolMembresia.OWNER, RolMembresia.MANAGER, RolMembresia.VENDEDOR, RolMembresia.ADMINISTRATIVO];

function revalidateOperacion(idProspecto: number, idVehiculo?: number) {
  revalidatePath('/prospectos'); revalidatePath(`/prospectos/${idProspecto}`);
  if (idVehiculo) revalidatePath(`/vehiculos/${idVehiculo}`);
}

export async function crearCotizacionProspecto(data: {
  prospectoId: number; id_vehiculo: number; precio_final_usd: number; cotizacion_dolar: number;
  forma_pago: 'Contado' | 'Cuotas'; anticipo_usd?: number; cantidad_cuotas?: number;
  valor_cuota_usd?: number; valor_permuta_usd?: number; observaciones?: string; validez_dias?: number;
}) {
  try {
    const tenant = await getTenantContext();
    const { user } = await requireTenantRole(tenant.id, SALES);
    const precio = Number(data.precio_final_usd); const rate = Number(data.cotizacion_dolar);
    if (!Number.isFinite(precio) || precio <= 0 || !Number.isFinite(rate) || rate <= 0) return { success: false, error: 'Precio y cotización deben ser mayores a cero.' };

    const [prospecto, vehiculo] = await Promise.all([
      db.prospecto.findFirst({ where: { id_prospecto: data.prospectoId, tenantId: tenant.id } }),
      db.vehiculo.findFirst({ where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id, estado: { not: 'VENDIDO' } } }),
    ]);
    if (!prospecto || !vehiculo) return { success: false, error: 'Prospecto o vehículo inválido para esta concesionaria.' };
    if (prospecto.estado === 'GANADO' || prospecto.estado === 'PERDIDO') return { success: false, error: 'La oportunidad ya está cerrada.' };

    const validezHasta = new Date(); validezHasta.setDate(validezHasta.getDate() + Math.min(90, Math.max(1, Number(data.validez_dias || 7))));
    const anticipo = Math.max(0, Number(data.anticipo_usd || 0));
    const permuta = Math.max(0, Number(data.valor_permuta_usd || 0));
    const saldo = Math.max(0, precio - anticipo - permuta);
    if (data.forma_pago === 'Cuotas' && (!Number(data.cantidad_cuotas) || Number(data.cantidad_cuotas) < 1)) return { success: false, error: 'Indicá una cantidad de cuotas válida.' };

    const cotizacion = await db.$transaction(async (tx) => {
      await tx.cotizacion.updateMany({ where: { tenantId: tenant.id, prospectoId: prospecto.id_prospecto, estado: 'ENVIADA' }, data: { estado: 'VENCIDA' } });
      const creada = await tx.cotizacion.create({
        data: {
          tenantId: tenant.id, prospectoId: prospecto.id_prospecto, id_cliente: prospecto.id_cliente,
          id_vehiculo: vehiculo.id_vehiculo, vendedorId: user.id, estado: 'ENVIADA', precio_final_usd: precio,
          cotizacion_dolar: rate, forma_pago: data.forma_pago, anticipo_usd: anticipo,
          saldo_financiado_usd: data.forma_pago === 'Cuotas' ? saldo : 0,
          cantidad_cuotas: data.forma_pago === 'Cuotas' ? Number(data.cantidad_cuotas) : null,
          valor_cuota_usd: data.forma_pago === 'Cuotas' ? Math.max(0, Number(data.valor_cuota_usd || 0)) || null : null,
          tiene_permuta: prospecto.tiene_permuta, detalle_permuta: prospecto.detalle_permuta,
          valor_permuta_usd: permuta, validez_hasta: validezHasta, observaciones: data.observaciones?.trim() || null,
        },
      });
      await tx.prospecto.update({ where: { id_prospecto: prospecto.id_prospecto }, data: { estado: 'COTIZADO', id_vehiculo_interes: vehiculo.id_vehiculo, proxima_accion: validezHasta } });
      return creada;
    });

    revalidateOperacion(prospecto.id_prospecto, vehiculo.id_vehiculo);
    return { success: true, id_cotizacion: cotizacion.id_cotizacion };
  } catch (error) { console.error('Error creando cotización:', error); return { success: false, error: 'No se pudo crear la cotización.' }; }
}

export async function asegurarClienteProspecto(prospectoId: number) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, SALES);
    const prospecto = await db.prospecto.findFirst({ where: { id_prospecto: prospectoId, tenantId: tenant.id } });
    if (!prospecto) return { success: false, error: 'Prospecto inexistente.' };
    if (prospecto.id_cliente) return { success: true, id_cliente: prospecto.id_cliente };

    const cliente = await db.$transaction(async (tx) => {
      const creado = await tx.cliente.create({ data: { tenantId: tenant.id, nombre_completo: prospecto.nombre, telefono: prospecto.telefono, email: prospecto.email, notas: `Creado desde prospecto #${prospecto.id_prospecto}.` } });
      await tx.prospecto.update({ where: { id_prospecto: prospecto.id_prospecto }, data: { id_cliente: creado.id_cliente } });
      return creado;
    });
    revalidateOperacion(prospecto.id_prospecto, prospecto.id_vehiculo_interes || undefined);
    return { success: true, id_cliente: cliente.id_cliente };
  } catch (error) { console.error('Error convirtiendo prospecto en cliente:', error); return { success: false, error: 'No se pudo vincular el cliente.' }; }
}

export async function registrarReservaProspecto(data: { prospectoId: number; cotizacionId?: number; monto_usd: number; cotizacion_dolar: number; fecha_limite?: string }) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, SALES);
    const monto = Number(data.monto_usd); const rate = Number(data.cotizacion_dolar);
    if (!Number.isFinite(monto) || monto <= 0 || !Number.isFinite(rate) || rate <= 0) return { success: false, error: 'Monto y cotización deben ser mayores a cero.' };

    const prospecto = await db.prospecto.findFirst({ where: { id_prospecto: data.prospectoId, tenantId: tenant.id } });
    if (!prospecto?.id_vehiculo_interes) return { success: false, error: 'El prospecto debe tener un vehículo de interés.' };
    const existingReservation = await db.senia.findFirst({ where: { tenantId: tenant.id, id_vehiculo: prospecto.id_vehiculo_interes, estado: 'ACTIVA' } });
    if (existingReservation) return { success: false, error: 'La unidad ya tiene una reserva activa.' };

    const vehicle = await db.vehiculo.findFirst({ where: { id_vehiculo: prospecto.id_vehiculo_interes, tenantId: tenant.id, estado: { not: 'VENDIDO' } } });
    if (!vehicle) return { success: false, error: 'La unidad ya no está disponible.' };

    const cotizacion = data.cotizacionId
      ? await db.cotizacion.findFirst({ where: { id_cotizacion: data.cotizacionId, tenantId: tenant.id, prospectoId: prospecto.id_prospecto, id_vehiculo: prospecto.id_vehiculo_interes } })
      : await db.cotizacion.findFirst({ where: { tenantId: tenant.id, prospectoId: prospecto.id_prospecto, id_vehiculo: prospecto.id_vehiculo_interes }, orderBy: { createdAt: 'desc' } });
    if (data.cotizacionId && !cotizacion) return { success: false, error: 'La cotización seleccionada no corresponde a esta operación.' };

    const limit = data.fecha_limite ? new Date(data.fecha_limite) : null;
    if (limit && Number.isNaN(limit.getTime())) return { success: false, error: 'Fecha límite inválida.' };

    const result = await db.$transaction(async (tx) => {
      let clienteId = prospecto.id_cliente;
      if (!clienteId) {
        const creado = await tx.cliente.create({ data: { tenantId: tenant.id, nombre_completo: prospecto.nombre, telefono: prospecto.telefono, email: prospecto.email, notas: `Creado desde prospecto #${prospecto.id_prospecto}.` } });
        clienteId = creado.id_cliente;
      }
      const senia = await tx.senia.create({ data: { tenantId: tenant.id, locationId: vehicle.locationId || tenant.primaryLocationId || null, id_vehiculo: vehicle.id_vehiculo, id_cliente: clienteId, prospectoId: prospecto.id_prospecto, cotizacionId: cotizacion?.id_cotizacion || null, monto_usd: monto, monto_ars: monto * rate, cotizacion: rate, fecha_limite: limit, estado: 'ACTIVA' } });
      const reciboNro = `RES-${new Date().getFullYear()}-${String(senia.id_senia).padStart(6, '0')}`;
      await tx.senia.update({ where: { id_senia: senia.id_senia }, data: { recibo_nro: reciboNro } });

      // Reserva comercial independiente del estado operativo de la unidad.
      await tx.prospecto.update({ where: { id_prospecto: prospecto.id_prospecto }, data: { estado: 'RESERVADO', id_cliente: clienteId } });
      if (cotizacion) await tx.cotizacion.update({ where: { id_cotizacion: cotizacion.id_cotizacion }, data: { estado: 'ACEPTADA', id_cliente: clienteId } });
      return { reciboNro, clienteId };
    });

    revalidateOperacion(prospecto.id_prospecto, vehicle.id_vehiculo);
    revalidatePath('/vehiculos'); revalidatePath('/motos'); revalidatePath('/ventas/nueva');
    return { success: true, recibo_nro: result.reciboNro, id_cliente: result.clienteId };
  } catch (error) { console.error('Error registrando reserva:', error); return { success: false, error: 'No se pudo registrar la reserva.' }; }
}

export async function programarEntrega(data: { id_venta: number; fecha_programada: string; notas?: string }) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, DELIVERY);
    const date = new Date(data.fecha_programada);
    if (Number.isNaN(date.getTime())) return { success: false, error: 'Fecha de entrega inválida.' };
    const venta = await db.venta.findFirst({ where: { id_venta: data.id_venta, tenantId: tenant.id }, select: { id_venta: true, prospectoId: true, id_vehiculo: true } });
    if (!venta) return { success: false, error: 'Venta inexistente.' };
    await db.entrega.upsert({ where: { id_venta: venta.id_venta }, update: { estado: 'PROGRAMADA', fecha_programada: date, notas: data.notas?.trim() || null }, create: { tenantId: tenant.id, id_venta: venta.id_venta, estado: 'PROGRAMADA', fecha_programada: date, notas: data.notas?.trim() || null, checklist: { documentacion: false, unidad_revisada: false, llaves: false, combustible: false, cliente_notificado: false } } });
    revalidatePath('/ventas'); revalidatePath(`/ventas/${venta.id_venta}`); if (venta.prospectoId) revalidateOperacion(venta.prospectoId, venta.id_vehiculo);
    return { success: true };
  } catch (error) { console.error('Error programando entrega:', error); return { success: false, error: 'No se pudo programar la entrega.' }; }
}

export async function completarEntrega(idVenta: number) {
  try {
    const tenant = await getTenantContext();
    await requireTenantRole(tenant.id, DELIVERY);
    const venta = await db.venta.findFirst({ where: { id_venta: idVenta, tenantId: tenant.id }, select: { id_venta: true, prospectoId: true, id_vehiculo: true } });
    if (!venta) return { success: false, error: 'Venta inexistente.' };
    await db.entrega.upsert({ where: { id_venta: venta.id_venta }, update: { estado: 'ENTREGADA', fecha_entrega: new Date() }, create: { tenantId: tenant.id, id_venta: venta.id_venta, estado: 'ENTREGADA', fecha_entrega: new Date() } });
    revalidatePath('/ventas'); revalidatePath(`/ventas/${venta.id_venta}`); if (venta.prospectoId) revalidateOperacion(venta.prospectoId, venta.id_vehiculo);
    return { success: true };
  } catch (error) { console.error('Error completando entrega:', error); return { success: false, error: 'No se pudo completar la entrega.' }; }
}
