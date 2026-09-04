'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, Plus } from 'lucide-react';
import { agregarTarea, cambiarEstadoTarea, agregarGasto } from '@/actions/tareas';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import DualMoney from '@/components/common/DualMoney';

export default function TareasManager({ tareas, idVehiculo, dolarActual }: { tareas: any[]; idVehiculo: number; dolarActual: number }) {
  const rate = Number(dolarActual || 1400);
  const [nuevaTarea, setNuevaTarea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gastoActivo, setGastoActivo] = useState<number | null>(null);
  const [monto, setMonto] = useState({ ars: '', usd: '' });
  const [descGasto, setDescGasto] = useState('');

  const crearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTarea.trim()) return;
    setIsSubmitting(true);
    const res = await agregarTarea(idVehiculo, nuevaTarea.trim());
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo agregar la tarea.');
    setNuevaTarea('');
  };

  const registrarGasto = async (tareaId: number) => {
    if (Number(monto.ars || 0) <= 0 || !descGasto.trim()) return alert('Completá monto y detalle del gasto.');
    setIsSubmitting(true);
    const res = await agregarGasto(tareaId, idVehiculo, Number(monto.ars), rate, descGasto.trim());
    setIsSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar el gasto.');
    setGastoActivo(null); setMonto({ ars: '', usd: '' }); setDescGasto('');
  };

  return (
    <div className="space-y-5">
      <form onSubmit={crearTarea} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2"><label className="text-xs font-black text-slate-600 uppercase tracking-wider">Nueva tarea de preparación</label><div className="flex flex-col sm:flex-row gap-2"><input value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="Ej: Cambio de aceite, pulido, revisión de frenos..." className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /><button disabled={isSubmitting} type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Agregar tarea</button></div></form>

      <div className="space-y-3">{tareas.map((tarea) => <div key={tarea.id_tarea} className="p-4 bg-white border border-slate-200 rounded-xl"><div className="flex justify-between items-start gap-4"><div className="flex gap-3 min-w-0"><button onClick={() => cambiarEstadoTarea(tarea.id_tarea, tarea.estado_tarea === 'PENDIENTE' ? 'FINALIZADA' : 'PENDIENTE', idVehiculo)}>{tarea.estado_tarea === 'FINALIZADA' ? <CheckCircle2 className="text-emerald-500" /> : <Circle className="text-slate-300" />}</button><div className="min-w-0"><p className={`font-black text-slate-900 ${tarea.estado_tarea === 'FINALIZADA' ? 'line-through text-slate-400' : ''}`}>{tarea.descripcion}</p><div className="space-y-1 mt-2">{tarea.gastos.map((g: any) => <div key={g.id_gasto} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-600">{g.descripcion}</span><DualMoney ars={g.monto_ars} usd={g.monto_usd} rate={rate} compact primaryClassName="font-black text-slate-800" secondaryClassName="text-[9px] text-slate-400" /></div>)}</div></div></div><button onClick={() => setGastoActivo(gastoActivo === tarea.id_tarea ? null : tarea.id_tarea)} className="text-xs font-black text-indigo-600 whitespace-nowrap">+ Gasto</button></div>{gastoActivo === tarea.id_tarea && <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4"><DualCurrencyInput label="Monto del gasto" required ars={monto.ars} usd={monto.usd} rate={rate} onChange={setMonto} /><label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Detalle del gasto *</span><input value={descGasto} onChange={(e) => setDescGasto(e.target.value)} placeholder="Ej: Repuestos y mano de obra cambio de aceite" className="mt-1.5 w-full p-2.5 border border-slate-300 rounded-xl text-sm" /></label><button disabled={isSubmitting} onClick={() => registrarGasto(tarea.id_tarea)} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-black text-sm disabled:opacity-50">Registrar gasto</button></div>}</div>)}{tareas.length === 0 && <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">No hay tareas registradas.</div>}</div>
    </div>
  );
}
