'use client';

import Link from 'next/link';
import { CarFront, Calculator, LayoutGrid, UserCircle, ArrowRight } from 'lucide-react';
import { useConfigStore } from '@/store/useConfigStore';

export default function PwaHomeClient({ userName }: { userName: string }) {
    const { logo } = useConfigStore();

    return (
        <div className="flex flex-col min-h-screen p-6 justify-between bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand,#4f46e5)] rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 pt-10">
                {logo ? (
                    <div className="h-20 flex justify-start items-center mb-6">
                        <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain drop-shadow-lg" />
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-[var(--color-brand,#4f46e5)] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[var(--color-brand)]/20">
                            <CarFront className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter">CarShop<span className="text-[var(--color-brand,#4f46e5)]">ERP</span></h1>
                    </>
                )}
                <p className="text-slate-400 font-medium mt-2 text-lg">Panel Comercial</p>
            </div>

            <div className="relative z-10 space-y-4">
                <Link href="/pwa/dashboard" className="group flex items-center justify-between p-6 bg-slate-800/50 border border-slate-700 rounded-[2rem] hover:bg-slate-800 transition-all active:scale-95">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-white"><LayoutGrid className="w-6 h-6" /></div>
                        <div>
                            <p className="font-black text-xl">Stock en Vivo</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ver catálogo</p>
                        </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-[var(--color-brand,#4f46e5)] transition-colors" />
                </Link>

                <Link href="/pwa/cotizador" className="group flex items-center justify-between p-6 bg-slate-800/50 border border-slate-700 rounded-[2rem] hover:bg-slate-800 transition-all active:scale-95">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-white"><Calculator className="w-6 h-6" /></div>
                        <div>
                            <p className="font-black text-xl">Cotizar Venta</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nueva operación</p>
                        </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </Link>
            </div>

            <div className="relative z-10 pt-10 pb-6">
                <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                    <UserCircle className="w-10 h-10 text-[var(--color-brand,#4f46e5)]" />
                    <div>
                        <p className="text-sm font-black">{userName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Sincronizado</p>
                    </div>
                </div>
            </div>
        </div>
    );
}