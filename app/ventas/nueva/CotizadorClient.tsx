'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { registrarVenta } from '@/actions/ventas';
import { Calculator, CarFront, DollarSign, Banknote, Loader2, Search, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function CotizadorClient({ vehiculos, clientes }: { vehiculos: any[], clientes: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const router = useRouter();
    const { dolarBlue } = useConfigStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [vSearch, setVSearch] = useState('');
    const [cSearch, setCSearch] = useState('');
    const [showVSearch, setShowVSearch] = useState(false);
    const [showCSearch, setShowCSearch] = useState(false);

    const [vSeleccionado, setVSeleccionado] = useState<any>(null);
    const [cSeleccionado, setCSeleccionado] = useState<any>(null);
    const [formaPago, setFormaPago] = useState<'Contado' | 'Cuotas'>('Contado');

    const [precioArs, setPrecioArs] = useState('');
    const [precioUsd, setPrecioUsd] = useState('');
    const [anticipoArs, setAnticipoArs] = useState('');
    const [anticipoUsd, setAnticipoUsd] = useState('');

    const [cantCuotas, setCantCuotas] = useState('12');

    // Inicia con 1 mes exacto por delante
    const [fechaPrimerCuota, setFechaPrimerCuota] = useState(() => {
        const hoy = new Date();
        let m = hoy.getMonth() + 2; // +1 por base 0, +1 para el próximo mes
        let y = hoy.getFullYear();
        if (m > 12) { m -= 12; y += 1; }
        return `${y}-${String(m).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    });

    const [tnaAnual, setTnaAnual] = useState('48');
    const [interesDirecto, setInteresDirecto] = useState('');

    useEffect(() => {
        if (vSeleccionado && vSeleccionado.precio_sugerido_ars) {
            setPrecioArs(vSeleccionado.precio_sugerido_ars.toString());
            setPrecioUsd((vSeleccionado.precio_sugerido_ars / dolarBlue).toFixed(2));
        } else {
            setPrecioArs(''); setPrecioUsd('');
        }
    }, [vSeleccionado, dolarBlue]);

    const handlePrecioArs = (val: string) => {
        setPrecioArs(val);
        const num = parseFloat(val) || 0;
        setPrecioUsd(num > 0 ? (num / dolarBlue).toFixed(2) : '');
    };

    const handleAnticipoArs = (val: string) => {
        setAnticipoArs(val);
        const num = parseFloat(val) || 0;
        setAnticipoUsd(num > 0 ? (num / dolarBlue).toFixed(2) : '');
    };

    const vehiculosFiltrados = vehiculos.filter(v => `${v.nombre} ${v.patente}`.toLowerCase().includes(vSearch.toLowerCase()));
    const clientesFiltrados = clientes.filter(c => `${c.nombre_completo} ${c.dni || ''}`.toLowerCase().includes(cSearch.toLowerCase()));

    const pFinalArs = parseFloat(precioArs) || 0;
    const antArs = parseFloat(anticipoArs) || 0;
    const saldoAFinanciarArs = Math.max(0, pFinalArs - antArs);
    const cuotasN = parseInt(cantCuotas) || 1;
    const costoVehiculoArs = vSeleccionado?.precio_costo_ars || 0;

    let valorCuotaArs = 0;
    let totalFinanciadoArs = 0;
    let rentabilidadFinancieraArs = 0;

    if (formaPago === 'Cuotas' && saldoAFinanciarArs > 0) {
        if (tnaAnual && parseFloat(tnaAnual) > 0) {
            const r = (parseFloat(tnaAnual) / 100) / 12;
            valorCuotaArs = (saldoAFinanciarArs * r * Math.pow(1 + r, cuotasN)) / (Math.pow(1 + r, cuotasN) - 1);
            totalFinanciadoArs = valorCuotaArs * cuotasN;
        }
        else if (interesDirecto && parseFloat(interesDirecto) > 0) {
            const intDirecto = parseFloat(interesDirecto) / 100;
            totalFinanciadoArs = saldoAFinanciarArs * (1 + intDirecto);
            valorCuotaArs = totalFinanciadoArs / cuotasN;
        }
        else {
            totalFinanciadoArs = saldoAFinanciarArs;
            valorCuotaArs = saldoAFinanciarArs / cuotasN;
        }
        rentabilidadFinancieraArs = totalFinanciadoArs - saldoAFinanciarArs;
    }

    const gananciaVentaBrutaArs = pFinalArs - costoVehiculoArs;
    const gananciaTotalEstimadaArs = gananciaVentaBrutaArs + rentabilidadFinancieraArs;

    const handleProcesarVenta = async () => {
        if (!vSeleccionado || !cSeleccionado || pFinalArs <= 0) return alert('Completa Vehículo, Cliente y Precio.');
        if (formaPago === 'Cuotas' && antArs >= pFinalArs) return alert('El anticipo no puede ser mayor o igual al precio total.');

        setIsSubmitting(true);

        const pFinalUsd = parseFloat((pFinalArs / dolarBlue).toFixed(2));
        const cuotaUsd = parseFloat((valorCuotaArs / dolarBlue).toFixed(2));

        let planDePagos = [];
        if (formaPago === 'Cuotas') {
            planDePagos = Array.from({ length: cuotasN }).map((_, i) => {
                // LA SOLUCIÓN DEFINITIVA: Matemática pura, sin que Javascript calcule husos horarios
                const partes = fechaPrimerCuota.split('-');
                let year = parseInt(partes[0]);
                let month = parseInt(partes[1]) + i;
                const originalDay = parseInt(partes[2]);

                // Si pasamos de diciembre, avanzamos de año
                while (month > 12) {
                    month -= 12;
                    year += 1;
                }

                // Evita que el día 31 caiga en febrero o meses de 30 días
                const diasDelMes = new Date(year, month, 0).getDate();
                const diaSeguro = Math.min(originalDay, diasDelMes);

                const yStr = year.toString();
                const mStr = month.toString().padStart(2, '0');
                const dStr = diaSeguro.toString().padStart(2, '0');

                return {
                    numero_cuota: i + 1,
                    monto_usd: cuotaUsd,
                    // Armamos el texto exacto e inyectamos el mediodía universal
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

        if (res.success) router.push('/ventas');
        else { alert(res.error); setIsSubmitting(false); }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl"><Calculator className="w-8 h-8 text-emerald-700" /></div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cotizador y Nueva Venta</h1>
                    <p className="text-slate-500 font-medium mt-1">Arma la operación 100% en Pesos (ARS).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                            <CarFront className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-slate-800">1. Asignación de Operación</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Vehículo *</label>
                                {!vSeleccionado ? (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="Buscar por modelo o patente..." value={vSearch} onChange={e => { setVSearch(e.target.value); setShowVSearch(true) }} onFocus={() => setShowVSearch(true)} className="w-full pl-9 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm" />
                                        {showVSearch && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                {vehiculosFiltrados.map(v => (
                                                    <div key={v.id_vehiculo} onClick={() => { setVSeleccionado(v); setShowVSearch(false) }} className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 text-sm">
                                                        <div className="font-bold text-slate-800">{v.nombre}</div>
                                                        <div className="text-xs text-slate-500">Patente: {v.patente} • {v.estado}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-indigo-900 text-sm">{vSeleccionado.nombre}</div>
                                            <div className="text-xs text-indigo-700/70">{vSeleccionado.patente}</div>
                                        </div>
                                        <button onClick={() => setVSeleccionado(null)} className="text-indigo-600 hover:underline text-xs font-bold">Cambiar</button>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between mb-1">
                                    <span>Cliente *</span>
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
                                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-emerald-900 text-sm">{cSeleccionado.nombre_completo}</div>
                                            <div className="text-xs text-emerald-700/70">DNI: {cSeleccionado.dni || 'S/N'}</div>
                                        </div>
                                        <button onClick={() => setCSeleccionado(null)} className="text-emerald-600 hover:underline text-xs font-bold">Cambiar</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                            <Banknote className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-lg font-bold text-slate-800">2. Precio Final (ARS) y Modalidad</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                            <div>
                                <label className="text-xs font-black text-emerald-800 uppercase mb-2 block">Valor Final Pactado en Pesos *</label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-3.5 w-5 h-5 text-emerald-600" />
                                    <input type="number" step="any" value={precioArs} onChange={e => handlePrecioArs(e.target.value)} className="w-full pl-10 p-3 border border-emerald-400 bg-white rounded-xl focus:ring-2 focus:ring-emerald-600 font-black text-emerald-900 text-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Referencia en Dólares</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                    <input type="text" disabled value={precioUsd} className="w-full pl-10 p-3 border border-slate-200 bg-slate-100 rounded-xl font-bold text-slate-500" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                <button onClick={() => setFormaPago('Contado')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${formaPago === 'Contado' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Pago de Contado</button>
                                <button onClick={() => setFormaPago('Cuotas')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${formaPago === 'Cuotas' ? 'bg-indigo-600 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}>Financiado (Cuotas)</button>
                            </div>
                        </div>
                    </div>

                    {formaPago === 'Cuotas' && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-lg font-bold text-slate-800">3. Configuración de Cuotas (ARS)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-xs font-bold text-indigo-700 uppercase mb-1 block">Anticipo Entregado (ARS)</label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-3 w-4 h-4 text-indigo-500" />
                                        <input type="number" step="any" value={anticipoArs} onChange={e => handleAnticipoArs(e.target.value)} className="w-full pl-9 p-2.5 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold bg-indigo-50/50" />
                                    </div>
                                    {anticipoUsd && <span className="text-[10px] text-slate-400 mt-1 block">~ U$S {anticipoUsd}</span>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Saldo a Financiar (ARS)</label>
                                    <input type="text" disabled value={`$ ${saldoAFinanciarArs.toLocaleString('es-AR')}`} className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-xl font-bold text-slate-600" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cantidad de Cuotas</label>
                                    <input type="number" value={cantCuotas} onChange={e => setCantCuotas(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vencimiento 1ra Cuota</label>
                                    <input type="date" value={fechaPrimerCuota} onChange={e => setFechaPrimerCuota(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold" />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-700 mb-4">Tasas de Financiación</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">TNA Anual (%)</label>
                                        <input type="number" step="any" value={tnaAnual} onChange={e => { setTnaAnual(e.target.value); setInteresDirecto('') }} className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-indigo-700" placeholder="Ej: 48" />
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
                    )}
                </div>

                <div className="xl:col-span-4 space-y-6 relative">
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white sticky top-24 border border-slate-800">
                        <h3 className="text-lg font-black mb-5 flex items-center justify-center gap-2 text-indigo-300 border-b border-slate-800 pb-4 uppercase tracking-wider">
                            Hoja de Negocio (ARS)
                        </h3>
                        <div className="space-y-4 text-sm font-medium">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-2">
                                <div className="flex justify-between text-slate-300">
                                    <span>Vehículo:</span>
                                    <span className="font-bold text-white truncate max-w-[150px]">{vSeleccionado?.nombre || '---'}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Cliente:</span>
                                    <span className="font-bold text-white truncate max-w-[150px]">{cSeleccionado?.nombre_completo || '---'}</span>
                                </div>
                            </div>

                            <div className="space-y-2 px-2 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>Costo Inventario</span>
                                    <span>$ {formatMoney(costoVehiculoArs)}</span>
                                </div>
                                <div className="flex justify-between text-slate-200 text-base">
                                    <span>Precio Venta Pactado</span>
                                    <span className="font-bold text-white">$ {formatMoney(pFinalArs)}</span>
                                </div>

                                {formaPago === 'Cuotas' && (
                                    <>
                                        <div className="flex justify-between text-red-400 pt-2 border-t border-slate-700/50">
                                            <span>- Anticipo Entregado</span>
                                            <span className="font-bold">$ {formatMoney(antArs)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-400">
                                            <span>Capital a Financiar</span>
                                            <span>$ {formatMoney(saldoAFinanciarArs)}</span>
                                        </div>
                                        <div className="flex justify-between text-indigo-400 pt-2">
                                            <span>+ Intereses Financiación</span>
                                            <span className="font-bold">$ {formatMoney(rentabilidadFinancieraArs)}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-xl space-y-2">
                                <div className="flex justify-between text-xs text-emerald-400/80 uppercase font-black tracking-wider mb-2 border-b border-emerald-900/50 pb-2">
                                    Rentabilidad Estimada
                                </div>
                                <div className="flex justify-between text-emerald-100">
                                    <span>Por Venta de Fierro</span>
                                    <span>$ {formatMoney(gananciaVentaBrutaArs)}</span>
                                </div>
                                {formaPago === 'Cuotas' && (
                                    <div className="flex justify-between text-emerald-100">
                                        <span>Por Intereses (Financiero)</span>
                                        <span>$ {formatMoney(rentabilidadFinancieraArs)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-emerald-400 font-black text-lg pt-2 border-t border-emerald-900/50">
                                    <span>Total Final a Ganar</span>
                                    <span>$ {formatMoney(gananciaTotalEstimadaArs)}</span>
                                </div>
                            </div>

                            {formaPago === 'Cuotas' ? (
                                <div className="mt-6 p-5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-center">
                                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Plan a Firmar (En Pesos)</p>
                                    <p className="text-3xl font-black text-white">{cuotasN} <span className="text-lg">x</span> $ {formatMoney(valorCuotaArs)}</p>
                                    <p className="text-xs text-indigo-200 mt-2">Total Contrato: $ {formatMoney(totalFinanciadoArs)}</p>
                                </div>
                            ) : (
                                <div className="mt-6 p-5 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-center">
                                    <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">A Cobrar Hoy</p>
                                    <p className="text-4xl font-black text-white">$ {formatMoney(pFinalArs)}</p>
                                    <p className="text-sm font-bold text-emerald-500 mt-2">~ U$S {formatMoney(pFinalArs / dolarBlue)} USD</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleProcesarVenta}
                            disabled={isSubmitting || pFinalArs <= 0 || !vSeleccionado || !cSeleccionado}
                            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar y Facturar'} <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}