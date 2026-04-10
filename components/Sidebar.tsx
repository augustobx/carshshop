'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import {
  Car,
  LayoutDashboard,
  BadgeDollarSign,
  Users,
  CalendarClock,
  HandCoins,
  Settings,
  LogOut,
  FileText,
  Wallet,
  CarFront
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { logo } = useConfigStore(); // Traemos el logo del estado global

  // Definimos todas las rutas del sistema
  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vehículos', href: '/vehiculos', icon: Car },
    { name: 'Ventas y Cotizador', href: '/ventas', icon: BadgeDollarSign },
    { name: 'Cobranzas y Cuotas', href: '/cuotas', icon: CalendarClock },
    { name: 'Préstamos', href: '/prestamos', icon: HandCoins },
    { name: 'Caja y Gastos', href: '/caja', icon: Wallet },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Consignaciones', href: '/consignaciones', icon: CarFront },
    { name: 'Documentos', href: '/documentos', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 transition-all z-50">
      {/* Logo Dinámico */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 overflow-hidden bg-slate-950/30">
        <Link href="/" className="flex items-center justify-center gap-2 transition-colors w-full h-full py-3">
          {logo ? (
            <img src={logo} alt="Logo Empresa" className="max-h-full max-w-full object-contain drop-shadow-md" />
          ) : (
            <>
              <Car className="w-6 h-6 text-indigo-500 shrink-0" />
              <span className="font-black text-xl tracking-tight text-white">CarShop<span className="text-indigo-500">ERP</span></span>
            </>
          )}
        </Link>
      </div>

      {/* Menú Principal */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <p className="px-2 text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Menú Principal</p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              // Usamos style en línea para inyectar la variable CSS de tu marca de forma segura
              style={isActive ? { backgroundColor: 'var(--color-brand, #4f46e5)', color: 'white' } : {}}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                  ? 'shadow-md shadow-black/20'
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Configuración y Perfil (Abajo) */}
      <div className="p-4 border-t border-slate-800 space-y-1 bg-slate-900/50">
        <Link
          href="/configuracion"
          style={pathname.startsWith('/configuracion') ? { backgroundColor: 'var(--color-brand, #4f46e5)', color: 'white' } : {}}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${pathname.startsWith('/configuracion')
              ? 'shadow-md shadow-black/20'
              : 'hover:bg-slate-800 hover:text-white'
            }`}
        >
          <Settings className={`w-5 h-5 ${pathname.startsWith('/configuracion') ? 'text-white' : 'text-slate-400'}`} />
          Configuración
        </Link>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors">
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}