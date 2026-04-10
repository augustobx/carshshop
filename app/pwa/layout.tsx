import type { Metadata, Viewport } from "next";
import { prisma as db } from "@/lib/prisma";
import PWASplash from "./PWASplash";

export const metadata: Metadata = {
    title: "Carsh PWA - Vendedores",
    description: "Gestión comercial móvil",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#0f172a",
};

export default async function PWALayout({ children }: { children: React.ReactNode }) {
    const cfgTema = await db.configuracion.findUnique({ where: { clave: 'empresa_tema' } });
    const cfgLogo = await db.configuracion.findUnique({ where: { clave: 'empresa_logo' } });
    const cfgDolar = await db.configuracion.findUnique({ where: { clave: 'dolar_actual' } });

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
        } catch (e) { }
    }

    const logoStr = cfgLogo ? cfgLogo.valor : null;
    const initialDolar = cfgDolar ? parseFloat(cfgDolar.valor) : 1000;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-900 select-none antialiased">
            {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}
            <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col">
                <PWASplash logo={logoStr} initialDolar={initialDolar}>
                    {children}
                </PWASplash>
            </div>
        </div>
    );
}