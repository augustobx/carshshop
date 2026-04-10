'use client';

import Link from "next/link";
import { Plus, BadgeDollarSign, FileText, Calendar, CheckCircle2, Clock, CarFront, UserRound } from "lucide-react";

export default function VentasClient({ ventas }: { ventas: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });

    // Cálculos rápidos para los KPIs del encabezado
    const totalVentasUsd = ventas.reduce((sum, v) => sum + Number(v.precio_final_usd), 0);

    const capitalEnCalleUsd = ventas.reduce((sum, v) => {
        if (v.forma_pago !== 'Cuotas') return sum;
        const pendiente = v.cuotas.filter((c: any) => c.estado === 'PENDIENTE')
            .reduce((cSum: number, c: any) => cSum + Number(c.monto_usd), 0);
        return sum + pendiente;
    }, 0);

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                    <BadgeDollarSign className="w-8 h-8 text-emerald-600" /> Gestión de Ventas
                </h1>
                <Link href="/ventas/nueva" className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm transition-colors">
                    <Plus className="w-5 h-5" /> Nueva Venta / Cotizador
                </Link>
            </div>

            {/* Tarjetas de Resumen (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-emerald-100 rounded-xl text-emerald-700">
                        <BadgeDollarSign className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Volumen Histórico Facturado</p>
                        <p className="text-3xl font-black text-slate-800">U$S {formatMoney(totalVentasUsd)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className="p-4 bg-indigo-100 rounded-xl text-indigo-700">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Capital a Cobrar (Cuotas Pendientes)</p>
                        <p className="text-3xl font-black text-indigo-700">U$S {formatMoney(capitalEnCalleUsd)}</p>
                    </div>
                </div>
            </div>

            {/* Tabla de Ventas Históricas */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Historial de Operaciones</h3>
                    <div className="text-sm font-bold text-slate-500">Total: {ventas.length} registros</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-4">Fecha / Operación</th>
                                <th className="px-6 py-4">Vehículo</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4 text-right">Monto Final</th>
                                <th className="px-6 py-4 text-center">Modalidad</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {ventas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Todavía no hay ventas registradas. ¡Hora de usar el cotizador!
                                    </td>
                                </tr>
                            ) : (
                                ventas.map((v) => {
                                    // Cálculo de progreso si es financiado
                                    const cuotasTotales = v.cuotas.length;
                                    const cuotasPagadas = v.cuotas.filter((c: any) => c.estado === 'PAGADA').length;
                                    const historialArs = Number(v.precio_final_usd) * Number(v.cotizacion_dolar_venta);

                                    return (
                                        <tr key={v.id_venta} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-medium text-slate-900">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {new Date(v.fecha_venta).toLocaleDateString('es-AR')}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1 font-mono">OP #{v.id_venta}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <CarFront className="w-4 h-4 text-indigo-500" />
                                                    <span className="font-bold text-slate-800">{v.vehiculo?.marca} {v.vehiculo?.modelo}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 uppercase mt-1">{v.vehiculo?.patente || 'S/N'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                    <UserRound className="w-4 h-4 text-slate-400" />
                                                    {v.cliente?.nombre_completo}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-black text-emerald-700">U$S {formatMoney(Number(v.precio_final_usd))}</div>
                                                <div className="text-[10px] text-slate-400 font-medium mt-0.5">Histórico: $ {formatMoney(historialArs)} ARS</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {v.forma_pago === 'Contado' ? (
                                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Contado
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-100">
                                                            Financiado
                                                        </span>
                                                        <span className={`text-[10px] font-black tracking-wide ${cuotasPagadas === cuotasTotales ? 'text-emerald-500' : 'text-slate-500'}`}>
                                                            {cuotasPagadas} / {cuotasTotales} PAGAS
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/ventas/${v.id_venta}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition-colors">
                                                    <FileText className="w-3.5 h-3.5" /> Detalle Completo
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}