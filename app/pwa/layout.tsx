import type { Metadata, Viewport } from "next";

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
};

export default function PWALayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 select-none antialiased">
            {/* Contenedor limitado a ancho móvil en caso de abrirse en tablet/PC */}
            <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative">
                {children}
            </div>
        </div>
    );
}