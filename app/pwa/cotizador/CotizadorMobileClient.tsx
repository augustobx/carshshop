'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { registrarVenta } from '@/actions/ventas';
import { Calculator, ArrowLeft, ArrowRight, Banknote, CheckCircle2, Loader2, X } from 'lucide-react';

export default function CotizadorMobileClient({ vehiculos, clientes }: { vehiculos: any[], clientes: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const router = useRouter();
    const { dolarBlue } = useConfigStore();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [vSeleccionado, setVSeleccionado] = useState<any>(null);
    const [cSeleccionado, setCSeleccionado] = useState<any>(null);
    const [formaPago, setFormaPago] = useState<'Contado' | 'Cuotas'>('Contado');

    const [precioArs, setPrecioArs] = useState('');
    const [anticipoArs, setAnticipoArs] = useState('');
    const [cantCuotas, setCantCuotas] = useState('12');
    const [tnaAnual, setTnaAnual] = useState('36'); // Utilizado como % de recargo total

    useEffect(() => {
        if (vSeleccionado) {
            setPrecioArs(vSeleccionado.precio_venta_ars?.toString() || '');
        }
    }, [vSeleccionado]);

    const pFinalArs = parseFloat(precioArs) || 0;
    const antArs = parseFloat(anticipoArs) || 0;
    const saldoAFinanciarArs = Math.max(0, pFinalArs - antArs);
    const cuotasN = parseInt(cantCuotas) || 12;

    let valorCuotaArs = 0;
    let totalFinanciadoArs = 0;

    // CÁLCULO DE TAXA DIRETA NA PWA
    if (formaPago === 'Cuotas' && saldoAFinanciarArs > 0) {
        const tna = parseFloat(tnaAnual) || 0;
        if (tna > 0) {
            const recargoTotal = saldoAFinanciarArs * (tna / 100);
            totalFinanciadoArs = saldoAFinanciarArs + recargoTotal;
            valorCuotaArs = totalFinanciadoArs / cuotasN;
        } else {
            valorCuotaArs = saldoAFinanciarArs / cuotasN;
            totalFinanciadoArs = saldoAFinanciarArs;
        }
    }

    const handleConfirmar = async () => {
        if (!vSeleccionado || !cSeleccionado || pFinalArs <= 0) return alert('Faltan datos clave.');

        setIsSubmitting(true);
        const pFinalUsd = pFinalArs / dolarBlue;
        const cuotaUsd = valorCuotaArs / dolarBlue;

        let planDePagos: any[] = [];
        if (formaPago === 'Cuotas') {
            planDePagos = Array.from({ length: cuotasN }).map((_, i) => {
                const hoy = new Date();
                let year = hoy.getFullYear();
                let month = hoy.getMonth() + 2 + i;
                while (month > 12) { month -= 12; year += 1; }

                const yStr = year.toString();
                const mStr = month.toString().padStart(2, '0');
                const dStr = "10";

                return {
                    numero_cuota: i + 1,
                    monto_usd: cuotaUsd,
                    fecha_vencimiento: `${yStr}-${mStr}-${dStr}T12:00:00Z`
                };
            });
        }

        const res = await registrarVenta({
            id_vehiculo: vSeleccionado.id_vehiculo,
            id_cliente: cSeleccionado.id_cliente,
            precio_final_usd: pFinalUsd,
            cotizacion_dolar: dolarBlue,
            forma_pago: formaPago,
            cuotas: formaPago === 'Cuotas' ? planDePagos : undefined
        });

        if (res.success) {
            alert('¡Operación cerrada con éxito!');
            router.push('/pwa/dashboard');
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            <header className="bg-indigo-600 text-white sticky top-0 z-50 shadow-md">
                <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 -ml-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            Cotizador
                        </h1>
                    </div>
                    <div className="bg-indigo-800/50 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500">
                        USD: $ {dolarBlue}
                    </div>
                </div>
                <div className="flex h-1.5 bg-indigo-900">
                    <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
                </div>
            </header>

            <main className="p-4 space-y-4">
                {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">1. Vehículo</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                value={vSeleccionado?.id_vehiculo || ''}
                                onChange={e => {
                                    const v = vehiculos.find(x => x.id_vehiculo === parseInt(e.target.value));
                                    setVSeleccionado(v);
                                }}
                            >
                                <option value="" disabled>Tocar para elegir auto...</option>
                                {vehiculos.map(v => (
                                    <option key={v.id_vehiculo} value={v.id_vehiculo}>
                                        {v.marca} {v.modelo} - {v.patente}
                                    </option>
                                ))}
                            </select>
                            {vSeleccionado && (
                                <div className="mt-3 p-3 bg-indigo-50 rounded-xl flex justify-between items-center">
                                    <span className="text-xs font-bold text-indigo-700 uppercase">Precio Lista</span>
                                    <span className="font-black text-indigo-900">$ {formatMoney(vSeleccionado.precio_venta_ars)}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">2. Cliente</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                value={cSeleccionado?.id_cliente || ''}
                                onChange={e => {
                                    const c = clientes.find(x => x.id_cliente === parseInt(e.target.value));
                                    setCSeleccionado(c);
                                }}
                            >
                                <option value="" disabled>Tocar para elegir cliente...</option>
                                {clientes.map(c => (
                                    <option key={c.id_cliente} value={c.id_cliente}>
                                        {c.nombre_completo} ({c.dni || 'S/N'})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-5">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Precio Negociado (ARS)</label>
                                <div className="relative">
                                    <Banknote className="absolute left-4 top-4 w-6 h-6 text-emerald-500" />
                                    <input
                                        type="number" step="any"
                                        value={precioArs} onChange={e => setPrecioArs(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-2xl text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                <button onClick={() => setFormaPago('Contado')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formaPago === 'Contado' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Contado</button>
                                <button onClick={() => setFormaPago('Cuotas')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formaPago === 'Cuotas' ? 'bg-indigo-600 shadow text-white' : 'text-slate-500'}`}>Financiado</button>
                            </div>
                        </div>

                        {formaPago === 'Cuotas' && (
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-5 border-t-4 border-t-indigo-500">
                                <div>
                                    <label className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 block">Anticipo (ARS)</label>
                                    <input
                                        type="number" step="any" placeholder="0"
                                        value={anticipoArs} onChange={e => setAnticipoArs(e.target.value)}
                                        className="w-full px-4 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-xl text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <p className="text-xs text-slate-400 mt-2 font-bold text-right">Saldo a financiar: $ {formatMoney(saldoAFinanciarArs)}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cuotas</label>
                                        <select value={cantCuotas} onChange={e => setCantCuotas(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none">
                                            <option value="6">6</option>
                                            <option value="12">12</option>
                                            <option value="18">18</option>
                                            <option value="24">24</option>
                                            <option value="36">36</option>
                                            <option value="48">48</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">% Recargo Total</label>
                                        <input type="number" step="any" value={tnaAnual} onChange={e => setTnaAnual(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none" placeholder="Ex: 36" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in slide-in-from-right-4 fade-in">
                        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl border border-slate-800 text-white relative overflow-hidden">
                            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>

                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Propuesta Comercial</p>

                            <h2 className="text-3xl font-black tracking-tight mb-1">{vSeleccionado?.marca}</h2>
                            <p className="text-lg text-slate-400 font-medium mb-8">{vSeleccionado?.modelo}</p>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-slate-700/50 pb-4">
                                    <span className="text-sm font-bold text-slate-400">Precio del Vehículo</span>
                                    <span className="text-2xl font-black">$ {formatMoney(pFinalArs)}</span>
                                </div>

                                {formaPago === 'Cuotas' ? (
                                    <>
                                        <div className="flex justify-between items-end border-b border-slate-700/50 pb-4">
                                            <span className="text-sm font-bold text-slate-400">Anticipo a entregar</span>
                                            <span className="text-xl font-black text-emerald-400">$ {formatMoney(antArs)}</span>
                                        </div>
                                        <div className="pt-4 text-center bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Plan en Cuotas Fijas</p>
                                            <p className="text-5xl font-black text-white">{cuotasN} <span className="text-2xl text-slate-500 font-medium">x</span></p>
                                            <p className="text-4xl font-black text-indigo-400 mt-2">$ {formatMoney(valorCuotaArs)}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="pt-4 text-center bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">A abonar hoy</p>
                                        <p className="text-5xl font-black text-emerald-400">$ {formatMoney(pFinalArs)}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-700/50 flex justify-between items-center text-xs font-bold text-slate-500">
                                <span>Titular: {cSeleccionado?.nombre_completo}</span>
                                <span>Ref: U$S {formatMoney(pFinalArs / dolarBlue)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-safe flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                {step > 1 && (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="p-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}

                {step < 3 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 && (!vSeleccionado || !cSeleccionado)}
                        className="flex-1 bg-indigo-600 text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                        Siguiente <ArrowRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={handleConfirmar}
                        disabled={isSubmitting}
                        className="flex-1 bg-emerald-500 text-slate-900 p-4 rounded-2xl font-black flex justify-center items-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                        Cerrar Venta
                    </button>
                )}
            </div>
        </div>
    );
}