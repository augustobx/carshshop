import { prisma as db } from "@/lib/prisma";
import ClientesClient from "./ClientesClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<any> }) {
    const params = await searchParams;
    const q = params.q || '';

    // Buscador global por nombre, DNI o Email
    const where = q ? {
        OR: [
            { nombre_completo: { contains: q } },
            { dni: { contains: q } },
            { email: { contains: q } }
        ]
    } : {};

    const clientesDb = await db.cliente.findMany({
        where,
        orderBy: { id_cliente: 'desc' },
        include: {
            _count: {
                select: {
                    ventas: true,
                    prestamos: true,
                    senias: true
                }
            }
        }
    });

    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}>
            <ClientesClient clientes={clientesDb} />
        </Suspense>
    );
}