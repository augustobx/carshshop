'use client';

import { useState } from 'react';
import { cambiarEstadoVehiculo } from '@/actions/vehiculos';
import { Loader2 } from 'lucide-react';

const ESTADOS = [
    { value: 'EN_PREPARACION', label: 'En Preparación', color: 'bg-slate-100 text-slate-700' },
    { value: 'LISTO_PARA_VENTA', label: 'Listo para Venta', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'EN_CONSIGNACION', label: 'En Consignación', color: 'bg-fuchsia-100 text-fuchsia-700' },
    { value: 'SENADO', label: 'Señado', color: 'bg-amber-100 text-amber-700' },
    { value: 'VENDIDO', label: 'Vendido', color: 'bg-emerald-100 text-emerald-700' },
];

export default function EstadoSelect({ idVehiculo, estadoActual }: { idVehiculo: number, estadoActual: string }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const estadoMap = ESTADOS.find(e => e.value === estadoActual) || ESTADOS[0];

    const handleCambioEstado = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setIsUpdating(true);
        await cambiarEstadoVehiculo(idVehiculo, e.target.value as any);
        setIsUpdating(false);
    };

    return (
        <div className="relative inline-block">
            {isUpdating && <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-2 text-slate-500" />}
            <select
                disabled={isUpdating}
                value={estadoActual}
                onChange={handleCambioEstado}
                className={`appearance-none text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-8 ${estadoMap.color} ${isUpdating ? 'opacity-50' : ''}`}
            >
                {ESTADOS.map(estado => (
                    <option key={estado.value} value={estado.value} className="bg-white text-slate-800">
                        {estado.label}
                    </option>
                ))}
            </select>
            {/* Flechita custom para el select */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
        </div>
    );
}