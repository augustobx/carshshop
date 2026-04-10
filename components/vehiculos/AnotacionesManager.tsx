'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Loader2, UserCircle } from 'lucide-react';
import { agregarAnotacion } from '@/actions/anotaciones';

export default function AnotacionesManager({ anotaciones, idVehiculo }: { anotaciones: any[], idVehiculo: number }) {
    const [texto, setTexto] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!texto.trim()) return;

        setIsSubmitting(true);
        const res = await agregarAnotacion(idVehiculo, texto);

        // ¡Acá está la clave! Solo borramos el texto si fue un éxito
        if (res.success) {
            setTexto('');
        } else {
            alert(res.error); // Si falla, te tira el cartel en pantalla
        }

        setIsSubmitting(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-start bg-amber-50 p-4 rounded-xl border border-amber-200">
                <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribir una nota interna (ej. Falta firmar el 08, cliente interesado...)"
                    className="flex-1 w-full p-3 border border-amber-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500 resize-none h-20 outline-none"
                />
                <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg font-black flex justify-center items-center gap-2 transition-colors disabled:opacity-50 shadow-md">
                    {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />} Guardar
                </button>
            </form>

            <div className="space-y-4">
                {anotaciones.length === 0 ? (
                    <div className="text-center bg-slate-50 border border-slate-200 rounded-xl py-8">
                        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 font-bold text-sm">No hay anotaciones en este vehículo.</p>
                    </div>
                ) : (
                    anotaciones.map((nota) => {
                        // Formateamos la fecha a formato local amigable
                        const fechaFormateada = new Date(nota.fecha || nota.fecha_hora || nota.fecha_creacion).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        });

                        return (
                            <div key={nota.id_anotacion} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex gap-4 transition-all hover:shadow-md">
                                <div className="bg-amber-100 p-2.5 rounded-full h-fit shrink-0">
                                    <MessageSquare className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800 whitespace-pre-wrap leading-relaxed">{nota.texto}</p>

                                    {/* Pie de la nota: Usuario y Fecha */}
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-500">
                                            <UserCircle className="w-4 h-4 text-slate-400" />
                                            {/* Si trae el usuario relacionado lo muestra, si no dice "Usuario" */}
                                            {nota.usuario?.nombre || 'Usuario'}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {fechaFormateada} hs
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}