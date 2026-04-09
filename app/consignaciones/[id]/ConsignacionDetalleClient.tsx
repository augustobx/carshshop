'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { liquidarConsignacion } from '@/actions/consignaciones';
import { ArrowLeft, CarFront, UserRound, Banknote, Percent, CheckCircle2, Clock, FileText, BadgeDollarSign, Loader2, ArrowRight } from 'lucide-react';

export default function ConsignacionDetalleClient({ vehiculo }: { vehiculo: any }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const { dolarBlue } = useConfigStore();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isVendido = vehiculo.estado === 'VENDIDO';
    const ventaFinal = isVendido && vehiculo.ventas?.length > 0 ? vehiculo.ventas[0] : null;

    // Matemática del negocio
    const precioPublicoArs = vehiculo.precio_venta_ars;
    const comisionPct = vehiculo.comision_consignacion_pct;
    const gananciaAgenciaArs = precioPublicoArs * (comisionPct / 100);
    const liquidoParaDuenoArs = precioPublicoArs - gananciaAgenciaArs;

    const handleLiquidarDueno = async () => {
        if (!confirm(`¿Confirmás el pago de $ ${formatMoney(liquidoParaDuenoArs)} a ${vehiculo.cliente?.nombre_completo}? Esto registrará un egreso en la Caja.`)) return;

        setIsSubmitting(true);
        const descripcion = `Liquidación Consignación: ${vehiculo.marca} ${vehiculo.modelo} [${vehiculo.patente}] a ${vehiculo.cliente?.nombre_completo}`;

        const res = await liquidarConsignacion(vehiculo.id_vehiculo, {
            monto_ars: liquidoParaDuenoArs,
            cotizacion_dolar: dolarBlue,
            descripcion
        });

        if (res.success) {
            alert('¡Liquidación registrada en Caja con éxito!');
            router.push('/caja');
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-fuchsia-100 rounded-xl text-fuchsia-700">
                        <CarFront className="w-8 h-8" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-800">{vehiculo.marca} {vehiculo.modelo}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isVendido ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200'}`}>
                                {vehiculo.estado.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-slate-500 mt-1 font-mono uppercase tracking-wider">
                            Patente: {vehiculo.patente} • {vehiculo.anio}
                        </p>
                    </div>
                </div>
                <Link href="/consignaciones" className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Volver a Consignaciones
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dueño y Comprador */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2 mb-4">
                            <UserRound className="w-4 h-4" /> Cliente Mandante (Dueño)
                        </h3>
                        {vehiculo.cliente ? (
                            <div>
                                <p className="text-xl font-black text-fuchsia-900">{vehiculo.cliente.nombre_completo}</p>
                                <div className="mt-3 space-y-2 text-sm font-medium text-slate-600">
                                    <div className="flex justify-between border-b border-slate-50 pb-2"><span>DNI:</span> <span className="font-bold">{vehiculo.cliente.dni || 'S/N'}</span></div>
                                    <div className="flex justify-between border-b border-slate-50 pb-2"><span>Teléfono:</span> <span className="font-bold text-indigo-600">{vehiculo.cliente.telefono || 'S/N'}</span></div>
                                    <div className="flex justify-between"><span>Ingreso:</span> <span className="font-bold">{new Date(vehiculo.fecha_ingreso).toLocaleDateString('es-AR')}</span></div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No hay dueño registrado.</p>
                        )}
                    </div>

                    {isVendido && ventaFinal && (
                        <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100">
                            <h3 className="text-sm font-bold text-emerald-600 uppercase flex items-center gap-2 mb-4">
                                <CheckCircle2 className="w-4 h-4" /> Vendido A
                            </h3>
                            <p className="text-lg font-black text-emerald-900">{ventaFinal.cliente?.nombre_completo}</p>
                            <div className="mt-3 space-y-2 text-sm font-medium text-emerald-800">
                                <div className="flex justify-between border-b border-emerald-200/50 pb-2"><span>Fecha Venta:</span> <span className="font-bold">{new Date(ventaFinal.fecha_venta).toLocaleDateString('es-AR')}</span></div>
                                <div className="flex justify-between"><span>Comprobante:</span> <Link href={`/ventas/${ventaFinal.id_venta}`} className="font-bold text-emerald-700 underline">VTA-{ventaFinal.id_venta}</Link></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hoja de Liquidación */}
                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800 text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><FileText className="w-32 h-32" /></div>

                    <h3 className="text-sm font-black text-fuchsia-400 uppercase tracking-widest mb-6 border-b border-slate-700 pb-3 relative z-10">
                        Hoja de Liquidación
                    </h3>

                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center text-slate-300">
                            <span>Precio Público Pactado (ARS)</span>
                            <span className="text-xl font-bold text-white">$ {formatMoney(precioPublicoArs)}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-300 pb-4 border-b border-slate-700/50">
                            <span className="flex items-center gap-1.5">Comisión Agencia <span className="bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded text-[10px] font-black">{comisionPct}%</span></span>
                            <span className="text-lg font-bold text-fuchsia-400">-$ {formatMoney(gananciaAgenciaArs)}</span>
                        </div>

                        <div className="pt-2">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">A rendirle al Dueño</p>
                            <p className="text-4xl font-black text-emerald-400">$ {formatMoney(liquidoParaDuenoArs)}</p>
                        </div>
                    </div>

                    {!isVendido ? (
                        <div className="mt-8 p-4 bg-slate-800 rounded-xl flex items-center justify-center gap-3 text-slate-400 font-bold border border-slate-700">
                            <Clock className="w-5 h-5" /> Esperando Venta del Vehículo
                        </div>
                    ) : (
                        <button
                            onClick={handleLiquidarDueno}
                            disabled={isSubmitting}
                            className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:shadow-none relative z-10"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Banknote className="w-5 h-5" />}
                            Liquidar Plata al Dueño
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}