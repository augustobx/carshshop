'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { guardarNotaVehiculo } from '@/actions/pwa';
import { ArrowLeft, CarFront, Calculator, Save, Loader2, StickyNote, Info } from 'lucide-react';
import Link from 'next/link';

export default function VehiculoMobileClient({ vehiculo }: { vehiculo: any }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    const router = useRouter();

    const [nota, setNota] = useState(vehiculo.notas_internas || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleGuardarNota = async () => {
        setIsSaving(true);
        setIsSaved(false);
        const res = await guardarNotaVehiculo(vehiculo.id_vehiculo, nota);
        if (res.success) {
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } else {
            alert(res.error);
        }
        setIsSaving(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            <header className="bg-white sticky top-0 z-50 border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm">
                <button onClick={() => router.back()} className="p-2 bg-slate-100 rounded-full text-slate-700">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-black text-slate-800 uppercase tracking-wider">Ficha Técnica</h1>
                <div className="w-9"></div> {/* Espaciador invisible */}
            </header>

            <main className="p-4 space-y-6">
                {/* CABECERA AUTO */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CarFront className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">{vehiculo.marca}</h2>
                    <p className="text-lg text-slate-500 font-bold mb-4">{vehiculo.modelo}</p>

                    <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-2xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Precio Contado</p>
                        <p className="text-2xl font-black">$ {formatMoney(vehiculo.precio_venta_ars)}</p>
                    </div>
                </div>

                {/* DETALLES */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Info className="w-4 h-4" /> Info del Vehículo
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-2xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Año</span>
                            <span className="font-black text-slate-700 text-lg">{vehiculo.anio}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Kilómetros</span>
                            <span className="font-black text-slate-700 text-lg">{vehiculo.km}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl col-span-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Patente</span>
                            <span className="font-mono font-black text-slate-700 text-lg">{vehiculo.patente}</span>
                        </div>
                    </div>
                </div>

                {/* SISTEMA DE NOTAS SINCRONIZADAS */}
                <div className="bg-amber-50 p-6 rounded-3xl shadow-sm border border-amber-200">
                    <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <StickyNote className="w-4 h-4" /> Notas a la Oficina
                    </h3>
                    <textarea
                        value={nota}
                        onChange={e => setNota(e.target.value)}
                        placeholder="Escribí detalles, raspones, o si un cliente ofreció un número..."
                        className="w-full bg-white border border-amber-200 rounded-2xl p-4 min-h-[120px] text-slate-700 font-medium outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />

                    <button
                        onClick={handleGuardarNota}
                        disabled={isSaving}
                        className={`w-full mt-3 p-4 rounded-2xl font-black flex justify-center items-center gap-2 transition-all active:scale-95 ${isSaved ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-amber-950 hover:bg-amber-400'}`}
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaved ? '¡Enviado a la Oficina!' : 'Guardar y Sincronizar'}
                    </button>
                </div>
            </main>

            {/* BOTÓN FLOTANTE PARA COTIZAR DIRECTO */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-safe">
                <Link href="/pwa/cotizador" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30">
                    <Calculator className="w-6 h-6" />
                    Ir al Cotizador
                </Link>
            </div>
        </div>
    );
}