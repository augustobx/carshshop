'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useConfigStore } from '@/store/useConfigStore';
import { HandCoins, Plus, Search, TrendingUp, UserRound, Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight, Banknote } from 'lucide-react';

export default function PrestamosClient({ prestamos }: { prestamos: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const { dolarBlue } = useConfigStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'ACTIVOS' | 'FINALIZADOS'>('ACTIVOS');

    // --- PROCESAMIENTO Y ACTUALIZACIÓN AL DÓLAR DE HOY ---
    const cartera = prestamos.map(p => {
        const fechaReal = new Date(p.fecha_str);

        // Cuotas
        const cuotasPagadas = p.cuotas.filter((c: any) => c.estado === 'PAGADA');
        const cuotasPendientes = p.cuotas.filter((c: any) => c.estado === 'PENDIENTE');

        // Capital recuperado vs Deuda viva (en USD para no perder frente a inflación)
        const capitalRecuperadoUsd = cuotasPagadas.reduce((sum: number, c: any) => sum + c.monto_usd, 0);
        const capitalPendienteUsd = cuotasPendientes.reduce((sum: number, c: any) => sum + c.monto_usd, 0);

        // Conversión inteligente al ARS de HOY
        const capitalPendienteArsHoy = capitalPendienteUsd * dolarBlue;
        const gananciaEsperadaUsd = p.total_devolver_usd - p.capital_entregado_usd;

        return {
            ...p,
            fechaReal,
            resumen: {
                cuotasPagadas: cuotasPagadas.length,
                totalCuotas: p.cuotas.length,
                porcentajePago: (cuotasPagadas.length / (p.cuotas.length || 1)) * 100,
                capitalRecuperadoUsd,
                capitalPendienteUsd,
                capitalPendienteArsHoy,
                gananciaEsperadaUsd
            }
        };
    });

    // Filtros
    const prestamosFiltrados = cartera.filter(p => {
        const matchBusqueda = p.cliente?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.cliente?.dni && p.cliente.dni.includes(searchTerm));
        const matchEstado = filtroEstado === 'ACTIVOS' ? p.estado === 'ACTIVO' : p.estado === 'FINALIZADO';
        return matchBusqueda && matchEstado;
    });

    // KPIs Globales (Solo de los Activos)
    const activos = cartera.filter(p => p.estado === 'ACTIVO');
    const totalCapitalCalleArs = activos.reduce((sum, p) => sum + p.resumen.capitalPendienteArsHoy, 0);
    const totalGananciaEsperadaArs = activos.reduce((sum, p) => sum + (p.resumen.gananciaEsperadaUsd * dolarBlue), 0);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800">
                    <HandCoins className="w-8 h-8 text-blue-600" /> Cartera de Préstamos
                </h1>
                <Link href="/prestamos/nuevo" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-colors">
                    <Plus className="w-5 h-5" /> Nuevo Préstamo
                </Link>
            </div>

            {/* DASHBOARD FINANCIERO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Banknote className="w-24 h-24" /></div>
                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 relative z-10">Capital Vivo en la Calle (ARS)</p>
                    <p className="text-4xl font-black relative z-10">$ {formatMoney(totalCapitalCalleArs)}</p>
                    <p className="text-sm font-bold text-slate-400 mt-2 relative z-10">Actualizado a Cotización de Hoy</p>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-200/50 rounded-xl text-blue-700"><TrendingUp className="w-8 h-8" /></div>
                    <div>
                        <p className="text-xs font-black text-blue-600/70 uppercase tracking-widest mb-1">Intereses a Cobrar (ARS)</p>
                        <p className="text-2xl font-black text-blue-800">$ {formatMoney(totalGananciaEsperadaArs)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-slate-100 rounded-xl text-slate-600"><UserRound className="w-8 h-8" /></div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Créditos Activos</p>
                        <p className="text-2xl font-black text-slate-800">{activos.length} Clientes</p>
                    </div>
                </div>
            </div>

            {/* PANEL PRINCIPAL */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Buscar prestatario o DNI..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium" />
                    </div>

                    <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
                        <button onClick={() => setFiltroEstado('ACTIVOS')} className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filtroEstado === 'ACTIVOS' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
                            Créditos Activos
                        </button>
                        <button onClick={() => setFiltroEstado('FINALIZADOS')} className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filtroEstado === 'FINALIZADOS' ? 'bg-emerald-500 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                            Finalizados
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b">
                            <tr>
                                <th className="px-6 py-4">Otorgamiento</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Deuda Actualizada (ARS)</th>
                                <th className="px-6 py-4">Progreso de Pago</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {prestamosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No hay préstamos en este estado.</td>
                                </tr>
                            ) : (
                                prestamosFiltrados.map((p) => (
                                    <tr key={p.id_prestamo} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {p.fechaReal.toLocaleDateString('es-AR')}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-1">ID: #{p.id_prestamo}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900 text-base">{p.cliente?.nombre_completo}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">DNI: {p.cliente?.dni || 'S/N'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-lg text-blue-700">
                                                $ {formatMoney(p.resumen.capitalPendienteArsHoy)}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400">
                                                Capital Original: U$S {p.capital_entregado_usd}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-48 space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-slate-600">
                                                    <span>{p.resumen.cuotasPagadas} / {p.resumen.totalCuotas} Cuotas</span>
                                                    <span>{Math.round(p.resumen.porcentajePago)}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${p.resumen.porcentajePago === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${p.resumen.porcentajePago}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* Los mandamos a la cartera general de cobranzas. */}
                                            <Link href={`/cuotas?q=${encodeURIComponent(p.cliente?.nombre_completo || '')}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-100">
                                                Gestionar Cobro <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}