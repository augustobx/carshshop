import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";
import CotizadorClient from "./CotizadorClient";

export const dynamic = "force-dynamic";

export default async function NuevaVentaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams;
    const tenant = await getTenantContext();
    const dolarActual = Number(tenant.settings?.dolarActual || 1400);
    const tnaFinanciacion = Number(tenant.settings?.tnaFinanciacion || 48);
    const quoteId = Number(typeof params.q === 'string' ? params.q : 0);
    const prospectoId = Number(typeof params.p === 'string' ? params.p : 0);

    const [vehiculosDb, clientesDb, quoteDb, reservasDb] = await Promise.all([
        db.vehiculo.findMany({
            where: {
                tenantId: tenant.id,
                estado: { in: ['EN_PREPARACION', 'LISTO_PARA_VENTA', 'EN_CONSIGNACION', 'SENADO'] }
            },
            orderBy: [{ marca: 'asc' }, { modelo: 'asc' }]
        }),
        db.cliente.findMany({
            where: { tenantId: tenant.id },
            orderBy: { nombre_completo: 'asc' }
        }),
        quoteId > 0
            ? db.cotizacion.findFirst({ where: { id_cotizacion: quoteId, tenantId: tenant.id } })
            : Promise.resolve(null),
        db.senia.findMany({
            where: { tenantId: tenant.id, estado: 'ACTIVA' },
            select: {
                id_senia: true,
                id_vehiculo: true,
                id_cliente: true,
                prospectoId: true,
                cotizacionId: true,
                monto_ars: true,
                monto_usd: true,
                cotizacion: true,
                recibo_nro: true,
                fecha_senia: true,
                cliente: { select: { nombre_completo: true } },
            },
            orderBy: { fecha_senia: 'desc' },
        }),
    ]);

    const vehiculos = vehiculosDb.map(v => {
        const ventaUsd = Number(v.precio_venta_usd) || 0;
        const compraUsd = Number(v.precio_compra_usd) || 0;
        return {
            id_vehiculo: v.id_vehiculo,
            nombre: `${v.marca || ''} ${v.modelo || ''}${v.version ? ` ${v.version}` : ''}`.trim(),
            marca: v.marca || '',
            modelo: v.modelo || '',
            version: v.version || '',
            anio: v.anio || 0,
            patente: v.patente || 'S/P',
            estado: v.estado,
            precio_venta_ars: ventaUsd > 0 ? ventaUsd * dolarActual : Number(v.precio_venta_ars) || 0,
            precio_venta_usd: ventaUsd,
            precio_costo_ars: compraUsd > 0 ? compraUsd * dolarActual : Number(v.precio_compra_ars) || 0,
            precio_costo_usd: compraUsd,
        };
    });

    const clientes = clientesDb.map(c => ({
        id_cliente: c.id_cliente,
        nombre_completo: c.nombre_completo,
        dni: c.dni,
        cuit_cuil: c.cuit_cuil,
        telefono: c.telefono,
        email: c.email,
    }));

    const initialQuote = quoteDb ? {
        id_cotizacion: quoteDb.id_cotizacion,
        prospectoId: quoteDb.prospectoId,
        id_cliente: quoteDb.id_cliente,
        id_vehiculo: quoteDb.id_vehiculo,
        precio_final_usd: Number(quoteDb.precio_final_usd),
        cotizacion_dolar: Number(quoteDb.cotizacion_dolar),
        forma_pago: quoteDb.forma_pago,
        anticipo_usd: Number(quoteDb.anticipo_usd || 0),
        saldo_financiado_usd: Number(quoteDb.saldo_financiado_usd || 0),
        cantidad_cuotas: quoteDb.cantidad_cuotas,
        valor_cuota_usd: Number(quoteDb.valor_cuota_usd || 0),
        tiene_permuta: quoteDb.tiene_permuta,
        valor_permuta_usd: Number(quoteDb.valor_permuta_usd || 0),
        observaciones: quoteDb.observaciones,
    } : null;

    const reservasActivas = reservasDb.map(s => ({
        id_senia: s.id_senia,
        id_vehiculo: s.id_vehiculo,
        id_cliente: s.id_cliente,
        prospectoId: s.prospectoId,
        cotizacionId: s.cotizacionId,
        monto_ars: Number(s.monto_ars || 0),
        monto_usd: Number(s.monto_usd || 0),
        cotizacion: Number(s.cotizacion || dolarActual),
        recibo_nro: s.recibo_nro,
        fecha_senia: s.fecha_senia.toISOString(),
        cliente_nombre: s.cliente.nombre_completo,
    }));

    return (
        <CotizadorClient
            vehiculos={vehiculos}
            clientes={clientes}
            dolarActual={dolarActual}
            tnaFinanciacion={tnaFinanciacion}
            reservasActivas={reservasActivas}
            initialProspectoId={prospectoId || initialQuote?.prospectoId || null}
            initialQuote={initialQuote}
        />
    );
}
