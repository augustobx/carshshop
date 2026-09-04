import { prisma as db } from "@/lib/prisma";
import VehiculosClient from "../vehiculos/VehiculosClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getTenantContext } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function MotosPage({ searchParams }: { searchParams: Promise<any> }) {
    const params = await searchParams;
    const tab = params.tab || 'en_preparacion';
    const tenant = await getTenantContext();
    const dolarBlue = Number(tenant.settings?.dolarActual || 1400);
    const where: any = { tenantId: tenant.id, tipo_vehiculo: 'Moto' };

    if (params.q) where.OR = [{ marca: { contains: params.q } }, { modelo: { contains: params.q } }, { patente: { contains: params.q } }, { cilindrada: { contains: params.q } }];
    switch (tab) {
        case 'en_preparacion': where.estado = 'EN_PREPARACION'; break;
        case 'listos': where.estado = 'LISTO_PARA_VENTA'; break;
        case 'consignacion': where.tipo_ingreso = 'Consignacion'; break;
        case 'reservados': case 'senados': where.senias = { some: { estado: 'ACTIVA' } }; break;
        case 'vendidos': where.estado = 'VENDIDO'; break;
    }

    const vehiculosDb = await db.vehiculo.findMany({
        where,
        orderBy: { id_vehiculo: 'desc' },
        include: {
            fotos: { orderBy: [{ orden: 'asc' }, { id_foto: 'asc' }], take: 1 },
            _count: { select: { tareas: { where: { estado_tarea: 'PENDIENTE' } } } },
            senias: { where: { estado: 'ACTIVA' }, select: { id_senia: true, cliente: { select: { nombre_completo: true } } }, take: 1 },
        }
    });

    const vehiculos = vehiculosDb.map(v => {
        const compraUsd = Number(v.precio_compra_usd) || 0;
        const ventaUsd = Number(v.precio_venta_usd) || 0;
        return {
            id_vehiculo: v.id_vehiculo, marca: v.marca || '', modelo: v.modelo || '', anio: v.anio || 0, km: v.km || 0, patente: v.patente || '-',
            foto: v.fotos[0]?.url_foto || null,
            estado: v.estado === 'SENADO' ? (v.tipo_ingreso === 'Consignacion' ? 'EN_CONSIGNACION' : (v._count.tareas > 0 ? 'EN_PREPARACION' : 'LISTO_PARA_VENTA')) : v.estado,
            estado_legacy: v.estado, reservado: v.senias.length > 0, reserva_cliente: v.senias[0]?.cliente?.nombre_completo || null,
            tipo_ingreso: v.tipo_ingreso, tareas_pendientes: v._count.tareas,
            compra_usd: compraUsd, compra_ars: compraUsd > 0 ? compraUsd * dolarBlue : Number(v.precio_compra_ars) || 0,
            venta_usd: ventaUsd, venta_ars: ventaUsd > 0 ? ventaUsd * dolarBlue : Number(v.precio_venta_ars) || 0,
            tipo_vehiculo: v.tipo_vehiculo, cilindrada: v.cilindrada || '',
        };
    });

    return <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}><VehiculosClient vehiculos={vehiculos} currentTab={tab === 'senados' ? 'reservados' : tab} currentDolar={dolarBlue} isMotos /></Suspense>;
}
