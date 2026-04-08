import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CarShop ERP | Gestión Integral",
  description: "Sistema de gestión para agencias de vehículos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex min-h-screen antialiased`}>
        {/* Barra Lateral Global */}
        <Sidebar />

        {/* Área de Contenido Principal */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Aquí se renderiza cada módulo (Vehículos, Ventas, etc.) */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}