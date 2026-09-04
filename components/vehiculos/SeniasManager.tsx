'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { guardarSenia, cancelarSenia } from '@/actions/senias';
import { Loader2, Save, Ban, History, ShoppingCart, Printer } from 'lucide-react';
import SearchCombobox from '@/components/common/SearchCombobox';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import DualMoney from '@/components/common/DualMoney';

export default function SeniasManager({ vehiculo, clientes, dolarActual }: { vehiculo: any; clientes: any[]; dolarActual: number }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idCliente, setIdCliente] = useState('');
  const [fechaSenia, setFechaSenia] = useState(new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState({ ars: '', usd: '' });

  const seniasHistorial = vehiculo.senias || [];
  const seniaActiva = seniasHistorial.find((s: any) => s.estado === 'ACTIVA');
  const clientOptions = useMemo(() => (clientes || []).map((c: any) => ({
    value: String(c.id_cliente),
    label: c.nombre_completo,
    description: `DNI ${c.dni || 'S/N'}${c.telefono ? ` · ${c.telefono}` : ''}`,
    searchText: `${c.nombre_completo} ${c.dni || ''} ${c.cuit_cuil || ''} ${c.telefono || ''}`,
  })), [clientes]);

  const handleGuardarSenia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCliente || Number(monto.usd || 0) <= 0) return alert('Seleccioná cliente y monto de la reserva.');
    setIsSubmitting(true);
    const res = await guardarSenia({
      id_vehiculo: vehiculo.id_vehiculo,
      id_cliente: Number(idCliente),
      monto_ars: Number(monto.ars || 0),
      monto_usd: Number(monto.usd || 0),
      cotizacion: dolarActual,
      fecha_senia: fechaSenia,
    });
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar la reserva.');
    setMonto({ ars: '', usd: '' });
    setIdCliente('');
  };

  const handleCancelarSenia = async (idSenia: number) => {
    if (!confirm('¿Cancelar esta reserva y liberar el vehículo?')) return;
    const res = await cancelarSenia(idSenia, vehiculo.id_vehiculo);
    if (!res.success) alert(res.error || 'No se pudo cancelar la reserva.');
  };

  return (
    <div className="space-y-6">
      {seniaActiva && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4"><div className="flex justify-between gap-3"><div><p className="text-xs font-black uppercase text-amber-700">Reserva activa</p><p className="text-lg font-black text-amber-950 mt-1">{seniaActiva.cliente?.nombre_completo}</p></div><span className="h-fit bg-amber-200 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full">ACTIVA</span></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div><p className="text-[10px] uppercase font-black text-amber-700/70">Fecha</p><p className="font-bold text-amber-950">{new Date(seniaActiva.fecha_senia).toLocaleDateString('es-AR')}</p></div><div><p className="text-[10px] uppercase font-black text-amber-700/70">Monto</p><DualMoney ars={seniaActiva.monto_ars} usd={seniaActiva.monto_usd} rate={seniaActiva.cotizacion || dolarActual} primaryClassName="font-black text-amber-950" secondaryClassName="text-xs text-amber-700" /></div><div><p className="text-[10px] uppercase font-black text-amber-700/70">Cotización usada</p><p className="font-bold text-amber-950">$ {Number(seniaActiva.cotizacion || 0).toLocaleString('es-AR')} / USD</p></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-3 border-t border-amber-200"><Link href={`/documentos/recibo/${seniaActiva.id_senia}`} target="_blank" className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Recibo</Link><Link href={`/ventas/nueva?v=${vehiculo.id_vehiculo}&c=${seniaActiva.id_cliente}`} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2"><ShoppingCart className="w-4 h-4" /> Pasar a venta</Link><button onClick={() => handleCancelarSenia(seniaActiva.id_senia)} className="bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2"><Ban className="w-4 h-4" /> Cancelar</button></div></div>}

      {vehiculo.estado !== 'VENDIDO' && !seniaActiva && <form onSubmit={handleGuardarSenia} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"><div><h3 className="font-black text-slate-900">Registrar reserva / seña</h3><p className="text-xs text-slate-500 mt-1">Buscá el cliente y cargá el importe en cualquiera de las dos monedas.</p></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><SearchCombobox label="Cliente" required value={idCliente} onChange={setIdCliente} options={clientOptions} placeholder="Buscar por nombre, DNI o teléfono..." /><label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Fecha *</span><input type="date" value={fechaSenia} onChange={(e) => setFechaSenia(e.target.value)} required className="mt-1.5 w-full p-2.5 border border-slate-300 rounded-xl text-sm" /></label></div><DualCurrencyInput label="Monto de la reserva" required ars={monto.ars} usd={monto.usd} rate={dolarActual} onChange={setMonto} /><button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black flex justify-center items-center gap-2 disabled:opacity-50">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar reserva</button></form>}

      <div><h3 className="font-black text-slate-900 mb-3 flex items-center gap-2"><History className="w-5 h-5 text-slate-400" /> Historial de reservas</h3><div className="border border-slate-200 rounded-xl overflow-x-auto"><table className="w-full text-sm min-w-[650px]"><thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500"><tr><th className="text-left px-4 py-3">Fecha</th><th className="text-left px-4 py-3">Cliente</th><th className="text-right px-4 py-3">Monto</th><th className="text-center px-4 py-3">Estado</th></tr></thead><tbody className="divide-y bg-white">{seniasHistorial.map((s: any) => <tr key={s.id_senia}><td className="px-4 py-3">{new Date(s.fecha_senia).toLocaleDateString('es-AR')}</td><td className="px-4 py-3 font-bold text-slate-900">{s.cliente?.nombre_completo}</td><td className="px-4 py-3 text-right"><DualMoney ars={s.monto_ars} usd={s.monto_usd} rate={s.cotizacion || dolarActual} compact primaryClassName="font-black text-slate-900" /></td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-[10px] font-black ${s.estado === 'ACTIVA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>{s.estado}</span></td></tr>)}{seniasHistorial.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Sin historial de reservas.</td></tr>}</tbody></table></div></div>
    </div>
  );
}
