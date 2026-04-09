'use client';

import { useEffect, useState } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { syncDolarApi } from '@/actions/config';
import { RefreshCw, DollarSign, Loader2, Bell } from 'lucide-react';
import Link from 'next/link';

export default function TopBar({ initialDolar, initialTipo }: { initialDolar: number, initialTipo: string }) {
    const { dolarBlue, setDolar, tipoDolar, setTipoDolar } = useConfigStore();
    const [isSyncing, setIsSyncing] = useState(false);

    // Hidratamos el estado global con los datos que vienen de la Base de Datos (Servidor)
    useEffect(() => {
        setDolar(initialDolar);
        setTipoDolar(initialTipo);
    }, [initialDolar, initialTipo, setDolar, setTipoDolar]);

    const handleSync = async () => {
        setIsSyncing(true);
        const res = await syncDolarApi(tipoDolar);
        if (res.success && res.valor) {
            setDolar(res.valor); // Actualiza TODO el sistema al instante (tarjetas, inputs, etc)
        } else {
            alert(res.error || 'Error actualizando cotización');
        }
        setIsSyncing(false);
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm shrink-0">
            <div className="flex items-center text-sm font-medium text-slate-500">
                {/* Aquí podemos poner Breadcrumbs o un Buscador Global a futuro */}
                Sistema Bimonetario Activo
            </div>

            <div className="flex items-center gap-4">
                {/* Widget del Dólar */}
                <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-xl p-1.5 px-3 shadow-sm transition-all hover:shadow-md">
                    <DollarSign className="w-5 h-5 text-emerald-600 mr-2" />
                    <Link href="/configuracion" className="flex flex-col mr-4 group">
                        <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-wider leading-none group-hover:text-emerald-800 transition-colors">
                            Cotización {tipoDolar}
                        </span>
                        <span className="text-base font-black text-emerald-900 leading-none mt-1">
                            $ {dolarBlue.toLocaleString('es-AR')}
                        </span>
                    </Link>
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        title="Consultar cotización actual a DolarAPI"
                        className="bg-white border border-emerald-200 p-2 rounded-lg text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-emerald-600 shadow-sm"
                    >
                        {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                </div>

                <button className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <Bell className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}