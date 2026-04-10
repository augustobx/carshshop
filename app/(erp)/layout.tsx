import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { prisma as db } from "@/lib/prisma";

export default async function ERPLayout({ children }: { children: React.ReactNode }) {
    // Leemos la configuración global de la base de datos (Motor Financiero)
    const cfgDolar = await db.configuracion.findUnique({ where: { clave: 'dolar_actual' } });
    const cfgTipo = await db.configuracion.findUnique({ where: { clave: 'tipo_dolar' } });

    // Leemos la configuración de Branding (Tema de la Empresa)
    const cfgTema = await db.configuracion.findUnique({ where: { clave: 'empresa_tema' } });

    const initialDolar = cfgDolar ? parseFloat(cfgDolar.valor) : 1000;
    const initialTipo = cfgTipo ? cfgTipo.valor : 'blue';

    // Procesamos los colores si es que guardaste un tema en la configuración
    let themeStyles = null;
    if (cfgTema && cfgTema.valor) {
        try {
            const tema = JSON.parse(cfgTema.valor);
            themeStyles = `
        :root {
          --color-brand: ${tema.primary};
          --color-brand-hover: ${tema.hover};
          --color-brand-ring: ${tema.ring};
        }
      `;
        } catch (e) {
            console.error("Error al leer el tema de la BD");
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased">
            {/* INYECTAMOS LAS VARIABLES CSS DEL TEMA ELEGIDO DESDE EL SERVIDOR */}
            {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}

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