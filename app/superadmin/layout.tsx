import { getLoggedUser } from '@/lib/user-auth';
import Link from 'next/link';
import { logoutAction } from '@/actions/auth';
import {
  Car,
  LayoutDashboard,
  Building2,
  Layers3,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getLoggedUser();

  // /superadmin/login debe seguir siendo público. Cada página protegida valida SuperAdmin.
  if (!user?.isSuperAdmin) return children;

  const handleLogout = async () => {
    'use server';
    await logoutAction();
  };

  const navItems = [
    { href: '/superadmin', label: 'Métricas', icon: LayoutDashboard },
    { href: '/superadmin/tenants', label: 'Concesionarias / Tenants', icon: Building2 },
    { href: '/superadmin/planes', label: 'Planes SaaS', icon: Layers3 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <aside className="hidden md:flex w-72 shrink-0 border-r border-slate-800 bg-slate-950 flex-col sticky top-0 h-screen">
        <div className="h-20 px-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-950/40">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">OnlyCars</span>
              <span className="text-[9px] uppercase tracking-widest font-black px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">SaaS</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 font-black">NanoLabs Control Plane</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] font-black text-slate-600">Plataforma</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
                <Icon className="w-4 h-4 text-indigo-400" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] uppercase tracking-wider font-black">
              <ShieldCheck className="w-3.5 h-3.5" /> SuperAdmin activo
            </div>
            <p className="text-xs font-semibold text-slate-300 mt-1 truncate">{user.name || user.email}</p>
          </div>
          <Link href="/" className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-white">
            <ExternalLink className="w-4 h-4" /> Ir a OnlyCars
          </Link>
          <form action={handleLogout}>
            <button type="submit" className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden h-16 px-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-50 flex items-center justify-between">
          <Link href="/superadmin" className="flex items-center gap-2 font-black text-white"><Car className="w-5 h-5 text-indigo-400" /> OnlyCars SaaS</Link>
          <div className="flex items-center gap-1">
            <Link href="/superadmin/tenants" className="p-2 rounded-lg text-slate-400 hover:bg-slate-900" aria-label="Tenants"><Building2 className="w-4 h-4" /></Link>
            <Link href="/superadmin/planes" className="p-2 rounded-lg text-slate-400 hover:bg-slate-900" aria-label="Planes"><Layers3 className="w-4 h-4" /></Link>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-[1500px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
