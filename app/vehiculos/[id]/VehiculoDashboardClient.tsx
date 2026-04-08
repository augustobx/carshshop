'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, FileText, Wrench, Camera } from 'lucide-react';
import VehiculoForm from '@/components/vehiculos/VehiculoForm';
import TareasManager from '@/components/vehiculos/TareasManager';

export default function VehiculoDashboardClient({ vehiculo }: { vehiculo: any }) {
    const [activeTab, setActiveTab] = useState<'datos' | 'acondicionamiento' | 'galeria'>('datos');

    // Calculamos el costo total invertido en tareas
    const totalGastosUsd = vehiculo.tareas.reduce((sum: number, t: any) =>
        sum + t.gastos.reduce((gSum: number, g: any) => gSum + g.monto_usd, 0)
        , 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header del Perfil del Auto */}
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

                {/* Resumen Financiero Rápido */}
                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 min-w-[250px]">
                    <p className="text-sm text-slate-400 font-medium mb-1">Costo Base: U$S {vehiculo.precio_compra_usd.toLocaleString()}</p>
                    <p className="text-sm text-slate-400 font-medium mb-3">Acondicionamiento: <span className="text-red-400">+ U$S {totalGastosUsd.toLocaleString()}</span></p>
                    <div className="pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Costo Total Real</p>
                        <p className="text-2xl font-black text-emerald-400">U$S {(vehiculo.precio_compra_usd + totalGastosUsd).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* TABS DE NAVEGACIÓN */}
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
            </div>

            {/* CONTENIDO DE LOS TABS */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 md:p-6 min-h-[500px]">
                {activeTab === 'datos' && <VehiculoForm vehiculo={vehiculo} />}
                {activeTab === 'acondicionamiento' && <TareasManager tareas={vehiculo.tareas} idVehiculo={vehiculo.id_vehiculo} />}
                {activeTab === 'galeria' && (
                    <div className="text-center py-20 text-slate-500 flex flex-col items-center">
                        <Camera className="w-16 h-16 text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">Galería de Imágenes</h3>
                        <p className="mt-2 text-sm">Próximamente: Integración con Amazon S3 / Vercel Blob para subir fotos del vehículo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}