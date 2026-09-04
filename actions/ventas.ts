'use server';

import { prisma as db } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant-context';
import { getLoggedUser } from '@/lib/user-auth';
import { revalidatePath } from 'next/cache';

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
  cuotas?: { numero_cuota: number; monto_usd: number; fecha_vencimiento: string }[];
  permuta?: {
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
    const user = await getLoggedUser();

    const result = await db.$transaction(async (tx) => {
      const vehiculoVenta = await tx.vehiculo.findFirst({
        where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id },
      });
      const clienteVenta = await tx.cliente.findFirst({
        where: { id_cliente: data.id_cliente, tenantId: tenant.id },
      });

      if (!vehiculoVenta || !clienteVenta) {
        throw new Error('Vehículo o cliente inválido para este tenant.');
      }

      let prospectoId = data.prospectoId || null;
      if (!prospectoId) {
        const prospecto = await tx.prospecto.findFirst({
          where: {
            tenantId: tenant.id,
            id_cliente: data.id_cliente,
            id_vehiculo_interes: data.id_vehiculo,
            estado: { notIn: ['PERDIDO', 'GANADO'] },
          },
          orderBy: { updatedAt: 'desc' },
        });
        prospectoId = prospecto?.id_prospecto || null;
      }

      let cotizacionId = data.cotizacionId || null;
      if (!cotizacionId && prospectoId) {
        const cotizacion = await tx.cotizacion.findFirst({
          where: {
            tenantId: tenant.id,
            prospectoId,
            id_vehiculo: data.id_vehiculo,
            estado: { in: ['ENVIADA', 'ACEPTADA'] },
          },
          orderBy: { createdAt: 'desc' },
        });
        cotizacionId = cotizacion?.id_cotizacion || null;
      }

      const ventasCount = await tx.venta.count({ where: { tenantId: tenant.id } });
      const currentYear = new Date().getFullYear();
      const numeroBoleto = `BOL-${currentYear}-${String(ventasCount + 1).padStart(5, '0')}`;

      let idVehiculoPermuta: number | null = null;
      let valorTomaPermuta = 0;

      if (data.permuta && data.permuta.valor_toma_usd > 0) {
        valorTomaPermuta = data.permuta.valor_toma_usd;
        const autoPermutado = await tx.vehiculo.create({
          data: {
            tenantId: tenant.id,
            locationId: tenant.primaryLocationId || null,
            tipo_vehiculo: 'Auto',
            marca: data.permuta.marca,
            modelo: data.permuta.modelo,
            version: data.permuta.version || null,
            anio: data.permuta.anio,
            km: data.permuta.km,
            patente: data.permuta.patente ? data.permuta.patente.toUpperCase().trim() : null,
            color: data.permuta.color || null,
            motor: data.permuta.motor || null,
            tipo_ingreso: 'Permuta',
            estado: 'EN_PREPARACION',
            precio_compra_usd: valorTomaPermuta,
            precio_compra_ars: valorTomaPermuta * data.cotizacion_dolar,
            costo_total_real_usd: valorTomaPermuta,
            id_cliente: data.id_cliente,
            notas_internas: `Ingresado como permuta en boleto ${numeroBoleto}`,
          },
        });
        idVehiculoPermuta = autoPermutado.id_vehiculo;
      }

      const venta = await tx.venta.create({
        data: {
          tenantId: tenant.id,
          locationId: tenant.primaryLocationId || null,
          id_vehiculo: data.id_vehiculo,
          id_cliente: data.id_cliente,
          vendedorId: user?.id || null,
          prospectoId,
          cotizacionId,
          precio_final_usd: data.precio_final_usd,
          cotizacion_dolar_venta: data.cotizacion_dolar,
          forma_pago: data.forma_pago,
          anticipo_usd: data.anticipo_usd || 0,
          saldo_financiado_usd: data.saldo_financiado_usd || 0,
          comision_vendedor_usd: data.comision_vendedor_usd || 0,
          id_vehiculo_permuta: idVehiculoPermuta,
          valor_toma_permuta_usd: valorTomaPermuta,
          numero_boleto: numeroBoleto,
          observaciones: data.observaciones || null,
        },
      });

      if (idVehiculoPermuta) {
        await tx.vehiculo.update({
          where: { id_vehiculo: idVehiculoPermuta },
          data: { permuta_de_venta_id: venta.id_venta },
        });
      }

      if (data.forma_pago === 'Cuotas' && data.cuotas?.length) {
        await tx.ventaCuota.createMany({
          data: data.cuotas.map((c) => ({
            tenantId: tenant.id,
            id_venta: venta.id_venta,
            numero_cuota: c.numero_cuota,
            monto_usd: c.monto_usd,
            fecha_vencimiento: new Date(c.fecha_vencimiento),
            estado: 'PENDIENTE',
          })),
        });
      }

      await tx.vehiculo.update({
        where: { id_vehiculo: data.id_vehiculo },
        data: { estado: 'VENDIDO' },
      });

      await tx.senia.updateMany({
        where: { id_vehiculo: data.id_vehiculo, tenantId: tenant.id, estado: 'ACTIVA' },
        data: { estado: 'CANCELADA' },
      });

      if (cotizacionId) {
        await tx.cotizacion.update({
          where: { id_cotizacion: cotizacionId },
          data: { estado: 'ACEPTADA', id_cliente: data.id_cliente },
        });
      }

      if (prospectoId) {
        await tx.prospecto.update({
          where: { id_prospecto: prospectoId },
          data: {
            estado: 'GANADO',
            id_cliente: data.id_cliente,
            id_vehiculo_interes: data.id_vehiculo,
            proxima_accion: null,
          },
        });
      }

      await tx.entrega.create({
        data: {
          tenantId: tenant.id,
          id_venta: venta.id_venta,
          estado: 'PENDIENTE',
          checklist: {
            documentacion: false,
            unidad_revisada: false,
            llaves: false,
            combustible: false,
            cliente_notificado: false,
          },
        },
      });

      return { venta, numeroBoleto, prospectoId };
    });

    revalidatePath('/vehiculos');
    revalidatePath(`/vehiculos/${data.id_vehiculo}`);
    revalidatePath('/ventas');
    revalidatePath('/cuotas');
    revalidatePath('/prospectos');
    if (result.prospectoId) revalidatePath(`/prospectos/${result.prospectoId}`);

    return {
      success: true,
      id_venta: result.venta.id_venta,
      numero_boleto: result.numeroBoleto,
    };
  } catch (error) {
    console.error('Error registrando venta:', error);
    return { success: false, error: 'Ocurrió un error al registrar la venta.' };
  }
}
