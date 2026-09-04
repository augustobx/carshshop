'use client';

import { useEffect, useState } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { syncDolarApi } from '@/actions/config';
import { RefreshCw, DollarSign, Loader2, Bell, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function TopBar({
  initialDolar,
  initialTipo,
  initialLogo,
  tenantName,
  isSuperAdmin,
}: {
  initialDolar: number;
  initialTipo: string;
  initialLogo: string | null;
  tenantName?: string;
  isSuperAdmin?: boolean;
}) {
  const { dolarBlue, setDolar, tipoDolar, setTipoDolar, setLogo } = useConfigStore();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setDolar(initialDolar);
    setTipoDolar(initialTipo);
    if (initialLogo) setLogo(initialLogo);
  }, [initialDolar, initialTipo, initialLogo, setDolar, setTipoDolar, setLogo]);

  const handleSync = async () => {
    setIsSyncing(true);
    const res = await syncDolarApi(tipoDolar);
    if (res.success && res.valor) {
      setDolar(res.valor);
    } else {
      alert(res.error || 'Error actualizando cotización');
    }
    setIsSyncing(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-xs shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span>{tenantName || 'Concesionaria'}</span>
        </div>
        {isSuperAdmin && (
          <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700">
            Modo Plataforma
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-emerald-50 border border-emerald-200/80 rounded-xl p-1.5 px-3 shadow-xs transition-all hover:shadow-sm">
          <DollarSign className="w-4 h-4 text-emerald-600 mr-1.5" />
          <Link href="/configuracion" className="flex flex-col mr-3 group">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider leading-none">
              Dólar {tipoDolar}
            </span>
            <span className="text-sm font-black text-emerald-950 leading-none mt-1">
              $ {dolarBlue.toLocaleString('es-AR')}
            </span>
          </Link>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            title="Sincronizar cotización con DolarAPI"
            className="bg-white border border-emerald-200 p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 shadow-xs"
          >
            {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}