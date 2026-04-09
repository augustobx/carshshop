'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Plus, DollarSign, Loader2, Banknote } from 'lucide-react';
import { agregarTarea, cambiarEstadoTarea, agregarGasto } from '@/actions/tareas';
import { useConfigStore } from '@/store/useConfigStore';

export default function TareasManager({ tareas, idVehiculo }: { tareas: any[], idVehiculo: number }) {
    const { dolarBlue } = useConfigStore();
    const [nuevaTarea, setNuevaTarea] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gastoActivo, setGastoActivo] = useState<number | null>(null);
    const [montoGastoUsd, setMontoGastoUsd] = useState('');
    const [montoGastoArs, setMontoGastoArs] = useState('');
    const [descGasto, setDescGasto] = useState('');

    const handleCurrencyChange = (from: 'ars' | 'usd', value: string) => {
        const numValue = parseFloat(value) || 0;
        if (from === 'ars') {
            setMontoGastoArs(value);
            setMontoGastoUsd((numValue / dolarBlue).toFixed(2));
        } else {
            setMontoGastoUsd(value);
            setMontoGastoArs((numValue * dolarBlue).toFixed(0));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={async (e) => {
                e.preventDefault(); setIsSubmitting(true);
                await agregarTarea(idVehiculo, nuevaTarea);
                setNuevaTarea(''); setIsSubmitting(false);
            }} className="flex gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="Ej: Cambio de aceite..." className="flex-1 p-2 border rounded" />
                <button type="submit" className="bg-indigo-600 text-white px-6 rounded font-bold">Agregar Tarea</button>
            </form>

            <div className="space-y-4">
                {tareas.map((tarea) => (
                    <div key={tarea.id_tarea} className="p-4 bg-white border rounded-xl shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <button onClick={() => cambiarEstadoTarea(tarea.id_tarea, tarea.estado_tarea === 'PENDIENTE' ? 'FINALIZADA' : 'PENDIENTE', idVehiculo)}>
                                    {tarea.estado_tarea === 'FINALIZADA' ? <CheckCircle2 className="text-emerald-500" /> : <Circle className="text-slate-300" />}
                                </button>
                                <div>
                                    <p className={`font-bold ${tarea.estado_tarea === 'FINALIZADA' ? 'line-through text-slate-400' : ''}`}>{tarea.descripcion}</p>
                                    {tarea.gastos.map((g: any) => (
                                        <div key={g.id_gasto} className="text-xs text-slate-500 mt-1">
                                            • {g.descripcion}: U$S {g.monto_usd} (~ $ {(g.monto_usd * dolarBlue).toLocaleString()} ARS)
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setGastoActivo(gastoActivo === tarea.id_tarea ? null : tarea.id_tarea)} className="text-xs font-bold text-indigo-600">+ Gasto</button>
                        </div>

                        {gastoActivo === tarea.id_tarea && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Banknote className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                                        <input type="number" placeholder="ARS" value={montoGastoArs} onChange={(e) => handleCurrencyChange('ars', e.target.value)} className="w-full pl-8 p-1.5 border rounded text-sm" />
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2 w-4 h-4 text-slate-400" />
                                        <input type="number" placeholder="USD" value={montoGastoUsd} onChange={(e) => handleCurrencyChange('usd', e.target.value)} className="w-full pl-8 p-1.5 border rounded text-sm font-bold text-emerald-700" />
                                    </div>
                                </div>
                                <input placeholder="Detalle del gasto..." value={descGasto} onChange={(e) => setDescGasto(e.target.value)} className="w-full p-2 border rounded text-sm" />
                                <button onClick={async () => {
                                    await agregarGasto(tarea.id_tarea, idVehiculo, parseFloat(montoGastoArs), dolarBlue, descGasto);
                                    setGastoActivo(null); setMontoGastoUsd(''); setMontoGastoArs(''); setDescGasto('');
                                }} className="w-full bg-emerald-600 text-white py-2 rounded font-bold text-xs">Registrar Pago</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}