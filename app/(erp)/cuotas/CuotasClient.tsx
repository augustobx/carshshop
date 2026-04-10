'use client';

import { useState, Fragment, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { registrarPagoCuota, registrarPagoCuotaPrestamo } from '@/actions/cuotas';
import {
    User, Car, ChevronDown, ChevronUp, Banknote,
    MessageCircle, Calendar, CheckCircle2, AlertTriangle,
    Search, Clock, HandCoins
} from 'lucide-react';

export default function CuotasClient({ carteraInicial }: { carteraInicial: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    const { dolarBlue } = useConfigStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Leemos la URL: Si venimos de otra pantalla con ?q=Cliente, el buscador arranca filtrado
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOperacion, setExpandedOperacion] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const query = searchParams.get('q');
        if (query) setSearchTerm(query);
    }, [searchParams]);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // --- PROCESAMIENTO DE CARTERA UNIFICADA ---
    const cartera = carteraInicial.map(op => {
        const cuotasPendientes = op.cuotas.filter((c: any) => c.estado === 'PENDIENTE');
        const cuotasVencidas = cuotasPendientes.filter((c: any) => c.fecha_vto_str && new Date(c.fecha_vto_str) < hoy);

        const totalDeudaUsd = cuotasPendientes.reduce((sum: number, c: any) => sum + c.monto_usd, 0);
        const totalPagadoUsd = op.cuotas.filter((c: any) => c.estado === 'PAGADA').reduce((sum: number, c: any) => sum + c.monto_usd, 0);

        const proximoVto = cuotasPendientes.length > 0 ? new Date(cuotasPendientes[0].fecha_vto_str) : null;

        return {
            ...op,
            resumen: {
                deudaUsd: totalDeudaUsd,
                pagadoUsd: totalPagadoUsd,
                cantidadPendiente: cuotasPendientes.length,
                enMora: cuotasVencidas.length > 0,
                proximoVto
            }
        };
    }).filter(op =>
        op.cliente?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.detalle_operacion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- ACCIONES ---
    const toggleRow = (id: string) => setExpandedOperacion(expandedOperacion === id ? null : id);

    const handlePagar = async (cuota: any, tipo_operacion: string) => {
        const montoArs = cuota.monto_usd * dolarBlue;
        if (!confirm(`¿Registrar pago de $${formatMoney(montoArs)} (U$S ${cuota.monto_usd})?`)) return;

        setIsSubmitting(true);
        let res;

        // Ruteo inteligente: ¿Es auto o es préstamo?
        if (tipo_operacion === 'VENTA') {
            res = await registrarPagoCuota(cuota.id_cuota_real, { monto_cobrado_ars: montoArs, cotizacion_dia: dolarBlue });
        } else {
            res = await registrarPagoCuotaPrestamo(cuota.id_cuota_real, { monto_cobrado_ars: montoArs, cotizacion_dia: dolarBlue });
        }

        if (res.success) router.refresh();
        else alert(res.error);
        setIsSubmitting(false);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <Clock className="w-8 h-8 text-indigo-600" /> Cartera General de Cobranzas
            </h1>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, patente o número de préstamo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                    />
                </div>
                <div className="text-sm font-bold text-slate-500 px-4 border-l">
                    {cartera.length} Operaciones
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b">
                        <tr>
                            <th className="px-6 py-4">Cliente / Operación</th>
                            <th className="px-6 py-4">Estado de Cuenta (USD)</th>
                            <th className="px-6 py-4">Próximo Vto.</th>
                            <th className="px-6 py-4 text-center">Cuotas</th>
                            <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {cartera.map((op) => (
                            <Fragment key={op.id_operacion}>
                                <tr
                                    onClick={() => toggleRow(op.id_operacion)}
                                    className={`cursor-pointer transition-colors ${op.resumen.enMora ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-slate-50'}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${op.resumen.enMora ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {op.cliente?.nombre_completo.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-base">{op.cliente?.nombre_completo}</p>
                                                <div className="flex items-center gap-1 text-xs font-bold mt-0.5">
                                                    {op.tipo_operacion === 'VENTA' ? <Car className="w-3.5 h-3.5 text-indigo-500" /> : <HandCoins className="w-3.5 h-3.5 text-blue-500" />}
                                                    <span className={op.tipo_operacion === 'VENTA' ? 'text-indigo-600' : 'text-blue-600'}>
                                                        {op.detalle_operacion}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between w-40 text-xs font-bold">
                                                <span className="text-slate-400 uppercase">Saldo:</span>
                                                <span className="text-slate-900">U$S {formatMoney(op.resumen.deudaUsd)}</span>
                                            </div>
                                            <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                                <div
                                                    className="bg-emerald-500 h-full"
                                                    style={{ width: `${op.resumen.deudaUsd + op.resumen.pagadoUsd > 0 ? (op.resumen.pagadoUsd / (op.resumen.pagadoUsd + op.resumen.deudaUsd)) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {op.resumen.proximoVto ? (
                                            <div className={`flex items-center gap-2 font-bold ${op.resumen.enMora ? 'text-red-600' : 'text-slate-700'}`}>
                                                <Calendar className="w-4 h-4 opacity-50" />
                                                {op.resumen.proximoVto.toLocaleDateString('es-AR')}
                                                {op.resumen.enMora && <AlertTriangle className="w-4 h-4 animate-pulse" />}
                                            </div>
                                        ) : (
                                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4" /> Finalizado
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-white border px-3 py-1 rounded-full font-black text-xs text-slate-600">
                                            {op.cuotas.length - op.resumen.cantidadPendiente} / {op.cuotas.length}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {expandedOperacion === op.id_operacion ? <ChevronUp /> : <ChevronDown />}
                                    </td>
                                </tr>

                                {/* DETALLE DESPLEGABLE DE CUOTAS */}
                                {expandedOperacion === op.id_operacion && (
                                    <tr>
                                        <td colSpan={5} className="bg-slate-50/80 p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {op.cuotas.map((c: any) => {
                                                    const isVencida = c.estado === 'PENDIENTE' && c.fecha_vto_str && new Date(c.fecha_vto_str) < hoy;
                                                    const montoHoyArs = c.monto_usd * dolarBlue;

                                                    return (
                                                        <div key={c.id_cuota_real} className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${c.estado === 'PAGADA' ? 'bg-emerald-50 border-emerald-100 opacity-70' : isVencida ? 'bg-white border-red-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cuota {c.numero_cuota}</p>
                                                                    <p className={`text-sm font-bold ${isVencida ? 'text-red-600' : 'text-slate-700'}`}>
                                                                        Vto: {c.fecha_vto_str ? new Date(c.fecha_vto_str).toLocaleDateString('es-AR') : 'N/A'}
                                                                    </p>
                                                                </div>
                                                                {c.estado === 'PAGADA' ? (
                                                                    <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                                                                ) : isVencida ? (
                                                                    <AlertTriangle className="text-red-500 w-5 h-5" />
                                                                ) : <Clock className="text-slate-300 w-5 h-5" />}
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-2xl font-black text-slate-800">$ {formatMoney(montoHoyArs)}</p>
                                                                <p className="text-xs font-bold text-slate-400">Ref: U$S {c.monto_usd}</p>
                                                            </div>

                                                            {c.estado === 'PENDIENTE' && (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handlePagar(c, op.tipo_operacion)}
                                                                        disabled={isSubmitting}
                                                                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                                                                    >
                                                                        <Banknote className="w-3.5 h-3.5" /> Cobrar
                                                                    </button>
                                                                    <button className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                                                                        <MessageCircle className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {c.estado === 'PAGADA' && (
                                                                <p className="text-[10px] font-bold text-emerald-700 mt-2 italic">
                                                                    Cobrada el {c.fecha_pago_str ? new Date(c.fecha_pago_str).toLocaleDateString('es-AR') : 'N/A'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}