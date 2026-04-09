'use client';

import Link from "next/link";
import { Plus, Car, Wrench, DollarSign, Search, Tag, LayoutGrid, List, Columns, FolderOpen } from "lucide-react";
import EstadoSelect from "@/components/vehiculos/EstadoSelect";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const COLUMNAS_DEF = [
    { id: 'nro', label: 'N°' },
    { id: 'marca', label: 'Marca / Modelo' },
    { id: 'anio', label: 'Año' },
    { id: 'patente', label: 'Patente' },
    { id: 'km', label: 'KM' },
    { id: 'compra', label: 'Costo (USD)' },
    { id: 'venta', label: 'Venta (USD / ARS)' },
    { id: 'estado', label: 'Estado' },
    { id: 'tareas', label: 'Tareas Pendientes' }
];

export default function VehiculosClient({ vehiculos, currentTab, currentDolar }: any) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // --- ESTADOS DE VISTA ---
    const [currentView, setCurrentView] = useState<'cards' | 'lista'>('cards');
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [orden, setOrden] = useState('nuevos');

    // --- ESTADOS DE COLUMNAS (Para la vista de Lista) ---
    const [colsHidden, setColsHidden] = useState<Record<string, boolean>>({});
    const [showColsMenu, setShowColsMenu] = useState(false);

    // Cargar preferencias de columnas y vista desde LocalStorage
    useEffect(() => {
        const savedView = localStorage.getItem('vehiculos_view');
        if (savedView === 'lista' || savedView === 'cards') setCurrentView(savedView);

        const savedCols = localStorage.getItem(`vehiculos_cols_${currentTab}`);
        if (savedCols) setColsHidden(JSON.parse(savedCols));
    }, [currentTab]);

    const toggleView = (view: 'cards' | 'lista') => {
        setCurrentView(view);
        localStorage.setItem('vehiculos_view', view);
    };

    const toggleCol = (colId: string) => {
        const newHidden = { ...colsHidden, [colId]: !colsHidden[colId] };
        setColsHidden(newHidden);
        localStorage.setItem(`vehiculos_cols_${currentTab}`, JSON.stringify(newHidden));
    };

    // --- BUSCADOR EN VIVO ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchTerm) params.set('q', searchTerm);
            else params.delete('q');
            router.push(`${pathname}?${params.toString()}`);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, pathname, router, searchParams]);

    // --- ORDENAMIENTO EN MEMORIA ---
    const vehiculosOrdenados = [...vehiculos].sort((a: any, b: any) => {
        if (orden === 'az') return a.marca.localeCompare(b.marca);
        if (orden === 'za') return b.marca.localeCompare(a.marca);
        if (orden === 'mayor_precio') return b.venta_usd - a.venta_usd;
        if (orden === 'menor_precio') return a.venta_usd - b.venta_usd;
        // 'nuevos' por defecto (asume que ya vienen ordenados desc por ID del servidor)
        return 0;
    });

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* HEADER PRINCIPAL */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                    <Car className="w-8 h-8 text-indigo-600" /> Gestión de Vehículos
                </h1>
                <Link href="/vehiculos/agregar" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-sm">
                    <Plus className="w-5 h-5" /> Agregar Vehículo
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">

                {/* BARRA SUPERIOR: TABS Y BUSCADOR */}
                <div className="flex flex-col xl:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="flex gap-6 overflow-x-auto hide-scrollbar">
                        {[
                            { id: 'en_preparacion', label: 'En Preparación' },
                            { id: 'listos', label: 'Listos para Venta' },
                            { id: 'consignacion', label: 'En Consignación' },
                            { id: 'senados', label: 'Señados' },
                            { id: 'vendidos', label: 'Vendidos' }
                        ].map(tab => (
                            <Link key={tab.id} href={`/vehiculos?tab=${tab.id}`} className={`pb-2 whitespace-nowrap font-bold text-sm border-b-2 transition-colors ${currentTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-800'}`}>
                                {tab.label}
                            </Link>
                        ))}
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por marca, modelo o patente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                        />
                    </div>
                </div>

                {/* BARRA DE HERRAMIENTAS SECUNDARIA: VISTAS Y ORDEN */}
                <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-500 mr-2">Ordenar por:</span>
                        <select
                            value={orden}
                            onChange={(e) => setOrden(e.target.value)}
                            className="bg-white border border-slate-300 rounded-md text-sm py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 cursor-pointer"
                        >
                            <option value="nuevos">Más recientes</option>
                            <option value="az">Marca (A → Z)</option>
                            <option value="za">Marca (Z → A)</option>
                            <option value="mayor_precio">Mayor Precio</option>
                            <option value="menor_precio">Menor Precio</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm p-0.5">
                            <button onClick={() => toggleView('cards')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${currentView === 'cards' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <LayoutGrid className="w-4 h-4" /> Tarjetas
                            </button>
                            <button onClick={() => toggleView('lista')} className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${currentView === 'lista' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <List className="w-4 h-4" /> Lista
                            </button>
                        </div>

                        {/* MENÚ DE COLUMNAS (Solo visible en modo lista) */}
                        {currentView === 'lista' && (
                            <div className="relative">
                                <button onClick={() => setShowColsMenu(!showColsMenu)} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 shadow-sm">
                                    <Columns className="w-4 h-4" /> Columnas
                                </button>
                                {showColsMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mostrar/Ocultar</h4>
                                        <div className="space-y-2">
                                            {COLUMNAS_DEF.map(c => (
                                                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 hover:text-slate-900">
                                                    <input
                                                        type="checkbox"
                                                        checked={!colsHidden[c.id]}
                                                        onChange={() => toggleCol(c.id)}
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                                    />
                                                    {c.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* CONTENIDO: LISTA O TARJETAS */}
                {vehiculosOrdenados.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        No se encontraron vehículos con los filtros actuales.
                    </div>
                ) : currentView === 'lista' ? (
                    /* ====== VISTA DE LISTA TABULAR ====== */
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
                                <tr>
                                    {!colsHidden['nro'] && <th className="px-4 py-3">ID</th>}
                                    {!colsHidden['marca'] && <th className="px-4 py-3">Vehículo</th>}
                                    {!colsHidden['anio'] && <th className="px-4 py-3">Año</th>}
                                    {!colsHidden['patente'] && <th className="px-4 py-3">Patente</th>}
                                    {!colsHidden['km'] && <th className="px-4 py-3 text-right">KM</th>}
                                    {!colsHidden['compra'] && <th className="px-4 py-3 text-right">Costo (U$S)</th>}
                                    {!colsHidden['venta'] && <th className="px-4 py-3 text-right">Venta (U$S / ARS)</th>}
                                    {!colsHidden['estado'] && <th className="px-4 py-3">Estado</th>}
                                    {!colsHidden['tareas'] && <th className="px-4 py-3 text-center">Tareas</th>}
                                    <th className="px-4 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {vehiculosOrdenados.map((v: any) => (
                                    <tr key={v.id_vehiculo} className="hover:bg-slate-50 transition-colors">
                                        {!colsHidden['nro'] && <td className="px-4 py-3 font-mono text-slate-400">#{v.id_vehiculo}</td>}
                                        {!colsHidden['marca'] && (
                                            <td className="px-4 py-3 font-bold text-slate-900">
                                                {v.marca} {v.modelo}
                                                {v.tipo_ingreso === 'Consignacion' && <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-black bg-fuchsia-100 text-fuchsia-700 uppercase">Consign.</span>}
                                            </td>
                                        )}
                                        {!colsHidden['anio'] && <td className="px-4 py-3 text-slate-600">{v.anio}</td>}
                                        {!colsHidden['patente'] && <td className="px-4 py-3 font-mono uppercase text-slate-600 bg-slate-100/50 rounded inline-block mt-2 ml-4">{v.patente}</td>}
                                        {!colsHidden['km'] && <td className="px-4 py-3 text-right text-slate-600">{formatMoney(v.km)}</td>}
                                        {!colsHidden['compra'] && <td className="px-4 py-3 text-right font-medium text-slate-700">{formatMoney(v.compra_usd)}</td>}
                                        {!colsHidden['venta'] && (
                                            <td className="px-4 py-3 text-right">
                                                <div className="font-bold text-emerald-700">U$S {formatMoney(v.venta_usd)}</div>
                                                <div className="text-[10px] text-slate-400">$ {formatMoney(v.venta_ars)}</div>
                                            </td>
                                        )}
                                        {!colsHidden['estado'] && (
                                            <td className="px-4 py-2">
                                                <EstadoSelect idVehiculo={v.id_vehiculo} estadoActual={v.estado} />
                                            </td>
                                        )}
                                        {!colsHidden['tareas'] && (
                                            <td className="px-4 py-3 text-center">
                                                {v.tareas_pendientes > 0 ? (
                                                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold border border-amber-200">
                                                        {v.tareas_pendientes}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-right">
                                            <Link href={`/vehiculos/${v.id_vehiculo}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">
                                                <FolderOpen className="w-3.5 h-3.5" /> Abrir
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* ====== VISTA DE TARJETAS (Bento Grid) ====== */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {vehiculosOrdenados.map((v: any) => (
                            <div key={v.id_vehiculo} className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-white relative">
                                {v.tipo_ingreso === 'Consignacion' && (
                                    <div className="absolute top-0 right-0 bg-fuchsia-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1 z-10">
                                        <Tag className="w-3 h-3" /> Consignación
                                    </div>
                                )}
                                <div className="p-5 flex-1 pt-6">
                                    <h3 className="font-bold text-lg text-slate-900 leading-tight mb-3">{v.marca} {v.modelo}</h3>
                                    <div className="mb-4">
                                        <EstadoSelect idVehiculo={v.id_vehiculo} estadoActual={v.estado} />
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4 font-medium">{v.anio} • {formatMoney(v.km)} km • <span className="uppercase">{v.patente}</span></p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-700">
                                            <Wrench className="w-4 h-4 text-slate-400" />
                                            <strong>{v.tareas_pendientes}</strong> Tareas Pendientes
                                        </div>
                                        <div className="flex flex-col bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                                            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                                <DollarSign className="w-4 h-4" /> U$S {formatMoney(v.venta_usd)}
                                            </div>
                                            <span className="text-xs text-emerald-600 pl-6 font-medium">$ {formatMoney(v.venta_ars)} ARS</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 border-t border-slate-100">
                                    <Link href={`/vehiculos/${v.id_vehiculo}`} className="block w-full text-center bg-white border border-slate-200 text-indigo-600 font-bold py-2 rounded-lg text-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm">
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