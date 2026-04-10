'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { agregarAnotacion } from '@/actions/anotaciones'; // Usamos el motor unificado
import { ArrowLeft, CarFront, Calculator, Plus, Loader2, MessageSquare, Info, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function VehiculoMobileClient({ vehiculo }: { vehiculo: any }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    const router = useRouter();

    const [nota, setNota] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleGuardarNota = async () => {
        if (!nota.trim()) return;
        setIsSaving(true);

        const res = await agregarAnotacion(vehiculo.id_vehiculo, nota);

        if (res.success) {
            setNota(''); // Vaciamos la caja al enviar
        } else {
            alert(res.error);
        }
        setIsSaving(false);
    };

    const anotaciones = vehiculo.anotaciones || [];

    return (
        <div className="min-h-screen bg-slate-50 pb-28 font-sans">
            <header className="bg-white sticky top-0 z-50 border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm">
                <button onClick={() => router.back()} className="p-2 bg-slate-100 rounded-full text-slate-700">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-base font-black text-slate-800 uppercase tracking-wider">Ficha Técnica</h1>
                <div className="w-9"></div> {/* Espaciador invisible */}
            </header>

            <main className="p-4 space-y-4">
                {/* CABECERA AUTO */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CarFront className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">{vehiculo.marca}</h2>
                    <p className="text-lg text-slate-500 font-bold mb-4">{vehiculo.modelo}</p>

                    <div className="inline-block bg-slate-900 text-white px-6 py-2 rounded-2xl shadow-lg">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Precio Contado</p>
                        <p className="text-2xl font-black">$ {formatMoney(vehiculo.precio_venta_ars)}</p>
                    </div>
                </div>

                {/* DETALLES */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Info className="w-4 h-4" /> Info del Vehículo
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Año</span>
                            <span className="font-black text-slate-700 text-lg">{vehiculo.anio}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Kilómetros</span>
                            <span className="font-black text-slate-700 text-lg">{vehiculo.km}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl col-span-2 border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Patente</span>
                            <span className="font-mono font-black text-slate-700 text-lg">{vehiculo.patente}</span>
                        </div>
                    </div>
                </div>

                {/* SISTEMA DE NOTAS E HISTORIAL */}
                <div className="bg-amber-50 p-5 rounded-3xl shadow-sm border border-amber-200">
                    <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4" /> Bitácora / Notas
                    </h3>

                    {/* Input para nueva nota */}
                    <div className="bg-white p-2 rounded-2xl border border-amber-200 shadow-sm mb-5 flex items-center gap-2">
                        <input
                            type="text"
                            value={nota}
                            onChange={e => setNota(e.target.value)}
                            placeholder="Escribir una nota..."
                            className="flex-1 bg-transparent p-3 text-sm font-medium outline-none text-slate-700"
                        />
                        <button
                            onClick={handleGuardarNota}
                            disabled={isSaving || !nota.trim()}
                            className="p-3 bg-amber-500 text-white rounded-xl font-black disabled:opacity-50 active:scale-95 transition-all"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Historial de Notas */}
                    <div className="space-y-3">
                        {anotaciones.length === 0 ? (
                            <p className="text-center text-amber-600/60 font-bold text-sm py-4">Sin anotaciones.</p>
                        ) : (
                            anotaciones.map((n: any) => {
                                const fechaFormateada = new Date(n.fecha).toLocaleString('es-AR', {
                                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                });
                                return (
                                    <div key={n.id_anotacion} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm relative">
                                        <p className="text-sm font-bold text-slate-800 whitespace-pre-wrap leading-relaxed">{n.texto}</p>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                                                <UserCircle className="w-3.5 h-3.5" />
                                                {n.usuario?.nombre || 'Usuario'}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                {fechaFormateada} hs
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            {/* BOTÓN FLOTANTE PARA COTIZAR DIRECTO */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-safe">
                <Link href="/pwa/cotizador" className="w-full bg-[var(--color-brand,#4f46e5)] text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30">
                    <Calculator className="w-6 h-6" />
                    Ir al Cotizador
                </Link>
            </div>
        </div>
    );
}