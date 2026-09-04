import { getLoggedUser } from '@/lib/user-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, LogOut, Car } from 'lucide-react';
import { logoutAction } from '@/actions/auth';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getLoggedUser();

  if (!user || !user.isSuperAdmin) {
    redirect('/login?error=superadmin_required');
  }

  const handleLogout = async () => {
    'use server';
    await logoutAction();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white">OnlyCars</span>
              <span className="text-[10px] uppercase tracking-widest font-black ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                NanoLabs SuperAdmin
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 ml-8">
            <Link
              href="/superadmin"
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              Concesionarias
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{user.name || user.email}</p>
            <p className="text-[10px] text-blue-400 font-mono">SuperAdmin Maestro</p>
          </div>

          <form action={handleLogout}>
            <button
              type="submit"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar sesión de plataforma"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
