'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { getLoggedUser } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';

function revalidateOperacion(idProspecto: number, idVehiculo?: number) {
  revalidatePath('/prospectos');
  revalidatePath(`/prospectos/${idProspecto}`);
  if (idVehiculo) revalidatePath(`/vehiculos/${idVehiculo}`);
}

export async function crearCotizacionProspecto(data: {
  prospectoId: number;
  id_vehiculo: number;
  precio_final_usd: number;
  cotizacion_dolar: number;
  forma_pago: 'Contado' | 'Cuotas';
  anticipo_usd?: number;
  cantidad_cuotas?: number;
  valor_cuota_usd?: number;
  valor_permuta_usd?: number;
  observaciones?: string;
  validez_dias?: number;
}) {
  try {
    const tenant = await getTenantContext();
    const user = await getLoggedUser();

    if (!data.precio_final_usd || data.precio_final_usd <= 0) {
      return { success: false, error: 'El precio final debe ser mayor a cero.' };
    }

    const [prospecto, vehiculo] = await Promise.all([
      db.prospecto.findFirst({ where: { id_prospecto: data.prospectoId, tenantId: tenant.id } }),
      db.vehiculo.findFirst({ where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id } }),
    ]);

    if (!prospecto || !vehiculo) {
      return { success: false, error: 'Prospecto o vehículo inválido para este tenant.' };
    }

    const validezHasta = new Date();
    validezHasta.setDate(validezHasta.getDate() + Math.max(1, data.validez_dias || 7));

    const anticipo = Math.max(0, data.anticipo_usd || 0);
    const saldo = Math.max(0, data.precio_final_usd - anticipo - Math.max(0, data.valor_permuta_usd || 0));

    const cotizacion = await db.$transaction(async (tx) => {
      const creada = await tx.cotizacion.create({
        data: {
          tenantId: tenant.id,
          prospectoId: prospecto.id_prospecto,
          id_cliente: prospecto.id_cliente,
          id_vehiculo: vehiculo.id_vehiculo,
          vendedorId: user?.id || prospecto.vendedorId || null,
          estado: 'ENVIADA',
          precio_final_usd: data.precio_final_usd,
          cotizacion_dolar: data.cotizacion_dolar,
          forma_pago: data.forma_pago,
          anticipo_usd: anticipo,
          saldo_financiado_usd: data.forma_pago === 'Cuotas' ? saldo : 0,
          cantidad_cuotas: data.forma_pago === 'Cuotas' ? data.cantidad_cuotas || null : null,
          valor_cuota_usd: data.forma_pago === 'Cuotas' ? data.valor_cuota_usd || null : null,
          tiene_permuta: prospecto.tiene_permuta,
          detalle_permuta: prospecto.detalle_permuta,
          valor_permuta_usd: Math.max(0, data.valor_permuta_usd || 0),
          validez_hasta: validezHasta,
          observaciones: data.observaciones || null,
        },
      });

      await tx.prospecto.update({
        where: { id_prospecto: prospecto.id_prospecto },
        data: {
          estado: 'COTIZADO',
          id_vehiculo_interes: vehiculo.id_vehiculo,
          proxima_accion: validezHasta,
        },
      });

      return creada;
    });

    revalidateOperacion(prospecto.id_prospecto, vehiculo.id_vehiculo);
    return { success: true, id_cotizacion: cotizacion.id_cotizacion };
  } catch (error) {
    console.error('Error creando cotización:', error);
    return { success: false, error: 'No se pudo crear la cotización.' };
  }
}

export async function asegurarClienteProspecto(prospectoId: number) {
  try {
    const tenant = await getTenantContext();

    const prospecto = await db.prospecto.findFirst({
      where: { id_prospecto: prospectoId, tenantId: tenant.id },
    });

    if (!prospecto) return { success: false, error: 'Prospecto inexistente.' };
    if (prospecto.id_cliente) return { success: true, id_cliente: prospecto.id_cliente };

    const cliente = await db.$transaction(async (tx) => {
      const creado = await tx.cliente.create({
        data: {
          tenantId: tenant.id,
          nombre_completo: prospecto.nombre,
          telefono: prospecto.telefono,
          email: prospecto.email,
          notas: `Creado automáticamente desde prospecto #${prospecto.id_prospecto}.`,
        },
      });

      await tx.prospecto.update({
        where: { id_prospecto: prospecto.id_prospecto },
        data: { id_cliente: creado.id_cliente },
      });

      return creado;
    });

    revalidateOperacion(prospecto.id_prospecto, prospecto.id_vehiculo_interes || undefined);
    return { success: true, id_cliente: cliente.id_cliente };
  } catch (error) {
    console.error('Error convirtiendo prospecto en cliente:', error);
    return { success: false, error: 'No se pudo vincular el cliente.' };
  }
}

export async function registrarReservaProspecto(data: {
  prospectoId: number;
  cotizacionId?: number;
  monto_usd: number;
  cotizacion_dolar: number;
  fecha_limite?: string;
}) {
  try {
    const tenant = await getTenantContext();

    const prospecto = await db.prospecto.findFirst({
      where: { id_prospecto: data.prospectoId, tenantId: tenant.id },
    });

    if (!prospecto || !prospecto.id_vehiculo_interes) {
      return { success: false, error: 'El prospecto debe tener un vehículo de interés.' };
    }

    let clienteId = prospecto.id_cliente;
    if (!clienteId) {
      const creado = await db.cliente.create({
        data: {
          tenantId: tenant.id,
          nombre_completo: prospecto.nombre,
          telefono: prospecto.telefono,
          email: prospecto.email,
          notas: `Creado automáticamente desde prospecto #${prospecto.id_prospecto}.`,
        },
      });
      clienteId = creado.id_cliente;
    }

    const cotizacion = data.cotizacionId
      ? await db.cotizacion.findFirst({
          where: { id_cotizacion: data.cotizacionId, tenantId: tenant.id, prospectoId: prospecto.id_prospecto },
        })
      : await db.cotizacion.findFirst({
          where: { tenantId: tenant.id, prospectoId: prospecto.id_prospecto },
          orderBy: { createdAt: 'desc' },
        });

    const reciboNro = `RES-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    await db.$transaction(async (tx) => {
      await tx.senia.create({
        data: {
          tenantId: tenant.id,
          locationId: tenant.primaryLocationId || null,
          id_vehiculo: prospecto.id_vehiculo_interes!,
          id_cliente: clienteId!,
          prospectoId: prospecto.id_prospecto,
          cotizacionId: cotizacion?.id_cotizacion || null,
          monto_usd: data.monto_usd,
          monto_ars: data.monto_usd * data.cotizacion_dolar,
          cotizacion: data.cotizacion_dolar,
          fecha_limite: data.fecha_limite ? new Date(data.fecha_limite) : null,
          estado: 'ACTIVA',
          recibo_nro: reciboNro,
        },
      });

      await tx.vehiculo.update({
        where: { id_vehiculo: prospecto.id_vehiculo_interes! },
        data: { estado: 'SENADO' },
      });

      await tx.prospecto.update({
        where: { id_prospecto: prospecto.id_prospecto },
        data: { estado: 'RESERVADO', id_cliente: clienteId },
      });

      if (cotizacion) {
        await tx.cotizacion.update({
          where: { id_cotizacion: cotizacion.id_cotizacion },
          data: { estado: 'ACEPTADA', id_cliente: clienteId },
        });
      }
    });

    revalidateOperacion(prospecto.id_prospecto, prospecto.id_vehiculo_interes);
    return { success: true, recibo_nro: reciboNro, id_cliente: clienteId };
  } catch (error) {
    console.error('Error registrando reserva comercial:', error);
    return { success: false, error: 'No se pudo registrar la reserva.' };
  }
}

export async function programarEntrega(data: {
  id_venta: number;
  fecha_programada: string;
  notas?: string;
}) {
  try {
    const tenant = await getTenantContext();

    const venta = await db.venta.findFirst({
      where: { id_venta: data.id_venta, tenantId: tenant.id },
      select: { id_venta: true, prospectoId: true, id_vehiculo: true },
    });

    if (!venta) return { success: false, error: 'Venta inexistente.' };

    await db.entrega.upsert({
      where: { id_venta: venta.id_venta },
      update: {
        estado: 'PROGRAMADA',
        fecha_programada: new Date(data.fecha_programada),
        notas: data.notas || undefined,
      },
      create: {
        tenantId: tenant.id,
        id_venta: venta.id_venta,
        estado: 'PROGRAMADA',
        fecha_programada: new Date(data.fecha_programada),
        notas: data.notas || null,
        checklist: {
          documentacion: false,
          unidad_revisada: false,
          llaves: false,
          combustible: false,
          cliente_notificado: false,
        },
      },
    });

    revalidatePath('/ventas');
    revalidatePath(`/ventas/${venta.id_venta}`);
    if (venta.prospectoId) revalidateOperacion(venta.prospectoId, venta.id_vehiculo);
    return { success: true };
  } catch (error) {
    console.error('Error programando entrega:', error);
    return { success: false, error: 'No se pudo programar la entrega.' };
  }
}

export async function completarEntrega(idVenta: number) {
  try {
    const tenant = await getTenantContext();
    const venta = await db.venta.findFirst({
      where: { id_venta: idVenta, tenantId: tenant.id },
      select: { id_venta: true, prospectoId: true, id_vehiculo: true },
    });

    if (!venta) return { success: false, error: 'Venta inexistente.' };

    await db.entrega.upsert({
      where: { id_venta: venta.id_venta },
      update: { estado: 'ENTREGADA', fecha_entrega: new Date() },
      create: {
        tenantId: tenant.id,
        id_venta: venta.id_venta,
        estado: 'ENTREGADA',
        fecha_entrega: new Date(),
      },
    });

    revalidatePath('/ventas');
    revalidatePath(`/ventas/${venta.id_venta}`);
    if (venta.prospectoId) revalidateOperacion(venta.prospectoId, venta.id_vehiculo);
    return { success: true };
  } catch (error) {
    console.error('Error completando entrega:', error);
    return { success: false, error: 'No se pudo completar la entrega.' };
  }
}
