'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { registrarPrestamo } from '@/actions/prestamos';
import { Calculator, UserRound, Banknote, DollarSign, Loader2, Search, ArrowRight, TrendingUp, HandCoins } from 'lucide-react';
import Link from 'next/link';

export default function NuevoPrestamoClient({ clientes }: { clientes: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const router = useRouter();
    const { dolarBlue } = useConfigStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [cSearch, setCSearch] = useState('');
    const [showCSearch, setShowCSearch] = useState(false);
    const [cSeleccionado, setCSeleccionado] = useState<any>(null);

    const [capitalArs, setCapitalArs] = useState('');
    const [capitalUsd, setCapitalUsd] = useState('');

    const [cantCuotas, setCantCuotas] = useState('12');

    // Inicia con 1 mes exacto por delante
    const [fechaPrimerCuota, setFechaPrimerCuota] = useState(() => {
        const hoy = new Date();
        let m = hoy.getMonth() + 2;
        let y = hoy.getFullYear();
        if (m > 12) { m -= 12; y += 1; }
        return `${y}-${String(m).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    });

    const [tnaAnual, setTnaAnual] = useState('60');
    const [interesDirecto, setInteresDirecto] = useState('');

    const handleCapitalArs = (val: string) => {
        setCapitalArs(val);
        const num = parseFloat(val) || 0;
        setCapitalUsd(num > 0 ? (num / dolarBlue).toFixed(2) : '');
    };

    const clientesFiltrados = clientes.filter(c => `${c.nombre_completo} ${c.dni || ''}`.toLowerCase().includes(cSearch.toLowerCase()));

    const capPrestadoArs = parseFloat(capitalArs) || 0;
    const cuotasN = parseInt(cantCuotas) || 1;

    let valorCuotaArs = 0;
    let totalADevolverArs = 0;

    if (capPrestadoArs > 0) {
        if (tnaAnual && parseFloat(tnaAnual) > 0) {
            const r = (parseFloat(tnaAnual) / 100) / 12;
            valorCuotaArs = (capPrestadoArs * r * Math.pow(1 + r, cuotasN)) / (Math.pow(1 + r, cuotasN) - 1);
            totalADevolverArs = valorCuotaArs * cuotasN;
        }
        else if (interesDirecto && parseFloat(interesDirecto) > 0) {
            const intDirecto = parseFloat(interesDirecto) / 100;
            totalADevolverArs = capPrestadoArs * (1 + intDirecto);
            valorCuotaArs = totalADevolverArs / cuotasN;
        }
        else {
            totalADevolverArs = capPrestadoArs;
            valorCuotaArs = capPrestadoArs / cuotasN;
        }
    }

    const gananciaFinancieraArs = totalADevolverArs - capPrestadoArs;

    const handleProcesarPrestamo = async () => {
        if (!cSeleccionado || capPrestadoArs <= 0) return alert('Completa Cliente y Capital a prestar.');

        setIsSubmitting(true);

        const capUsd = parseFloat((capPrestadoArs / dolarBlue).toFixed(2));
        const totalDevUsd = parseFloat((totalADevolverArs / dolarBlue).toFixed(2));
        const cuotaUsd = parseFloat((valorCuotaArs / dolarBlue).toFixed(2));

        const planDePagos = Array.from({ length: cuotasN }).map((_, i) => {
            // LA VACUNA: Matemática pura y dura
            const partes = fechaPrimerCuota.split('-');
            let year = parseInt(partes[0]);
            let month = parseInt(partes[1]) + i;
            const originalDay = parseInt(partes[2]);

            while (month > 12) {
                month -= 12;
                year += 1;
            }

            const diasDelMes = new Date(year, month, 0).getDate();
            const diaSeguro = Math.min(originalDay, diasDelMes);

            const yStr = year.toString();
            const mStr = month.toString().padStart(2, '0');
            const dStr = diaSeguro.toString().padStart(2, '0');

            return {
                numero_cuota: i + 1,
                monto_usd: cuotaUsd,
                fecha_vencimiento: `${yStr}-${mStr}-${dStr}T12:00:00Z`
            };
        });

        const res = await registrarPrestamo({
            id_cliente: cSeleccionado.id_cliente,
            capital_entregado_usd: capUsd,
            total_devolver_usd: totalDevUsd,
            cotizacion_dolar: dolarBlue,
            cuotas: planDePagos
        });

        if (res.success) router.push('/prestamos');
        else { alert(res.error); setIsSubmitting(false); }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 rounded-xl"><HandCoins className="w-8 h-8 text-blue-700" /></div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Otorgar Nuevo Préstamo</h1>
                    <p className="text-slate-500 font-medium mt-1">Simulador y liquidación de créditos personales (ARS).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                            <UserRound className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-slate-800">1. Prestatario</h3>
                        </div>
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-500 uppercase flex justify-between mb-1">
                                <span>Cliente Solicitante *</span>
                                <Link href="/clientes" className="text-indigo-600 hover:underline">Nuevo</Link>
                            </label>
                            {!cSeleccionado ? (
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Buscar nombre o DNI..." value={cSearch} onChange={e => { setCSearch(e.target.value); setShowCSearch(true) }} onFocus={() => setShowCSearch(true)} className="w-full pl-9 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" />
                                    {showCSearch && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {clientesFiltrados.map(c => (
                                                <div key={c.id_cliente} onClick={() => { setCSeleccionado(c); setShowCSearch(false) }} className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 text-sm">
                                                    <div className="font-bold text-slate-800">{c.nombre_completo}</div>
                                                    <div className="text-xs text-slate-500">DNI: {c.dni || 'S/N'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-blue-900 text-base">{cSeleccionado.nombre_completo}</div>
                                        <div className="text-xs text-blue-700/70 font-bold">DNI: {cSeleccionado.dni || 'S/N'}</div>
                                    </div>
                                    <button onClick={() => setCSeleccionado(null)} className="text-blue-600 hover:underline text-sm font-bold bg-white px-3 py-1 rounded-lg border border-blue-200">Cambiar</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                            <Banknote className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-lg font-bold text-slate-800">2. Capital Requerido (ARS)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div>
                                <label className="text-xs font-black text-emerald-800 uppercase mb-2 block">Monto a Entregar en Pesos *</label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-3.5 w-5 h-5 text-emerald-600" />
                                    <input type="number" step="any" value={capitalArs} onChange={e => handleCapitalArs(e.target.value)} className="w-full pl-10 p-3 border border-emerald-400 bg-white rounded-xl focus:ring-2 focus:ring-emerald-600 font-black text-emerald-900 text-xl" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Respaldo Contable (Dólares)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                    <input type="text" disabled value={capitalUsd} className="w-full pl-10 p-3 border border-slate-200 bg-slate-100 rounded-xl font-bold text-slate-500 text-lg" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-bold text-slate-800">3. Condiciones del Préstamo (ARS)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cantidad de Cuotas Mensuales</label>
                                <input type="number" value={cantCuotas} onChange={e => setCantCuotas(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-lg" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vencimiento 1ra Cuota</label>
                                <input type="date" value={fechaPrimerCuota} onChange={e => setFechaPrimerCuota(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold" />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-700 mb-4">Tasas de Financiación</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">TNA Anual (%)</label>
                                    <input type="number" step="any" value={tnaAnual} onChange={e => { setTnaAnual(e.target.value); setInteresDirecto('') }} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-700" placeholder="Ej: 60" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">TNA Mensual (%)</label>
                                    <input type="number" value={tnaAnual ? (parseFloat(tnaAnual) / 12).toFixed(2) : ''} disabled className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-400" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">% Int. Directo</label>
                                    <input type="number" step="any" value={interesDirecto} onChange={e => { setInteresDirecto(e.target.value); setTnaAnual('') }} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="Opcional" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 space-y-6 relative">
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white sticky top-24 border border-slate-800">
                        <h3 className="text-lg font-black mb-5 flex items-center justify-center gap-2 text-blue-300 border-b border-slate-800 pb-4 uppercase tracking-wider">
                            Liquidación del Préstamo
                        </h3>
                        <div className="space-y-4 text-sm font-medium">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between text-slate-300">
                                    <span>Cliente:</span>
                                    <span className="font-bold text-white truncate max-w-[150px]">{cSeleccionado?.nombre_completo || '---'}</span>
                                </div>
                            </div>

                            <div className="space-y-3 px-2 text-sm">
                                <div className="flex justify-between text-slate-300 text-base">
                                    <span>Capital a Prestar</span>
                                    <span className="font-bold text-red-400">-$ {formatMoney(capPrestadoArs)}</span>
                                </div>
                                <div className="flex justify-between text-blue-400 pt-2 border-t border-slate-700/50 font-bold">
                                    <span>+ Intereses Generados</span>
                                    <span>$ {formatMoney(gananciaFinancieraArs)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-400 pt-2 border-t border-slate-700/50 font-black text-lg">
                                    <span>Total a Recuperar</span>
                                    <span>$ {formatMoney(totalADevolverArs)}</span>
                                </div>
                            </div>

                            <div className="mt-6 p-5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-center">
                                <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">Plan a Firmar (En Pesos)</p>
                                <p className="text-4xl font-black text-white">{cuotasN} <span className="text-xl">x</span> $ {formatMoney(valorCuotaArs)}</p>
                                <p className="text-xs text-blue-200 mt-3 font-bold">Inicia: {new Date(fechaPrimerCuota).toLocaleDateString('es-AR')}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleProcesarPrestamo}
                            disabled={isSubmitting || capPrestadoArs <= 0 || !cSeleccionado}
                            className="w-full mt-6 bg-blue-500 hover:bg-blue-400 text-slate-900 py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:shadow-none"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar y Otorgar Préstamo'} <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}