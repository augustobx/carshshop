'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { signOut } from 'next-auth/react'; // <-- Importamos signOut aquí también
import {
  Car,
  LayoutDashboard,
  BadgeDollarSign,
  Users,
  CalendarClock,
  HandCoins,
  Settings,
  LogOut,
  Wallet,
  CarFront,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { logo } = useConfigStore();

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vehículos', href: '/vehiculos', icon: Car },
    { name: 'Ventas y Cotizador', href: '/ventas', icon: BadgeDollarSign },
    { name: 'Cobranzas y Cuotas', href: '/cuotas', icon: CalendarClock },
    { name: 'Préstamos', href: '/prestamos', icon: HandCoins },
    { name: 'Caja y Gastos', href: '/caja', icon: Wallet },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Consignaciones', href: '/consignaciones', icon: CarFront },
    { name: 'Usuarios y Accesos', href: '/usuarios', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col sticky top-0 h-screen shrink-0 border-r border-slate-800 transition-all z-50">

      <div className="h-20 flex items-center px-6 border-b border-slate-800 overflow-hidden bg-slate-950/30 shrink-0">
        <Link href="/" className="flex items-center justify-center gap-2 transition-colors w-full h-full py-3">
          {logo ? (
            <img src={logo} alt="Logo Empresa" className="max-h-full max-w-full object-contain drop-shadow-md" />
          ) : (
            <>
              <Car className="w-6 h-6 shrink-0" style={{ color: 'var(--color-brand, #4f46e5)' }} />
              <span className="font-black text-xl tracking-tight text-white">CarShop<span style={{ color: 'var(--color-brand, #4f46e5)' }}>ERP</span></span>
            </>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2.5 custom-scrollbar">
        <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5">Menú Principal</p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              style={isActive ? { backgroundColor: 'var(--color-brand, #4f46e5)', color: 'white' } : {}}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                  ? 'shadow-lg shadow-black/20 scale-[1.02]'
                  : 'hover:bg-slate-800 hover:text-white hover:scale-[1.01]'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-5 border-t border-slate-800 space-y-3 bg-slate-900/50 shrink-0">
        <Link
          href="/configuracion"
          style={pathname.startsWith('/configuracion') ? { backgroundColor: 'var(--color-brand, #4f46e5)', color: 'white' } : {}}
          className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 ${pathname.startsWith('/configuracion')
              ? 'shadow-lg shadow-black/20 scale-[1.02]'
              : 'hover:bg-slate-800 hover:text-white hover:scale-[1.01]'
            }`}
        >
          <Settings className={`w-5 h-5 ${pathname.startsWith('/configuracion') ? 'text-white' : 'text-slate-400'}`} />
          Configuración
        </Link>

        {/* Le agregamos el evento onClick para cerrar sesión */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}