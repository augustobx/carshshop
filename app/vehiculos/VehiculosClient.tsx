'use client';

import Link from "next/link";
import { Plus, Car, Wrench, DollarSign } from "lucide-react";

export default function VehiculosClient({ vehiculos, currentTab, currentDolar }: any) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                    <Car className="w-8 h-8 text-indigo-600" /> Gestión de Vehículos
                </h1>
                <Link href="/vehiculos/agregar" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700">
                    <Plus className="w-5 h-5" /> Agregar Vehículo
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                {/* TABS */}
                <div className="flex gap-4 border-b border-slate-200 mb-6 overflow-x-auto">
                    {[
                        { id: 'en_preparacion', label: 'En Preparación' },
                        { id: 'listos', label: 'Listos para Venta' },
                        { id: 'consignacion', label: 'En Consignación' },
                        { id: 'senados', label: 'Señados' },
                        { id: 'vendidos', label: 'Vendidos' }
                    ].map(tab => (
                        <Link key={tab.id} href={`/vehiculos?tab=${tab.id}`} className={`pb-3 whitespace-nowrap font-medium text-sm border-b-2 transition-colors ${currentTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* TARJETAS DE VEHÍCULOS (Bento Grid) */}
                {vehiculos.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No hay vehículos en esta categoría.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {vehiculos.map((v: any) => (
                            <div key={v.id_vehiculo} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-white">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-slate-900">{v.marca} {v.modelo}</h3>
                                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">{v.estado.replace(/_/g, ' ')}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">{v.anio} • {formatMoney(v.km)} km • Patente: {v.patente}</p>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
                                            <Wrench className="w-4 h-4 text-slate-400" />
                                            <strong>{v.tareas_pendientes}</strong> Tareas Pendientes
                                        </div>
                                        <div className="flex flex-col bg-emerald-50 p-2 rounded border border-emerald-100">
                                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                                <DollarSign className="w-4 h-4" /> U$S {formatMoney(v.venta_usd)}
                                            </div>
                                            <span className="text-xs text-emerald-600 pl-6">$ {formatMoney(v.venta_ars)} ARS</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 border-t border-slate-100">
                                    <Link href={`/vehiculos/${v.id_vehiculo}`} className="block w-full text-center bg-white border border-slate-200 text-indigo-600 font-medium py-2 rounded-lg text-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                                        Abrir Carpeta
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}