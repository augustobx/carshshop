import type { Metadata, Viewport } from "next";
import { getTenantContext } from "@/lib/tenant-context";
import PWASplash from "./PWASplash";

export const metadata: Metadata = {
    title: "OnlyCars PWA - Vendedores",
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
    let tenant;
    try {
        tenant = await getTenantContext();
    } catch {
        tenant = {
            settings: {
                logoUrl: null,
                dolarActual: 1400,
                primaryColor: "#2563eb",
            },
        };
    }

    const brandColor = tenant.settings?.primaryColor || "#2563eb";
    const themeStyles = `
        :root {
            --color-brand: ${brandColor};
            --color-brand-hover: ${brandColor}ee;
            --color-brand-ring: ${brandColor}33;
        }
    `;

    const logoStr = tenant.settings?.logoUrl || null;
    const initialDolar = tenant.settings?.dolarActual || 1400;

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