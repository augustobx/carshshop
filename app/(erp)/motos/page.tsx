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
    const dolarBlue = tenant.settings?.dolarActual || 1400;

    const where: any = {
        tenantId: tenant.id,
        tipo_vehiculo: 'Moto'
    };

    // Lógica del buscador global
    if (params.q) {
        where.OR = [
            { marca: { contains: params.q } },
            { modelo: { contains: params.q } },
            { patente: { contains: params.q } }
        ];
    } else {
        // Filtros por columna (opcional)
        if (params.marca) where.marca = { contains: params.marca };
        if (params.modelo) where.modelo = { contains: params.modelo };
        if (params.anio) where.anio = parseInt(params.anio);
    }

    // Filtro de pestañas
    switch (tab) {
        case 'en_preparacion': where.estado = 'EN_PREPARACION'; break;
        case 'listos': where.estado = 'LISTO_PARA_VENTA'; break;
        case 'consignacion': where.tipo_ingreso = 'Consignacion'; break;
        case 'senados': where.estado = 'SENADO'; break;
        case 'vendidos': where.estado = 'VENDIDO'; break;
    }

    const vehiculosDb = await db.vehiculo.findMany({
        where,
        orderBy: { id_vehiculo: 'desc' },
        include: { _count: { select: { tareas: { where: { estado_tarea: 'PENDIENTE' } } } } }
    });

    const vehiculos = vehiculosDb.map(v => {
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
            compra_usd: Number(v.precio_compra_usd) || 0,
            compra_ars: Number(v.precio_compra_ars) || 0,
            venta_usd: Number(v.precio_venta_usd) || 0,
            venta_ars: Number(v.precio_venta_ars) || 0,
            tipo_vehiculo: v.tipo_vehiculo,
            cilindrada: v.cilindrada || '',
        };
    });

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>}>
            <VehiculosClient vehiculos={vehiculos} currentTab={tab} currentDolar={dolarBlue} />
        </Suspense>
    );
}
