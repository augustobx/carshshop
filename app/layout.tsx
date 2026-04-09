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
  // Leemos la configuración global de la base de datos una sola vez
  const cfgDolar = await db.configuracion.findUnique({ where: { clave: 'dolar_actual' } });
  const cfgTipo = await db.configuracion.findUnique({ where: { clave: 'tipo_dolar' } });

  const initialDolar = cfgDolar ? parseFloat(cfgDolar.valor) : 1000;
  const initialTipo = cfgTipo ? cfgTipo.valor : 'blue';

  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900 flex min-h-screen antialiased`}>
        {/* Barra Lateral Izquierda */}
        <Sidebar />

        {/* Área de Contenido Principal (con Top Bar) */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

          {/* El Header Global del Dólar */}
          <TopBar initialDolar={initialDolar} initialTipo={initialTipo} />

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>

        </main>
      </body>
    </html>
  );
}