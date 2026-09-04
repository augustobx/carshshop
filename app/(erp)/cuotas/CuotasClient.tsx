'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { registrarPagoCuota, registrarPagoCuotaPrestamo } from '@/actions/cuotas';
import { Banknote, Calendar, CheckCircle2, AlertTriangle, Search, Clock, HandCoins, Car, ChevronDown, ChevronUp } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function CuotasClient({ carteraInicial, dolarActual }: { carteraInicial: any[]; dolarActual: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { const q = searchParams.get('q'); if (q) setSearchTerm(q); }, [searchParams]);

  const hoy = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const cartera = useMemo(() => carteraInicial.map(op => {
    const pendientes = op.cuotas.filter((c: any) => c.estado === 'PENDIENTE');
    const vencidas = pendientes.filter((c: any) => c.fecha_vto_str && new Date(c.fecha_vto_str) < hoy);
    const deudaUsd = pendientes.reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);
    const pagadoUsd = op.cuotas.filter((c: any) => c.estado === 'PAGADA').reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);
    return { ...op, resumen: { deudaUsd, pagadoUsd, cantidadPendiente: pendientes.length, enMora: vencidas.length > 0, proximoVto: pendientes[0]?.fecha_vto_str ? new Date(pendientes[0].fecha_vto_str) : null } };
  }).filter(op => {
    const q = searchTerm.trim().toLowerCase();
    return !q || `${op.cliente?.nombre_completo || ''} ${op.cliente?.dni || ''} ${op.detalle_operacion || ''} ${op.id_operacion}`.toLowerCase().includes(q);
  }), [carteraInicial, searchTerm, hoy]);

  const totalPendienteUsd = cartera.reduce((s, op) => s + op.resumen.deudaUsd, 0);
  const operacionesEnMora = cartera.filter(op => op.resumen.enMora).length;

  const cobrar = async (cuota: any, tipo: string) => {
    const montoArs = Number(cuota.monto_usd || 0) * dolarActual;
    if (!confirm(`¿Registrar cobro de $ ${montoArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS (U$S ${Number(cuota.monto_usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })})?`)) return;
    setIsSubmitting(true);
    const res = tipo === 'VENTA'
      ? await registrarPagoCuota(cuota.id_cuota_real, { monto_cobrado_ars: montoArs, cotizacion_dia: dolarActual })
      : await registrarPagoCuotaPrestamo(cuota.id_cuota_real, { monto_cobrado_ars: montoArs, cotizacion_dia: dolarActual });
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar el cobro.');
    router.refresh();
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div><h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><Clock className="w-8 h-8 text-indigo-600" /> Cobranzas y Cuotas</h1><p className="text-sm text-slate-500 mt-1">Cartera unificada de ventas financiadas y préstamos, en ARS y USD.</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-xs font-black uppercase text-slate-500">Saldo pendiente</p><DualMoney usd={totalPendienteUsd} rate={dolarActual} primaryClassName="text-3xl font-black text-slate-900" /></div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5"><p className="text-xs font-black uppercase text-slate-500">Operaciones abiertas</p><p className="text-3xl font-black text-slate-900 mt-2">{cartera.length}</p></div>
        <div className={`rounded-2xl border p-5 ${operacionesEnMora ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}><p className={`text-xs font-black uppercase ${operacionesEnMora ? 'text-red-700' : 'text-emerald-700'}`}>En mora</p><p className={`text-3xl font-black mt-2 ${operacionesEnMora ? 'text-red-900' : 'text-emerald-900'}`}>{operacionesEnMora}</p></div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200"><div className="relative"><Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar cliente, DNI, patente, vehículo o número de operación..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[1000px]"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b"><tr><th className="text-left px-5 py-4">Cliente / Operación</th><th className="text-left px-5 py-4">Saldo</th><th className="text-left px-5 py-4">Próximo vencimiento</th><th className="text-center px-5 py-4">Cuotas</th><th className="text-right px-5 py-4">Detalle</th></tr></thead><tbody className="divide-y">{cartera.map(op => <Fragment key={op.id_operacion}><tr onClick={() => setExpanded(expanded === op.id_operacion ? null : op.id_operacion)} className={`cursor-pointer hover:bg-slate-50 ${op.resumen.enMora ? 'bg-red-50/30' : ''}`}><td className="px-5 py-4"><p className="font-black text-slate-900">{op.cliente?.nombre_completo}</p><p className="text-xs font-bold text-indigo-700 flex items-center gap-1 mt-1">{op.tipo_operacion === 'VENTA' ? <Car className="w-3 h-3" /> : <HandCoins className="w-3 h-3" />}{op.detalle_operacion}</p></td><td className="px-5 py-4"><DualMoney usd={op.resumen.deudaUsd} rate={dolarActual} compact primaryClassName="font-black text-slate-900" /></td><td className="px-5 py-4">{op.resumen.proximoVto ? <span className={`font-bold flex items-center gap-2 ${op.resumen.enMora ? 'text-red-700' : 'text-slate-700'}`}><Calendar className="w-4 h-4" />{op.resumen.proximoVto.toLocaleDateString('es-AR')}{op.resumen.enMora && <AlertTriangle className="w-4 h-4" />}</span> : <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Finalizado</span>}</td><td className="px-5 py-4 text-center"><span className="px-3 py-1 rounded-full border text-xs font-black">{op.cuotas.length - op.resumen.cantidadPendiente} / {op.cuotas.length}</span></td><td className="px-5 py-4 text-right">{expanded === op.id_operacion ? <ChevronUp className="inline" /> : <ChevronDown className="inline" />}</td></tr>{expanded === op.id_operacion && <tr><td colSpan={5} className="bg-slate-50 p-5"><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{op.cuotas.map((c: any) => { const vencida = c.estado === 'PENDIENTE' && new Date(c.fecha_vto_str) < hoy; const currentArs = Number(c.monto_usd || 0) * dolarActual; const paidArs = Number(c.monto_pagado_ars || 0); return <div key={c.id_cuota_real} className={`rounded-xl border p-4 bg-white ${vencida ? 'border-red-200' : 'border-slate-200'}`}><div className="flex justify-between gap-3"><div><p className="text-[10px] uppercase font-black text-slate-400">Cuota {c.numero_cuota}</p><p className={`text-sm font-bold ${vencida ? 'text-red-700' : 'text-slate-700'}`}>Vto. {new Date(c.fecha_vto_str).toLocaleDateString('es-AR')}</p></div>{c.estado === 'PAGADA' ? <CheckCircle2 className="text-emerald-500 w-5 h-5" /> : vencida ? <AlertTriangle className="text-red-500 w-5 h-5" /> : <Clock className="text-slate-300 w-5 h-5" />}</div><div className="my-4"><p className="text-[10px] uppercase font-black text-slate-400">{c.estado === 'PAGADA' ? 'Importe cobrado' : 'Importe a valor de hoy'}</p><DualMoney ars={c.estado === 'PAGADA' && paidArs > 0 ? paidArs : currentArs} usd={c.monto_usd} rate={c.cotizacion_pago || dolarActual} primaryClassName="text-xl font-black text-slate-900" /></div>{c.estado === 'PENDIENTE' ? <button disabled={isSubmitting} onClick={() => cobrar(c, op.tipo_operacion)} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"><Banknote className="w-4 h-4" /> Registrar cobro</button> : <p className="text-xs font-bold text-emerald-700">Cobrada {c.fecha_pago_str ? new Date(c.fecha_pago_str).toLocaleDateString('es-AR') : ''}</p>}</div>; })}</div></td></tr>}</Fragment>)}{cartera.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-500">No hay operaciones para este filtro.</td></tr>}</tbody></table></div>
      </div>
    </div>
  );
}
