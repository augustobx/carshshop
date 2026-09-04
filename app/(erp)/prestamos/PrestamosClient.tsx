'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { HandCoins, Plus, Search, UserRound, Calendar, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function PrestamosClient({ prestamos, dolarActual }: { prestamos: any[]; dolarActual: number }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'ACTIVOS' | 'FINALIZADOS'>('ACTIVOS');

  const cartera = useMemo(() => prestamos.map(p => {
    const pagadas = p.cuotas.filter((c: any) => c.estado === 'PAGADA');
    const pendientes = p.cuotas.filter((c: any) => c.estado === 'PENDIENTE');
    const pendienteUsd = pendientes.reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);
    const recuperadoUsd = pagadas.reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);
    const finalizado = pendientes.length === 0;
    return { ...p, resumen: { pagadas: pagadas.length, total: p.cuotas.length, pendienteUsd, recuperadoUsd, finalizado } };
  }).filter(p => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || `${p.cliente?.nombre_completo || ''} ${p.cliente?.dni || ''} ${p.id_prestamo}`.toLowerCase().includes(q);
    const matchesState = filtroEstado === 'ACTIVOS' ? !p.resumen.finalizado : p.resumen.finalizado;
    return matchesSearch && matchesState;
  }), [prestamos, searchTerm, filtroEstado]);

  const totalPrestadoUsd = prestamos.reduce((s, p) => s + Number(p.capital_entregado_usd || 0), 0);
  const totalPrestadoArs = prestamos.reduce((s, p) => s + Number(p.capital_entregado_usd || 0) * Number(p.cotizacion_dolar_prestamo || dolarActual), 0);
  const totalPendienteUsd = prestamos.reduce((s, p) => s + p.cuotas.filter((c: any) => c.estado === 'PENDIENTE').reduce((a: number, c: any) => a + Number(c.monto_usd || 0), 0), 0);
  const gananciaProyectadaUsd = prestamos.reduce((s, p) => s + Math.max(0, Number(p.total_devolver_usd || 0) - Number(p.capital_entregado_usd || 0)), 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><HandCoins className="w-8 h-8 text-blue-600" /> Financiación y Préstamos</h1><p className="text-sm text-slate-500 mt-1">Cartera de préstamos con capital, saldo y rentabilidad en ARS + USD.</p></div><Link href="/prestamos/nuevo" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo préstamo</Link></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200"><p className="text-xs font-black text-slate-500 uppercase">Capital otorgado</p><DualMoney ars={totalPrestadoArs} usd={totalPrestadoUsd} rate={dolarActual} primaryClassName="text-2xl font-black text-slate-900" /></div>
        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100"><p className="text-xs font-black text-indigo-700 uppercase">Saldo pendiente</p><DualMoney usd={totalPendienteUsd} rate={dolarActual} primaryClassName="text-2xl font-black text-indigo-950" /></div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100"><p className="text-xs font-black text-emerald-700 uppercase">Ganancia proyectada</p><DualMoney usd={gananciaProyectadaUsd} rate={dolarActual} primaryClassName="text-2xl font-black text-emerald-950" /></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3 justify-between"><div className="relative flex-1 max-w-lg"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por cliente, DNI o número de préstamo..." className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></div><div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl"><button onClick={() => setFiltroEstado('ACTIVOS')} className={`px-4 py-2 rounded-lg text-xs font-black ${filtroEstado === 'ACTIVOS' ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>Activos</button><button onClick={() => setFiltroEstado('FINALIZADOS')} className={`px-4 py-2 rounded-lg text-xs font-black ${filtroEstado === 'FINALIZADOS' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}>Finalizados</button></div></div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {cartera.map(p => {
          const historicalRate = Number(p.cotizacion_dolar_prestamo || dolarActual);
          const capitalArsOriginal = Number(p.capital_entregado_usd || 0) * historicalRate;
          const totalArsOriginal = Number(p.total_devolver_usd || 0) * historicalRate;
          return <div key={p.id_prestamo} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-slate-400">Préstamo #{p.id_prestamo}</p><p className="text-lg font-black text-slate-900 flex items-center gap-2 mt-1"><UserRound className="w-4 h-4 text-blue-600" /> {p.cliente?.nombre_completo}</p><p className="text-xs text-slate-500 mt-1">DNI {p.cliente?.dni || 'S/N'} · <Calendar className="inline w-3 h-3" /> {new Date(p.fecha_str).toLocaleDateString('es-AR')}</p></div>{p.resumen.finalizado ? <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> FINALIZADO</span> : p.cuotas.some((c: any) => c.estado === 'PENDIENTE' && new Date(c.fecha_vto_str) < new Date()) ? <span className="text-[10px] font-black bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> MORA</span> : <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">ACTIVO</span>}</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-[10px] uppercase font-black text-slate-400">Capital original</p><DualMoney ars={capitalArsOriginal} usd={p.capital_entregado_usd} rate={historicalRate} compact primaryClassName="font-black text-slate-900" /></div><div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3"><p className="text-[10px] uppercase font-black text-indigo-500">Total contrato</p><DualMoney ars={totalArsOriginal} usd={p.total_devolver_usd} rate={historicalRate} compact primaryClassName="font-black text-indigo-950" /></div><div className="rounded-xl bg-amber-50 border border-amber-100 p-3"><p className="text-[10px] uppercase font-black text-amber-600">Saldo a valor de hoy</p><DualMoney usd={p.resumen.pendienteUsd} rate={dolarActual} compact primaryClassName="font-black text-amber-950" /></div></div><div className="flex items-center justify-between border-t pt-3"><span className="text-xs font-bold text-slate-500">Cuotas pagadas: {p.resumen.pagadas}/{p.resumen.total}</span><Link href={`/cuotas?q=${encodeURIComponent(p.cliente?.nombre_completo || '')}`} className="text-xs font-black text-blue-700 flex items-center gap-1">Ver cobranzas <ArrowRight className="w-3 h-3" /></Link></div></div>;
        })}
        {cartera.length === 0 && <div className="xl:col-span-2 p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl text-slate-500">No hay préstamos para este filtro.</div>}
      </div>
    </div>
  );
}
