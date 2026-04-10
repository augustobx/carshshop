'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { registrarMovimiento } from '@/actions/caja';
import { Wallet, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, Plus, Search, Calendar, CheckCircle2, Loader2, X, Receipt } from 'lucide-react';

export default function CajaClient({ transacciones }: { transacciones: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const { dolarBlue } = useConfigStore();
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState('');
    const [filtroMes, setFiltroMes] = useState('todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [concepto, setConcepto] = useState('');
    const [categoria, setCategoria] = useState('Mantenimiento Local');
    const [tipoMov, setTipoMov] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
    const [montoArs, setMontoArs] = useState('');

    // --- PROCESAMIENTO ULTRA SEGURO DE FECHAS ---
    // Mapeamos para garantizar que toda transacción tenga una "fechaSegura" pase lo que pase
    const txProcesadas = transacciones.map(tx => {
        let fechaSegura = new Date(); // Por defecto, hoy

        if (tx.fecha_str) {
            fechaSegura = new Date(tx.fecha_str);
        } else if (tx.fecha) {
            fechaSegura = new Date(tx.fecha);
        }

        return { ...tx, fechaSegura };
    });

    // --- FILTROS ---
    const txFiltradas = txProcesadas.filter(tx => {
        const matchBusqueda = tx.concepto.toLowerCase().includes(searchTerm.toLowerCase());
        let matchMes = true;
        if (filtroMes === 'este_mes') {
            const hoy = new Date();
            matchMes = tx.fechaSegura.getMonth() === hoy.getMonth() && tx.fechaSegura.getFullYear() === hoy.getFullYear();
        }
        return matchBusqueda && matchMes;
    });

    const totalIngresosArs = txFiltradas.filter(t => t.tipo === 'INGRESO').reduce((acc, t) => acc + t.monto_ars, 0);
    const totalEgresosArs = txFiltradas.filter(t => t.tipo === 'EGRESO').reduce((acc, t) => acc + t.monto_ars, 0);
    const saldoCajaArs = totalIngresosArs - totalEgresosArs;

    const handleGuardarMovimiento = async (e: React.FormEvent) => {
        e.preventDefault();
        const numMonto = parseFloat(montoArs);
        if (!concepto || numMonto <= 0) return alert('Completa los datos correctamente.');

        setIsSubmitting(true);
        const res = await registrarMovimiento({
            descripcion: concepto,
            categoria: categoria,
            tipo: tipoMov,
            monto_ars: numMonto,
            cotizacion_dia: dolarBlue
        });

        if (res.success) {
            setIsModalOpen(false);
            setConcepto(''); setMontoArs('');
            router.refresh();
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800">
                    <Wallet className="w-8 h-8 text-emerald-600" /> Tesorería y Flujo de Caja
                </h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-sm transition-colors">
                    <Plus className="w-5 h-5" /> Registrar Gasto / Ingreso
                </button>
            </div>

            {/* DASHBOARD DE SALDOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-24 h-24" /></div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Saldo Total Disponible (ARS)</p>
                    <p className={`text-4xl font-black relative z-10 ${saldoCajaArs >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                        $ {formatMoney(saldoCajaArs)}
                    </p>
                    <p className="text-sm font-bold text-slate-400 mt-2 relative z-10">~ U$S {formatMoney(saldoCajaArs / dolarBlue)}</p>
                </div>

                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-200/50 rounded-xl text-emerald-700"><TrendingUp className="w-8 h-8" /></div>
                    <div>
                        <p className="text-xs font-black text-emerald-600/70 uppercase tracking-widest mb-1">Total Ingresos</p>
                        <p className="text-2xl font-black text-emerald-800">$ {formatMoney(totalIngresosArs)}</p>
                    </div>
                </div>

                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-red-200/50 rounded-xl text-red-700"><TrendingDown className="w-8 h-8" /></div>
                    <div>
                        <p className="text-xs font-black text-red-600/70 uppercase tracking-widest mb-1">Total Egresos</p>
                        <p className="text-2xl font-black text-red-800">$ {formatMoney(totalEgresosArs)}</p>
                    </div>
                </div>
            </div>

            {/* TABLA DE MOVIMIENTOS CONTABLES */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Buscar concepto o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm font-medium" />
                    </div>
                    <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-auto">
                        <option value="todos">Todo el Historial</option>
                        <option value="este_mes">Solo Este Mes</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Concepto / Detalle</th>
                                <th className="px-6 py-4">Categoría / Origen</th>
                                <th className="px-6 py-4 text-right">Monto (ARS)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {txFiltradas.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">No hay movimientos registrados en este período.</td>
                                </tr>
                            ) : (
                                txFiltradas.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {/* Usamos fechaSegura garantizada */}
                                                {tx.fechaSegura.toLocaleDateString('es-AR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{tx.concepto}</p>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5 opacity-60">{tx.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
                                                {tx.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`flex items-center justify-end gap-1.5 font-black text-base ${tx.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {tx.tipo === 'INGRESO' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                $ {formatMoney(tx.monto_ars)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL PARA CARGAR GASTOS / INGRESOS MANUALES */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-slate-500" />
                                Registrar Movimiento
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200 rounded-md transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleGuardarMovimiento} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Movimiento</label>
                                <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    <button type="button" onClick={() => setTipoMov('EGRESO')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tipoMov === 'EGRESO' ? 'bg-red-500 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                        <TrendingDown className="w-4 h-4" /> Egreso (Salida)
                                    </button>
                                    <button type="button" onClick={() => setTipoMov('INGRESO')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tipoMov === 'INGRESO' ? 'bg-emerald-500 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                        <TrendingUp className="w-4 h-4" /> Ingreso (Entrada)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Concepto / Descripción *</label>
                                <input required type="text" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej: Pago de luz, Compra de insumos..." className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                                    <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium outline-none">
                                        <option value="Mantenimiento Local">Mantenimiento</option>
                                        <option value="Gestoria y Tramites">Gestoría</option>
                                        <option value="Sueldos">Sueldos</option>
                                        <option value="Servicios (Luz, Internet)">Servicios</option>
                                        <option value="Aporte Socios">Aporte Socios (Ingreso)</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto (ARS) *</label>
                                    <input required type="number" step="any" value={montoArs} onChange={e => setMontoArs(e.target.value)} placeholder="$ 0.00" className={`w-full p-2.5 border rounded-xl focus:ring-2 outline-none font-black text-lg ${tipoMov === 'EGRESO' ? 'border-red-300 focus:ring-red-500 text-red-700 bg-red-50' : 'border-emerald-300 focus:ring-emerald-500 text-emerald-700 bg-emerald-50'}`} />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}