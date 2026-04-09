'use client';

import Link from 'next/link';
import { CarFront, Calculator, ClipboardList, UserCircle, ArrowRight } from 'lucide-react';

export default function PWARootPage() {
    return (
        <div className="flex flex-col min-h-screen p-6 justify-between bg-slate-900 text-white overflow-hidden">
            {/* Fondo Decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>

            {/* Header / Logo */}
            <div className="relative z-10 pt-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                    <CarFront className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter">
                    Carsh<span className="text-indigo-500">Shop</span>
                </h1>
                <p className="text-slate-400 font-medium mt-2 text-lg">Panel de Vendedores</p>
            </div>

            {/* Menú de Accesos Rápidos */}
            <div className="relative z-10 space-y-4">
                <Link href="/pwa/dashboard" className="group flex items-center justify-between p-6 bg-slate-800/50 border border-slate-700 rounded-[2rem] hover:bg-slate-800 transition-all active:scale-95">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                            <LayoutGridIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-xl">Stock en Vivo</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ver catálogo</p>
                        </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </Link>

                <Link href="/pwa/cotizador" className="group flex items-center justify-between p-6 bg-slate-800/50 border border-slate-700 rounded-[2rem] hover:bg-slate-800 transition-all active:scale-95">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-black text-xl">Cotizar Venta</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nueva operación</p>
                        </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </Link>
            </div>

            {/* Footer / Usuario */}
            <div className="relative z-10 pt-10 pb-6">
                <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                    <UserCircle className="w-10 h-10 text-slate-500" />
                    <div>
                        <p className="text-sm font-black">Vendedor Activo</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Sincronización en tiempo real</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icono auxiliar para el diseño
function LayoutGridIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    );
}