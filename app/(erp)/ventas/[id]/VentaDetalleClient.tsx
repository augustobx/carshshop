'use client';

import Link from 'next/link';
import { ArrowLeft, Receipt, Calendar, CarFront, UserRound, CheckCircle2, AlertTriangle, TrendingUp, MapPin, Phone, Mail, Printer, Truck } from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';

export default function VentaDetalleClient({ venta }: { venta: any }) {
  const rate = Number(venta.cotizacion_dolar_venta || 0);
  const finalUsd = Number(venta.precio_final_usd || 0);
  const finalArs = finalUsd * rate;
  const costUsd = Number(venta.vehiculo?.precio_compra_usd || 0);
  const costArs = Number(venta.vehiculo?.precio_compra_ars || 0) || costUsd * rate;
  const marginUsd = finalUsd - costUsd - Number(venta.valor_toma_permuta_usd || 0);
  const marginArs = marginUsd * rate;
  const isFinanced = venta.forma_pago === 'Cuotas';
  const paidInstallments = venta.cuotas.filter((c: any) => c.estado === 'PAGADA').length;
  const pendingUsd = venta.cuotas.filter((c: any) => c.estado === 'PENDIENTE').reduce((s: number, c: any) => s + Number(c.monto_usd || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-4"><div className="p-4 bg-indigo-100 rounded-xl text-indigo-700"><Receipt className="w-8 h-8" /></div><div><div className="flex items-center gap-3"><h1 className="text-2xl font-black text-slate-900">{venta.numero_boleto || `Operación #${venta.id_venta}`}</h1><span className={`px-3 py-1 rounded-full text-xs font-black ${isFinanced ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{venta.forma_pago}</span></div><p className="text-sm text-slate-500 mt-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(venta.fecha_venta).toLocaleString('es-AR')}</p></div></div>
        <div className="flex flex-wrap gap-2"><Link href={`/documentos/boleto/${venta.id_venta}`} target="_blank" className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2"><Printer className="w-4 h-4" /> Boleto</Link><Link href="/ventas" className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Volver</Link></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-1 bg-slate-950 text-white rounded-2xl p-5 space-y-5">
          <div><p className="text-[10px] uppercase font-black text-slate-500">Valor final</p><DualMoney ars={finalArs} usd={finalUsd} rate={rate} primaryClassName="text-3xl font-black text-white" secondaryClassName="text-sm font-bold text-slate-400" /><p className="text-[10px] text-slate-500 mt-1">TC histórico $ {rate.toLocaleString('es-AR')}</p></div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"><div><p className="text-[10px] uppercase font-black text-slate-500">Costo inventario</p><DualMoney ars={costArs} usd={costUsd} rate={rate} primaryClassName="font-black text-white" secondaryClassName="text-xs text-slate-400" /></div><div><p className="text-[10px] uppercase font-black text-slate-500">Margen bruto estimado</p><DualMoney ars={marginArs} usd={marginUsd} rate={rate} primaryClassName={`font-black ${marginArs >= 0 ? 'text-emerald-300' : 'text-red-300'}`} secondaryClassName="text-xs text-slate-400" /></div></div>
          {Number(venta.valor_toma_permuta_usd || 0) > 0 && <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-4"><p className="text-[10px] uppercase font-black text-amber-400">Permuta tomada</p><DualMoney usd={venta.valor_toma_permuta_usd} rate={rate} primaryClassName="font-black text-amber-100" secondaryClassName="text-xs text-amber-300" /></div>}
          {isFinanced && <div className="rounded-xl bg-indigo-500/10 border border-indigo-400/20 p-4 space-y-3"><div><p className="text-[10px] uppercase font-black text-indigo-400">Anticipo</p><DualMoney usd={venta.anticipo_usd} rate={rate} primaryClassName="font-black text-white" secondaryClassName="text-xs text-indigo-300" /></div><div><p className="text-[10px] uppercase font-black text-indigo-400">Saldo financiado</p><DualMoney usd={venta.saldo_financiado_usd || pendingUsd} rate={rate} primaryClassName="font-black text-white" secondaryClassName="text-xs text-indigo-300" /></div></div>}
        </section>

        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <section className="bg-white p-5 rounded-2xl border border-slate-200"><h2 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><CarFront className="w-4 h-4" /> Vehículo</h2><p className="text-xl font-black text-slate-900 mt-4">{venta.vehiculo?.marca} {venta.vehiculo?.modelo}</p><div className="mt-3 space-y-2 text-sm text-slate-600"><p>Patente: <strong className="uppercase">{venta.vehiculo?.patente || 'S/P'}</strong></p><p>Año: <strong>{venta.vehiculo?.anio || 'S/A'}</strong></p><p>Km: <strong>{Number(venta.vehiculo?.km || 0).toLocaleString('es-AR')}</strong></p></div><Link href={`/vehiculos/${venta.id_vehiculo}`} className="inline-block mt-4 text-xs font-black text-indigo-700">Abrir ficha 360°</Link></section>
            <section className="bg-white p-5 rounded-2xl border border-slate-200"><h2 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><UserRound className="w-4 h-4" /> Comprador</h2><p className="text-xl font-black text-slate-900 mt-4">{venta.cliente?.nombre_completo}</p><div className="mt-3 space-y-2 text-sm text-slate-600"><p>DNI: <strong>{venta.cliente?.dni || 'S/N'}</strong></p><p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {venta.cliente?.telefono || 'Sin teléfono'}</p><p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {venta.cliente?.email || 'Sin email'}</p><p className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5" /> {venta.cliente?.domicilio || 'Sin domicilio'}</p></div></section>
          </div>

          {venta.entrega && <section className="bg-white rounded-2xl border border-slate-200 p-5"><h2 className="font-black text-slate-900 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-600" /> Entrega</h2><p className="text-sm font-bold text-slate-700 mt-3">Estado: {venta.entrega.estado}</p><p className="text-xs text-slate-500 mt-1">{venta.entrega.fecha_programada ? new Date(venta.entrega.fecha_programada).toLocaleString('es-AR') : 'Sin fecha programada'}</p></section>}

          {isFinanced && <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-5 bg-slate-50 border-b flex justify-between gap-4"><h2 className="font-black text-slate-900 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Plan de pagos</h2><span className="text-sm font-bold text-slate-500">{paidInstallments}/{venta.cuotas.length} pagas</span></div><div className="overflow-x-auto"><table className="w-full text-sm min-w-[800px]"><thead className="text-[10px] uppercase text-slate-500 border-b"><tr><th className="text-left px-5 py-3">Cuota</th><th className="text-left px-5 py-3">Vencimiento</th><th className="text-right px-5 py-3">Importe</th><th className="text-center px-5 py-3">Estado</th><th className="text-right px-5 py-3">Cobro histórico</th></tr></thead><tbody className="divide-y">{venta.cuotas.map((c: any) => { const overdue = c.estado === 'PENDIENTE' && new Date(c.fecha_vencimiento) < new Date(); const paymentRate = Number(c.cotizacion_pago || rate); const expectedArs = Number(c.monto_usd || 0) * rate; return <tr key={c.id_cuota} className={c.estado === 'PAGADA' ? 'bg-emerald-50/30' : overdue ? 'bg-red-50/30' : ''}><td className="px-5 py-3 font-black">#{c.numero_cuota}</td><td className="px-5 py-3">{new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}</td><td className="px-5 py-3 text-right"><DualMoney ars={expectedArs} usd={c.monto_usd} rate={rate} compact primaryClassName="font-black text-slate-900" /></td><td className="px-5 py-3 text-center">{c.estado === 'PAGADA' ? <span className="text-emerald-700 font-black text-xs inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> PAGADA</span> : overdue ? <span className="text-red-700 font-black text-xs inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> VENCIDA</span> : <span className="text-slate-500 font-black text-xs">PENDIENTE</span>}</td><td className="px-5 py-3 text-right">{c.estado === 'PAGADA' ? <div><DualMoney ars={c.monto_pagado_ars} usd={c.monto_usd} rate={paymentRate} compact primaryClassName="font-black text-emerald-700" /><p className="text-[9px] text-slate-400">TC pago $ {paymentRate.toLocaleString('es-AR')}</p></div> : '—'}</td></tr>; })}</tbody></table></div></section>}
        </div>
      </div>
    </div>
  );
}
