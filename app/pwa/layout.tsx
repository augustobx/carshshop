import type { Metadata, Viewport } from "next";
import { prisma as db } from "@/lib/prisma";
import PWASplash from "./PWASplash";

export const metadata: Metadata = {
    title: "Carsh PWA - Vendedores",
    description: "Gestión comercial móvil",
};

// Forzamos el viewport para que se sienta como una App nativa
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#0f172a", // Barra superior negra en el celular
};

export default async function PWALayout({ children }: { children: React.ReactNode }) {
    // Leemos el Branding de la Base de Datos
    const cfgTema = await db.configuracion.findUnique({ where: { clave: 'empresa_tema' } });
    const cfgLogo = await db.configuracion.findUnique({ where: { clave: 'empresa_logo' } });

    // Inyectamos las variables CSS de tu color (Ej: el Rojo)
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

    return (
        <div className="min-h-screen bg-slate-900 text-slate-900 select-none antialiased">
            {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}

            {/* Contenedor limitado a ancho móvil */}
            <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col">
                <PWASplash logo={logoStr}>
                    {children}
                </PWASplash>
            </div>
        </div>
    );
}