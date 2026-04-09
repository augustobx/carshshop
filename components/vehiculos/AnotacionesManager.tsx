'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';
import { agregarAnotacion } from '@/actions/anotaciones'; // Tendrás que crear esta action simple

export default function AnotacionesManager({ anotaciones, idVehiculo }: { anotaciones: any[], idVehiculo: number }) {
    const [texto, setTexto] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!texto.trim()) return;
        setIsSubmitting(true);
        await agregarAnotacion(idVehiculo, texto);
        setTexto('');
        setIsSubmitting(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="flex gap-3 items-start bg-amber-50 p-4 rounded-xl border border-amber-200">
                <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribir una nota interna (ej. Falta firmar el 08, cliente interesado...)"
                    className="flex-1 p-3 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 resize-none h-20"
                />
                <button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />} Guardar
                </button>
            </form>

            <div className="space-y-3">
                {anotaciones.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">No hay anotaciones en este vehículo.</p>
                ) : (
                    anotaciones.map((nota) => (
                        <div key={nota.id_anotacion} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex gap-4">
                            <MessageSquare className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                            <div>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap">{nota.texto}</p>
                                <p className="text-xs text-slate-400 mt-2 font-medium">
                                    {new Date(nota.fecha).toLocaleString('es-AR')}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}