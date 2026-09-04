'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, BadgeDollarSign, FileText, Calendar, CheckCircle2, Clock, CarFront, UserRound, Printer, Search } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function VentasClient({ ventas, dolarActual }: { ventas: any[]; dolarActual: number }) {
  const [search, setSearch] = useState('');

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ventas;
    return ventas.filter((v) => `${v.numero_boleto || ''} ${v.id_venta} ${v.vehiculo?.marca || ''} ${v.vehiculo?.modelo || ''} ${v.vehiculo?.patente || ''} ${v.cliente?.nombre_completo || ''} ${v.cliente?.dni || ''}`.toLowerCase().includes(q));
  }, [ventas, search]);

  const totalVentasUsd = ventas.reduce((sum, v) => sum + Number(v.precio_final_usd || 0), 0);
  const totalVentasArs = ventas.reduce((sum, v) => sum + Number(v.precio_final_usd || 0) * Number(v.cotizacion_dolar_venta || dolarActual), 0);
  const capitalEnCalleUsd = ventas.reduce((sum, v) => {
    if (v.forma_pago !== 'Cuotas') return sum;
    return sum + v.cuotas.filter((c: any) => c.estado === 'PENDIENTE').reduce((acc: number, c: any) => acc + Number(c.monto_usd || 0), 0);
  }, 0);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-3xl font-black flex items-center gap-3 text-slate-900"><BadgeDollarSign className="w-8 h-8 text-emerald-600" /> Ventas y Operaciones</h1><p className="text-sm text-slate-500 mt-1">Historial comercial con importes históricos en ARS y USD.</p></div>
        <Link href="/ventas/nueva" className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-sm"><Plus className="w-5 h-5" /> Nueva venta / Cotizador</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5"><div className="p-4 bg-emerald-100 rounded-xl text-emerald-700"><BadgeDollarSign className="w-8 h-8" /></div><div><p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Volumen histórico facturado</p><DualMoney ars={totalVentasArs} usd={totalVentasUsd} rate={dolarActual} primaryClassName="text-3xl font-black text-slate-900" /></div></div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5"><div className="p-4 bg-indigo-100 rounded-xl text-indigo-700"><Clock className="w-8 h-8" /></div><div><p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Capital pendiente de cobro</p><DualMoney usd={capitalEnCalleUsd} rate={dolarActual} primaryClassName="text-3xl font-black text-indigo-800" /></div></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><h3 className="text-lg font-black text-slate-900">Historial de operaciones</h3><p className="text-xs text-slate-500 mt-1">{filtradas.length} de {ventas.length} registros</p></div>
          <div className="relative w-full md:w-96"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, vehículo, patente o boleto..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
            <thead className="bg-white text-slate-500 font-black border-b border-slate-200 uppercase tracking-wider text-[10px]"><tr><th className="px-6 py-4">Fecha / Operación</th><th className="px-6 py-4">Vehículo</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4 text-right">Monto final</th><th className="px-6 py-4 text-center">Modalidad</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No se encontraron operaciones.</td></tr> : filtradas.map((v) => {
                const cuotasTotales = v.cuotas.length;
                const cuotasPagadas = v.cuotas.filter((c: any) => c.estado === 'PAGADA').length;
                const historicalRate = Number(v.cotizacion_dolar_venta || dolarActual);
                const historicalArs = Number(v.precio_final_usd || 0) * historicalRate;
                return (
                  <tr key={v.id_venta} className="hover:bg-slate-50">
                    <td className="px-6 py-4"><div className="flex items-center gap-2 font-bold text-slate-900"><Calendar className="w-4 h-4 text-slate-400" />{new Date(v.fecha_venta).toLocaleDateString('es-AR')}</div><div className="text-xs text-slate-400 mt-1 font-mono">{v.numero_boleto || `OP #${v.id_venta}`}</div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><CarFront className="w-4 h-4 text-indigo-500" /><span className="font-black text-slate-800">{v.vehiculo?.marca} {v.vehiculo?.modelo}</span></div><div className="text-xs text-slate-500 uppercase mt-1">{v.vehiculo?.patente || 'S/P'}</div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-slate-700 font-bold"><UserRound className="w-4 h-4 text-slate-400" />{v.cliente?.nombre_completo}</div></td>
                    <td className="px-6 py-4 text-right"><DualMoney ars={historicalArs} usd={v.precio_final_usd} rate={historicalRate} compact primaryClassName="font-black text-emerald-700" secondaryClassName="text-[10px] text-slate-500" /><p className="text-[9px] text-slate-400 mt-1">TC histórico $ {historicalRate.toLocaleString('es-AR')}</p></td>
                    <td className="px-6 py-4 text-center">{v.forma_pago === 'Contado' ? <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold border"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Contado</span> : <div className="flex flex-col items-center gap-1"><span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-100">Financiado</span><span className="text-[10px] font-black text-slate-500">{cuotasPagadas} / {cuotasTotales} PAGAS</span></div>}</td>
                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2"><Link href={`/documentos/boleto/${v.id_venta}`} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"><Printer className="w-3.5 h-3.5" /> Boleto</Link><Link href={`/ventas/${v.id_venta}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200"><FileText className="w-3.5 h-3.5" /> Detalle</Link></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
