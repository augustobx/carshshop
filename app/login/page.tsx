'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CarFront, Loader2, Lock, Mail, ShieldAlert } from 'lucide-react';
import { loginAction } from '@/actions/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await loginAction({ email, password });

    if (!res.success) {
      setError(res.error || 'Credenciales incorrectas.');
      setLoading(false);
      return;
    }

    const homePath = res.user?.homePath || '/';
    if (redirectParam) {
      router.push(redirectParam);
    } else {
      router.push(homePath);
    }
    router.refresh();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/25">
          <CarFront className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">OnlyCars</h1>
        <p className="text-slate-400 font-medium text-sm mt-1.5">Dealer Management System</p>
      </div>

      {searchParams.get('error') === 'superadmin_required' && (
        <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-6 border border-amber-500/20">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Acceso restringido: se requieren privilegios de SuperAdmin.
        </div>
      )}

      {searchParams.get('error') === 'tenant_access_denied' && (
        <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-6 border border-amber-500/20">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Tu usuario no tiene acceso a esta concesionaria.
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 text-red-400 p-3.5 rounded-xl text-xs font-bold text-center mb-6 border border-red-500/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="usuario@concesionaria.com" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="••••••••" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black text-sm flex justify-center items-center gap-2 shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 mt-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Iniciar sesión'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">NanoLabs Multi-Tenant Automotive Cloud</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-600 rounded-full blur-[160px] opacity-25"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-600 rounded-full blur-[160px] opacity-20"></div>
      <Suspense fallback={<div className="text-slate-400 text-sm">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
