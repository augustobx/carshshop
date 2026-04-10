import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CarShop ERP",
  description: "Sistema de gestión bimonetario para agencias de vehículos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        {/* Este layout madre ya no tiene Sidebar. Solo carga el contenido que le pasen. */}
        {children}
      </body>
    </html>
  );
}