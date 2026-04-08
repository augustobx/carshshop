import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ConfigInitializer } from "@/components/ConfigInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarShop ERP",
  description: "Sistema Avanzado de Gestión de Agencia de Vehículos",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-background flex">
        <ConfigInitializer />
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen overflow-y-auto p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
