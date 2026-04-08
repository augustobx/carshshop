'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CarFront, Users, BadgeDollarSign,
  Wallet, ClipboardList, Handshake, FileText, Settings, LogOut
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Vehículos', icon: CarFront, href: '/vehiculos' },
  { name: 'Ventas y Cotizador', icon: BadgeDollarSign, href: '/ventas' },
  { name: 'Préstamos', icon: Handshake, href: '/prestamos' },
  { name: 'Caja y Gastos', icon: Wallet, href: '/caja' },
  { name: 'Clientes', icon: Users, href: '/clientes' },
  { name: 'Consignaciones', icon: ClipboardList, href: '/consignaciones' },
  { name: 'Documentos', icon: FileText, href: '/documentos' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 h-screen sticky top-0 flex flex-col shadow-xl flex-shrink-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
        <CarFront className="w-7 h-7 text-indigo-500 mr-3" />
        <span className="text-xl font-black text-white tracking-tight">CarShop<span className="text-indigo-500">ERP</span></span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-3">Menú Principal</div>
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon className={`w-5 h-5 mr-3 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/30">
        <Link href="/configuracion" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
          <Settings className="w-5 h-5 mr-3 text-slate-400" />
          Configuración
        </Link>
        <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}