import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { prisma as db } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CarShop ERP | Gestión Integral",
    description: "Sistema de gestión bimonetario para agencias de vehículos",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // 1. Leemos TODA la configuración global de la BD
    const cfgDolar = await db.configuracion.findUnique({ where: { clave: 'dolar_actual' } });
    const cfgTipo = await db.configuracion.findUnique({ where: { clave: 'tipo_dolar' } });
    const cfgLogo = await db.configuracion.findUnique({ where: { clave: 'empresa_logo' } });
    const cfgTema = await db.configuracion.findUnique({ where: { clave: 'empresa_tema' } });

    // 2. Preparamos los valores iniciales
    const initialDolar = cfgDolar ? parseFloat(cfgDolar.valor) : 1000;
    const initialTipo = cfgTipo ? cfgTipo.valor : 'blue';
    const initialLogo = cfgLogo ? cfgLogo.valor : null;
    const initialTema = cfgTema ? JSON.parse(cfgTema.valor) : null;

    // 3. Inyectamos los colores del tema como CSS dinámico si existe
    let themeStyles = null;
    if (initialTema) {
        themeStyles = `
      :root {
        --color-brand: ${initialTema.primary};
        --color-brand-hover: ${initialTema.hover};
        --color-brand-ring: ${initialTema.ring};
      }
    `;
    }

    return (
        <html lang="es">
            <body className={`${inter.className} bg-slate-50 text-slate-900 flex min-h-screen antialiased`}>
                {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}

                <Sidebar />

                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    {/* Le pasamos el Logo y el Tema al TopBar para que hidrate el estado global */}
                    <TopBar
                        initialDolar={initialDolar}
                        initialTipo={initialTipo}
                        initialLogo={initialLogo}
                        initialTema={initialTema}
                    />

                    <div className="flex-1 overflow-y-auto">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}