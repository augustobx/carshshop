import { prisma as db } from "@/lib/prisma";
import VehiculosClient from "./VehiculosClient";

// Función bimonetaria de prioridad ARS
function normalizePair(usd: number, ars: number, dolar: number) {
    let finalUsd = Number(usd) || 0;
    let finalArs = Number(ars) || 0;
    if (finalArs > 0 && dolar > 0) {
        finalUsd = finalArs / dolar;
    } else if (finalUsd > 0 && dolar > 0) {
        finalArs = finalUsd * dolar;
    }
    return { usd: finalUsd, ars: finalArs };
}

export const dynamic = "force-dynamic";

export default async function VehiculosPage({ searchParams }: { searchParams: Promise<any> }) {
    const params = await searchParams;
    const tab = params.tab || 'en_preparacion';

    // 1. Dólar Blue
    const cfg = await db.configuracion.findUnique({ where: { clave: 'dolar_blue' } });
    const dolarBlue = cfg ? parseFloat(cfg.valor) : 1000;

    // 2. Construir Filtros (Where)
    const where: any = {};

    if (params.marca) where.marca = { contains: params.marca };
    if (params.modelo) where.modelo = { contains: params.modelo };
    if (params.anio) where.anio = parseInt(params.anio);

    // Filtros por pestaña (Tabs)
    switch (tab) {
        case 'en_preparacion': where.estado = 'EN_PREPARACION'; break;
        case 'listos': where.estado = 'LISTO_PARA_VENTA'; break;
        case 'consignacion': where.tipo_ingreso = 'Consignacion'; break;
        case 'senados':
            where.OR = [{ estado: 'SENADO' }]; // Si tienes tabla señas, se suma aquí
            break;
        case 'vendidos': where.estado = 'VENDIDO'; break;
    }

    // 3. Consultar a Base de Datos
    const vehiculosDb = await db.vehiculo.findMany({
        where,
        orderBy: { fecha_ingreso: 'desc' }, // Orden por defecto: Nuevos primero
        include: { _count: { select: { tareas: { where: { estado_tarea: 'PENDIENTE' } } } } }
    });

    // 4. Normalizar la data para enviarla al cliente
    const vehiculos = vehiculosDb.map(v => {
        const compra = normalizePair(Number(v.precio_compra_usd), Number(v.precio_compra_ars), dolarBlue);
        const venta = normalizePair(Number(v.precio_venta_usd), Number(v.precio_venta_ars), dolarBlue);

        return {
            id_vehiculo: v.id_vehiculo,
            marca: v.marca || '',
            modelo: v.modelo || '',
            anio: v.anio || 0,
            km: v.km || 0,
            patente: v.patente || '-',
            estado: v.estado,
            tipo_ingreso: v.tipo_ingreso,
            tareas_pendientes: v._count.tareas,
            compra_usd: compra.usd,
            compra_ars: compra.ars,
            venta_usd: venta.usd,
            venta_ars: venta.ars,
        };
    });

    return <VehiculosClient vehiculos={vehiculos} currentTab={tab} currentDolar={dolarBlue} />;
}