'use client';

import { useEffect, useState } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { syncDolarApi } from '@/actions/config';
import { RefreshCw, DollarSign, Loader2, Building2, Settings, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ModuleHelpButton from '@/components/ModuleHelpButton';

export default function TopBar({
  initialDolar, initialTipo, initialLogo, tenantName, isSuperAdmin, canSyncDolar = false, canConfigure = false,
}: {
  initialDolar: number; initialTipo: string; initialLogo: string | null; tenantName?: string; isSuperAdmin?: boolean;
  canSyncDolar?: boolean; canConfigure?: boolean;
}) {
  const router = useRouter();
  const { dolarBlue, setDolar, tipoDolar, setTipoDolar, setLogo } = useConfigStore();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => { setDolar(initialDolar); setTipoDolar(initialTipo); setLogo(initialLogo || null); }, [initialDolar, initialTipo, initialLogo, setDolar, setTipoDolar, setLogo]);

  const handleSync = async () => {
    if (!canSyncDolar) return;
    setIsSyncing(true);
    const res = await syncDolarApi(tipoDolar);
    if (res.success && res.valor) {
      setDolar(res.valor);
      router.refresh();
    } else {
      alert(res.error || 'Error actualizando cotización');
    }
    setIsSyncing(false);
  };

  const rateContent = <><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dólar {tipoDolar}</span><span className="text-sm font-black text-slate-900">$ {dolarBlue.toLocaleString('es-AR')}</span></>;

  return (
    <header className="h-16 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shrink-0">
      <div className="flex items-center gap-3 min-w-0"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Building2 className="w-4 h-4 text-slate-500" /></div><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.16em] font-black text-slate-400 leading-none">Concesionaria</p><p className="text-sm font-bold text-slate-800 truncate mt-1">{tenantName || 'OnlyCars'}</p></div>{isSuperAdmin && <span className="hidden lg:inline-flex text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100">Plataforma</span>}</div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5"><DollarSign className="w-4 h-4 text-emerald-600 mr-2" />{canConfigure ? <Link href="/configuracion" className="flex items-baseline gap-2">{rateContent}</Link> : <div className="flex items-baseline gap-2">{rateContent}</div>}{canSyncDolar && <button onClick={handleSync} disabled={isSyncing} title="Actualizar cotización" className="ml-2 p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-emerald-600 disabled:opacity-50">{isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}</button>}</div>
        <Link href="/manual" title="Manual de usuario" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"><BookOpen className="w-4 h-4" /></Link>
        <ModuleHelpButton />
        {canConfigure && <Link href="/configuracion" title="Configuración" className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Settings className="w-4 h-4" /></Link>}
      </div>
    </header>
  );
}
