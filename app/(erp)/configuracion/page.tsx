'use client';

import { useState } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { updateConfig } from '@/actions/config';
import { Settings, Save, Loader2, DollarSign, Database, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConfiguracionPage() {
    const { dolarBlue, setDolar, tipoDolar, setTipoDolar } = useConfigStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [localDolar, setLocalDolar] = useState(dolarBlue.toString());
    const [localTipo, setLocalTipo] = useState(tipoDolar);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Guardamos en la Base de Datos
        await updateConfig('dolar_actual', localDolar);
        await updateConfig('tipo_dolar', localTipo);

        // Actualizamos el estado global (Zustand)
        setDolar(parseFloat(localDolar));
        setTipoDolar(localTipo);

        router.refresh(); // Refresca el servidor
        setIsSubmitting(false);
        alert('Configuración guardada exitosamente.');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
                <div className="p-3 bg-indigo-100 rounded-xl"><Settings className="w-8 h-8 text-indigo-700" /></div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configuración Global</h1>
                    <p className="text-slate-500 font-medium mt-1">Ajustes financieros y parámetros base del ERP.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* TARJETA: CONFIGURACIÓN BIMONETARIA */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-emerald-900">Motor Bimonetario (Dólar)</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Referencia DolarAPI</label>
                            <p className="text-xs text-slate-500 mb-2">¿De qué fuente debe el sistema tomar la cotización al presionar "Actualizar"?</p>
                            <select
                                value={localTipo}
                                onChange={(e) => setLocalTipo(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                            >
                                <option value="blue">Dólar Blue</option>
                                <option value="oficial">Dólar Oficial</option>
                                <option value="mep">Dólar MEP</option>
                                <option value="cripto">Dólar Cripto</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Fijar Dólar Manual</label>
                            <p className="text-xs text-slate-500 mb-2">Si la API falla o quieres usar un dólar congelado, ingrésalo aquí.</p>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-emerald-600" />
                                <input
                                    type="number" step="0.01"
                                    value={localDolar}
                                    onChange={(e) => setLocalDolar(e.target.value)}
                                    className="w-full pl-10 p-3 border border-emerald-200 bg-emerald-50 rounded-xl focus:ring-2 focus:ring-emerald-500 font-black text-emerald-800 text-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TARJETA: OTROS PARÁMETROS (Placeholder para el futuro) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-60 grayscale cursor-not-allowed">
                    <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <Database className="w-5 h-5 text-slate-500" />
                        <h2 className="text-lg font-bold text-slate-700">Parámetros Operativos (Próximamente)</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white pointer-events-none">
                        <div>
                            <label className="text-sm font-bold text-slate-700">Comisión Base Consignaciones (%)</label>
                            <input type="text" disabled value="5.00" className="w-full p-3 border border-slate-300 rounded-xl mt-2 bg-slate-50" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">Tasa Interés Préstamos (%)</label>
                            <input type="text" disabled value="10.00" className="w-full p-3 border border-slate-300 rounded-xl mt-2 bg-slate-50" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-black flex items-center gap-2 shadow-lg transition-all disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Aplicar Configuración Global
                    </button>
                </div>
            </form>
        </div>
    );
}