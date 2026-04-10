'use client';

import Link from "next/link";
import { ArrowLeft, Receipt, Calendar, CarFront, UserRound, Banknote, DollarSign, CheckCircle2, AlertTriangle, TrendingUp, MapPin, Phone, Mail } from "lucide-react";

export default function VentaDetalleClient({ venta }: { venta: any }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const pFinalUsd = venta.precio_final_usd;
    const cotizacionBase = venta.cotizacion_dolar_venta;
    const pFinalArs = pFinalUsd * cotizacionBase;

    const costoVehiculoUsd = venta.vehiculo?.precio_compra_usd || 0;
    const gananciaBrutaFierro = pFinalUsd - costoVehiculoUsd;

    // Métricas si es financiado
    const esCuotas = venta.forma_pago === 'Cuotas';
    const totalFinanciadoUsd = esCuotas ? venta.cuotas.reduce((sum: number, c: any) => sum + c.monto_usd, 0) : 0;
    const anticipoEstimadoUsd = esCuotas ? Math.max(0, pFinalUsd - totalFinanciadoUsd) : pFinalUsd; // Lo que no se financió, se asume como anticipo o pago inicial
    const cuotasPagadas = esCuotas ? venta.cuotas.filter((c: any) => c.estado === 'PAGADA').length : 0;
    const totalCobradoCuotasArs = esCuotas ? venta.cuotas.filter((c: any) => c.estado === 'PAGADA').reduce((sum: number, c: any) => sum + Number(c.monto_pagado_ars), 0) : 0;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-100 rounded-xl text-indigo-700">
                        <Receipt className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-800">Operación #{venta.id_venta}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${esCuotas ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                {venta.forma_pago}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Realizada el {new Date(venta.fecha_venta).toLocaleDateString('es-AR')} a las {new Date(venta.fecha_venta).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <Link href="/ventas" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver al Historial
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COLUMNA IZQUIERDA: RESUMEN FINANCIERO */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 rounded-2xl p-6 shadow-xl text-white border border-slate-800">
                        <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-6 border-b border-slate-700 pb-3">Resumen Contable</h3>

                        <div className="space-y-5">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Venta (Dólar Base)</p>
                                <p className="text-3xl font-black text-white">U$S {formatMoney(pFinalUsd)}</p>
                                <p className="text-sm font-bold text-emerald-400 mt-1">~ $ {formatMoney(pFinalArs)} ARS</p>
                            </div>

                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-2 text-sm">
                                <div className="flex justify-between text-slate-300">
                                    <span>Cotización Tomada</span>
                                    <span className="font-mono text-white">$ {cotizacionBase} / USD</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Costo Inventario</span>
                                    <span className="font-mono text-white">U$S {formatMoney(costoVehiculoUsd)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-300 pt-2 border-t border-slate-700/50 font-bold">
                                    <span>Ganancia Bruta (Fierro)</span>
                                    <span>U$S {formatMoney(gananciaBrutaFierro)}</span>
                                </div>
                            </div>

                            {esCuotas && (
                                <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-900/50 space-y-2 text-sm">
                                    <p className="text-xs font-black text-indigo-300 uppercase mb-2">Estructura de Financiación</p>
                                    <div className="flex justify-between text-slate-300">
                                        <span>Anticipo (Aprox)</span>
                                        <span className="font-mono text-white">U$S {formatMoney(anticipoEstimadoUsd)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-300">
                                        <span>Capital Financiado</span>
                                        <span className="font-mono text-white">U$S {formatMoney(totalFinanciadoUsd)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: DATOS Y CUOTAS */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Tarjetas de Vehículo y Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Vehículo */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2 mb-4"><CarFront className="w-4 h-4" /> Vehículo Entregado</h3>
                            {venta.vehiculo ? (
                                <div>
                                    <p className="text-xl font-black text-slate-800">{venta.vehiculo.marca} {venta.vehiculo.modelo}</p>
                                    <div className="mt-3 space-y-1.5 text-sm font-medium text-slate-600">
                                        <div className="flex justify-between"><span>Patente:</span> <span className="uppercase font-mono font-bold bg-slate-100 px-2 rounded text-slate-800">{venta.vehiculo.patente}</span></div>
                                        <div className="flex justify-between"><span>Año:</span> <span>{venta.vehiculo.anio}</span></div>
                                        <div className="flex justify-between"><span>Kilómetros:</span> <span>{formatMoney(venta.vehiculo.km)} km</span></div>
                                        <div className="flex justify-between"><span>Chasis (VIN):</span> <span className="font-mono text-xs">{venta.vehiculo.vin || 'N/A'}</span></div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                                        <Link href={`/vehiculos/${venta.id_vehiculo}`} className="text-indigo-600 text-sm font-bold hover:underline">Ver ficha técnica completa</Link>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">Datos del vehículo no disponibles.</p>
                            )}
                        </div>

                        {/* Cliente */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2 mb-4"><UserRound className="w-4 h-4" /> Datos del Comprador</h3>
                            {venta.cliente ? (
                                <div>
                                    <p className="text-xl font-black text-slate-800">{venta.cliente.nombre_completo}</p>
                                    <div className="mt-3 space-y-2 text-sm font-medium text-slate-600">
                                        {/* CORRECCIÓN APLICADA: divs en lugar de ps */}
                                        <div className="flex items-center gap-2"><span className="w-4 text-center text-[10px] font-black uppercase text-slate-400">ID</span> <span className="font-mono font-bold text-slate-800">{venta.cliente.dni || 'S/N'}</span></div>
                                        <div className="flex items-center gap-2 text-indigo-600"><Phone className="w-4 h-4" /> {venta.cliente.telefono || 'Sin teléfono'}</div>
                                        <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {venta.cliente.email || 'Sin correo'}</div>
                                        <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> <span className="line-clamp-2">{venta.cliente.domicilio || 'Sin domicilio registrado'}</span></div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">Datos del cliente no disponibles.</p>
                            )}
                        </div>
                    </div>

                    {/* PLAN DE PAGOS (SI HAY CUOTAS) */}
                    {esCuotas && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Plan de Pagos Financiado</h3>
                                <div className="text-sm font-bold text-slate-500">
                                    Progreso: {cuotasPagadas} / {venta.cuotas.length} Cuotas
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b">
                                        <tr>
                                            <th className="px-5 py-3">N° Cuota</th>
                                            <th className="px-5 py-3">Vencimiento</th>
                                            <th className="px-5 py-3 text-right">Monto Base (USD)</th>
                                            <th className="px-5 py-3 text-center">Estado</th>
                                            <th className="px-5 py-3 text-right">Cobrado (ARS Histórico)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {venta.cuotas.map((c: any) => {
                                            const hoy = new Date();
                                            hoy.setHours(0, 0, 0, 0);
                                            const isVencida = c.estado === 'PENDIENTE' && new Date(c.fecha_vencimiento) < hoy;

                                            return (
                                                <tr key={c.id_cuota} className={`hover:bg-slate-50 transition-colors ${c.estado === 'PAGADA' ? 'bg-emerald-50/30' : isVencida ? 'bg-red-50/30' : ''}`}>
                                                    <td className="px-5 py-3 font-black text-slate-700">Cuota {c.numero_cuota}</td>
                                                    <td className="px-5 py-3 font-medium text-slate-600">{new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}</td>
                                                    <td className="px-5 py-3 text-right font-bold text-slate-800">U$S {formatMoney(c.monto_usd)}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        {c.estado === 'PAGADA' ? (
                                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase"><CheckCircle2 className="w-3 h-3" /> Pagada</span>
                                                        ) : isVencida ? (
                                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase"><AlertTriangle className="w-3 h-3" /> Vencida</span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">Pendiente</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        {c.estado === 'PAGADA' ? (
                                                            <div>
                                                                <div className="font-bold text-emerald-700">$ {formatMoney(c.monto_pagado_ars)}</div>
                                                                <div className="text-[10px] text-slate-400 mt-0.5">Tomado a $ {c.cotizacion_pago} el {new Date(c.fecha_pago).toLocaleDateString('es-AR')}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {cuotasPagadas > 0 && (
                                        <tfoot className="bg-slate-50 border-t border-slate-200">
                                            <tr>
                                                <td colSpan={4} className="px-5 py-4 text-right font-bold text-slate-600">Total recaudado en cuotas hasta hoy:</td>
                                                <td className="px-5 py-4 text-right font-black text-emerald-700 text-base">$ {formatMoney(totalCobradoCuotasArs)} ARS</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}