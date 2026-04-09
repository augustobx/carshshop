'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, FileText, Wrench, Camera } from 'lucide-react';
import VehiculoForm from '@/components/vehiculos/VehiculoForm';
import TareasManager from '@/components/vehiculos/TareasManager';
import { useConfigStore } from '@/store/useConfigStore'; //
import AnotacionesManager from '@/components/vehiculos/AnotacionesManager';
import GaleriaFotos from '@/components/vehiculos/GaleriaFotos';
import { MessageSquare } from 'lucide-react';
import SeniasManager from '@/components/vehiculos/SeniasManager';
import { PenTool } from 'lucide-react'; // Icono para la pestaña

export default function VehiculoDashboardClient({ vehiculo, clientes }: { vehiculo: any, clientes: any[] }) {
    const [activeTab, setActiveTab] = useState<'datos' | 'acondicionamiento' | 'galeria' | 'notas'>('datos');
    const { dolarBlue } = useConfigStore(); //

    const totalGastosUsd = vehiculo.tareas.reduce((sum: number, t: any) =>
        sum + t.gastos.reduce((gSum: number, g: any) => gSum + g.monto_usd, 0), 0);

    const costoTotalUsd = vehiculo.precio_compra_usd + totalGastosUsd;
    const costoTotalArs = costoTotalUsd * dolarBlue;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link href="/vehiculos" className="text-indigo-300 hover:text-white flex items-center gap-2 text-sm font-medium mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver al inventario
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-black flex items-center gap-4">
                        <div className="p-3 bg-indigo-600/20 rounded-xl"><Car className="w-8 h-8 text-indigo-400" /></div>
                        {vehiculo.marca} {vehiculo.modelo}
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg font-medium">
                        {vehiculo.anio} • Patente: <span className="uppercase text-white">{vehiculo.patente || 'S/N'}</span> • {vehiculo.estado.replace(/_/g, ' ')}
                    </p>
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 min-w-[280px]">
                    <div className="space-y-1 mb-3">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Inversión Total (Bimonetaria)</p>
                        <p className="text-3xl font-black text-emerald-400">U$S {costoTotalUsd.toLocaleString()}</p>
                        <p className="text-lg font-bold text-slate-300">$ {costoTotalArs.toLocaleString()} ARS</p>
                    </div>
                    <div className="pt-3 border-t border-slate-700 text-xs text-slate-500 font-medium">
                        Cotización base: $ {dolarBlue}
                    </div>
                </div>
            </div>

            <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <button onClick={() => setActiveTab('datos')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'datos' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <FileText className="w-4 h-4" /> Datos Comerciales
                </button>
                <button onClick={() => setActiveTab('acondicionamiento')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'acondicionamiento' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <Wrench className="w-4 h-4" /> Tareas y Gastos ({vehiculo.tareas.length})
                </button>
                <button onClick={() => setActiveTab('galeria')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'galeria' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <Camera className="w-4 h-4" /> Fotos y Documentos
                </button>
                <button onClick={() => setActiveTab('notas')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'notas' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <MessageSquare className="w-4 h-4" /> Bitácora / Notas
                </button>
                <button onClick={() => setActiveTab('senias')} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'senias' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <PenTool className="w-4 h-4" /> Señas
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
                {activeTab === 'datos' && <VehiculoForm vehiculo={vehiculo} />}
                {activeTab === 'acondicionamiento' && <TareasManager tareas={vehiculo.tareas} idVehiculo={vehiculo.id_vehiculo} />}
                {activeTab === 'galeria' && <GaleriaFotos fotos={vehiculo.fotos || []} idVehiculo={vehiculo.id_vehiculo} />}
                {activeTab === 'notas' && <AnotacionesManager anotaciones={vehiculo.anotaciones || []} idVehiculo={vehiculo.id_vehiculo} />}
                {activeTab === 'senias' && <SeniasManager vehiculo={vehiculo} clientes={clientes} />}
            </div>
        </div>
    );
}