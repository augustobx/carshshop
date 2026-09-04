'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { logoutAction } from '@/actions/auth';
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
  ShieldCheck,
  Bike,
  UserCheck,
  Building,
  ShieldAlert,
} from 'lucide-react';

export default function Sidebar({
  tenantName,
  tenantLogo,
  isSuperAdmin,
}: {
  tenantName?: string;
  tenantLogo?: string | null;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { logo } = useConfigStore();

  const displayLogo = tenantLogo || logo;

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Vehículos', href: '/vehiculos', icon: Car },
    { name: 'Motos', href: '/motos', icon: Bike },
    { name: 'CRM Prospectos', href: '/prospectos', icon: UserCheck },
    { name: 'Ventas y Cotizador', href: '/ventas', icon: BadgeDollarSign },
    { name: 'Cobranzas y Cuotas', href: '/cuotas', icon: CalendarClock },
    { name: 'Préstamos', href: '/prestamos', icon: HandCoins },
    { name: 'Caja y Gastos', href: '/caja', icon: Wallet },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Consignaciones', href: '/consignaciones', icon: CarFront },
    { name: 'Sucursales', href: '/sucursales', icon: Building },
    { name: 'Usuarios y Accesos', href: '/usuarios', icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col sticky top-0 h-screen shrink-0 border-r border-slate-800 transition-all z-50">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 overflow-hidden bg-slate-950/40 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 transition-colors w-full h-full py-3">
          {displayLogo ? (
            <img
              src={displayLogo}
              alt="Logo Concesionaria"
              className="max-h-10 max-w-[140px] object-contain drop-shadow-md"
            />
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                <Car className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-lg tracking-tight text-white block truncate leading-tight">
                  {tenantName || 'OnlyCars'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  Dealership Cloud
                </span>
              </div>
            </>
          )}
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-1.5 custom-scrollbar">
        <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Menú Operativo
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              style={isActive ? { backgroundColor: 'var(--color-brand, #2563eb)', color: 'white' } : {}}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
                isActive
                  ? 'shadow-lg shadow-blue-900/30 text-white'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40 shrink-0">
        {isSuperAdmin && (
          <Link
            href="/superadmin"
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            SuperAdmin Plataforma
          </Link>
        )}

        <Link
          href="/configuracion"
          style={pathname.startsWith('/configuracion') ? { backgroundColor: 'var(--color-brand, #2563eb)', color: 'white' } : {}}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            pathname.startsWith('/configuracion')
              ? 'shadow-lg text-white'
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Configuración
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}