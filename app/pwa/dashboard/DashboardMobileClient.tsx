'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Calculator, LayoutGrid, ArrowLeft } from 'lucide-react';
import { useConfigStore } from '@/store/useConfigStore';

export default function DashboardMobileClient({ vehiculos }: { vehiculos: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    const router = useRouter();

    // Acá declaramos dolarBlue obteniéndolo de nuestra memoria global
    const { dolarBlue } = useConfigStore();

    const [searchTerm, setSearchTerm] = useState('');

    const filtrados = vehiculos.filter(v =>
        `${v.marca} ${v.modelo} ${v.patente}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            {/* APP BAR FIJA (PREMIUM DARK) */}
            <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md px-4 py-5 rounded-b-3xl mb-2">
                <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => router.back()} className="p-2 -ml-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex-1 flex justify-between items-center">
                        <h1 className="text-2xl font-black tracking-tight">Stock</h1>
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                                U$S {dolarBlue}
                            </span>
                            <div className="bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-300 uppercase border border-slate-700">
                                {vehiculos.length} Autos
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                        type="text" placeholder="Buscar marca, modelo o patente..."
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 text-white placeholder:text-slate-400 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-brand,#4f46e5)] font-medium transition-all"
                    />
                </div>
            </header>

            <main className="p-4 space-y-3 mt-2">
                {filtrados.length === 0 ? (
                    <p className="text-center text-slate-500 font-bold mt-10">No se encontraron vehículos.</p>
                ) : (
                    filtrados.map(v => (
                        <Link key={v.id_vehiculo} href={`/pwa/vehiculo/${v.id_vehiculo}`} className="block bg-white p-4 rounded-3xl shadow-sm border border-slate-100 active:scale-95 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 leading-tight">{v.marca} {v.modelo}</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {v.anio} • {v.km} KM
                                    </p>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${v.estado === 'EN_CONSIGNACION' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {v.estado === 'EN_CONSIGNACION' ? 'Consignación' : 'Propio'}
                                </span>
                            </div>

                            <div className="flex justify-between items-end mt-4">
                                <div className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-slate-600">
                                    {v.patente}
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-indigo-600">$ {formatMoney(v.precio_venta_ars)}</p>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </main>

            <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-3 pb-safe flex justify-around items-center shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-50">
                <Link href="/pwa/dashboard" className="flex flex-col items-center text-indigo-600">
                    <LayoutGrid className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-black uppercase">Stock</span>
                </Link>
                <Link href="/pwa/cotizador" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors">
                    <Calculator className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase">Cotizar</span>
                </Link>
            </nav>
        </div>
    );
}