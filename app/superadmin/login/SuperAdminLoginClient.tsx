'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions/auth';
import { Car, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function SuperAdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await loginAction({ email, password });
    if (!result.success || !result.user?.isSuperAdmin) {
      setError(result.error || 'El usuario no tiene acceso SuperAdmin.');
      setLoading(false);
      return;
    }
    router.push('/superadmin');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-950/50"><Car className="w-7 h-7 text-white" /></div>
          <div className="flex items-center justify-center gap-2 mt-4"><h1 className="text-2xl font-black text-white">OnlyCars</h1><span className="text-[9px] uppercase tracking-widest font-black px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">SaaS</span></div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-600 font-black mt-2">NanoLabs Control Plane</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-5"><ShieldCheck className="w-4 h-4 text-emerald-400" /><div><h2 className="font-black text-white">Acceso SuperAdmin</h2><p className="text-xs text-slate-500 mt-0.5">Administración global de la plataforma.</p></div></div>
          {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
          <label className="block mb-4"><span className="block text-[10px] uppercase tracking-wider font-black text-slate-500 mb-1.5">Email</span><input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none focus:border-indigo-500" /></label>
          <label className="block mb-5"><span className="block text-[10px] uppercase tracking-wider font-black text-slate-500 mb-1.5">Contraseña</span><div className="relative"><LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" /><input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-3.5 py-3 text-sm text-white outline-none focus:border-indigo-500" /></div></label>
          <button disabled={loading} className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-3 text-sm font-black text-white inline-flex items-center justify-center gap-2">{loading && <Loader2 className="w-4 h-4 animate-spin" />} Ingresar al Control Plane</button>
        </form>
      </div>
    </main>
  );
}
