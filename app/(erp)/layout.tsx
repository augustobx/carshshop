import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { prisma as db } from "@/lib/prisma";

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
    // Leemos la configuración global de la base de datos para el escritorio
    const cfgDolar = await db.configuracion.findUnique({ where: { clave: 'dolar_actual' } });
    const cfgTipo = await db.configuracion.findUnique({ where: { clave: 'tipo_dolar' } });

    const initialDolar = cfgDolar ? parseFloat(cfgDolar.valor) : 1000;
    const initialTipo = cfgTipo ? cfgTipo.valor : 'blue';

    return (
        <div className="flex min-h-screen">
            {/* Barra Lateral Izquierda (Solo para el ERP) */}
            <Sidebar />

            {/* Área de Contenido Principal (con Top Bar) */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <TopBar initialDolar={initialDolar} initialTipo={initialTipo} />

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}