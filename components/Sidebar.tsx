'use client';

import type { ComponentType } from 'react';
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
  BriefcaseBusiness,
  Warehouse,
  Landmark,
  ChevronRight,
} from 'lucide-react';

type MenuItem = {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type MenuGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: MenuItem[];
};

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

  const groups: MenuGroup[] = [
    {
      label: 'Comercial',
      icon: BriefcaseBusiness,
      items: [
        { name: 'Pipeline y Prospectos', href: '/prospectos', icon: UserCheck },
        { name: 'Clientes', href: '/clientes', icon: Users },
      ],
    },
    {
      label: 'Inventario',
      icon: Warehouse,
      items: [
        { name: 'Vehículos', href: '/vehiculos', icon: Car },
        { name: 'Motos', href: '/motos', icon: Bike },
        { name: 'Consignaciones', href: '/consignaciones', icon: CarFront },
      ],
    },
    {
      label: 'Operaciones',
      icon: BadgeDollarSign,
      items: [
        { name: 'Ventas y Cotizador', href: '/ventas', icon: BadgeDollarSign },
      ],
    },
    {
      label: 'Administración',
      icon: Landmark,
      items: [
        { name: 'Cobranzas y Cuotas', href: '/cuotas', icon: CalendarClock },
        { name: 'Financiación', href: '/prestamos', icon: HandCoins },
        { name: 'Caja y Gastos', href: '/caja', icon: Wallet },
      ],
    },
    {
      label: 'Gestión',
      icon: Settings,
      items: [
        { name: 'Sucursales', href: '/sucursales', icon: Building },
        { name: 'Usuarios y Accesos', href: '/usuarios', icon: ShieldCheck },
      ],
    },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/login';
  };

  return (
    <aside className="w-72 bg-slate-950 text-slate-300 flex flex-col sticky top-0 h-screen shrink-0 border-r border-slate-800 z-50">
      <div className="h-20 flex items-center px-5 border-b border-slate-800 bg-slate-950 shrink-0">
        <Link href="/" className="flex items-center gap-3 w-full min-w-0">
          {displayLogo ? (
            <img src={displayLogo} alt="Logo Concesionaria" className="max-h-10 max-w-[150px] object-contain" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-950/40">
                <Car className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-black text-lg tracking-tight text-white block truncate leading-tight">
                  {tenantName || 'OnlyCars'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">
                  Dealer Management System
                </span>
              </div>
            </>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
        <div className="mb-5">
          <p className="px-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.18em] mb-2">Inicio</p>
          <Link
            href="/"
            style={isActive('/') ? { backgroundColor: 'var(--color-brand, #2563eb)', color: 'white' } : {}}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-all ${
              isActive('/') ? 'shadow-lg shadow-blue-950/30 text-white' : 'hover:bg-slate-900 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Centro de Operaciones</span>
          </Link>
        </div>

        <div className="space-y-5">
          {groups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <section key={group.label}>
                <div className="px-3 flex items-center gap-2 mb-2 text-slate-600">
                  <GroupIcon className="w-3.5 h-3.5" />
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]">{group.label}</p>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        style={active ? { backgroundColor: 'var(--color-brand, #2563eb)', color: 'white' } : {}}
                        className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          active ? 'shadow-md shadow-blue-950/20 text-white' : 'hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <span className="truncate flex-1">{item.name}</span>
                        <ChevronRight className={`w-3.5 h-3.5 ${active ? 'opacity-80' : 'opacity-0 group-hover:opacity-50'}`} />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950 shrink-0 space-y-1.5">
        {isSuperAdmin && (
          <Link
            href="/superadmin"
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/15 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            SuperAdmin Plataforma
          </Link>
        )}

        <Link
          href="/configuracion"
          style={isActive('/configuracion') ? { backgroundColor: 'var(--color-brand, #2563eb)', color: 'white' } : {}}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isActive('/configuracion') ? 'text-white' : 'hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          Configuración
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
