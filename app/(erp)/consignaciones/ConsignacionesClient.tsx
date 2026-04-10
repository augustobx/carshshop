'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfigStore } from '@/store/useConfigStore';
import { registrarConsignacion } from '@/actions/consignaciones';
import { CarFront, Plus, Search, Percent, BadgeDollarSign, Calendar, CheckCircle2, Loader2, X, ClipboardList, UserRound, Banknote } from 'lucide-react';
import Link from 'next/link';

export default function ConsignacionesClient({ vehiculos, clientes }: { vehiculos: any[], clientes: any[] }) {
    const formatMoney = (amount: number) => amount.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const router = useRouter();
    const { dolarBlue } = useConfigStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'EN_CONSIGNACION' | 'VENDIDO'>('EN_CONSIGNACION');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Buscador de Cliente (Dueño)
    const [cSearch, setCSearch] = useState('');
    const [showCSearch, setShowCSearch] = useState(false);
    const [cSeleccionado, setCSeleccionado] = useState<any>(null);

    // Formulario Auto
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [anio, setAnio] = useState('');
    const [patente, setPatente] = useState('');
    const [km, setKm] = useState('');
    const [comisionPct, setComisionPct] = useState('10');

    // Inputs en Pesos
    const [precioArs, setPrecioArs] = useState('');
    const [precioUsd, setPrecioUsd] = useState('');

    const handlePrecioArs = (val: string) => {
        setPrecioArs(val);
        const num = parseFloat(val) || 0;
        setPrecioUsd(num > 0 ? (num / dolarBlue).toFixed(2) : '');
    };

    const clientesFiltrados = clientes?.filter(c =>
        `${c.nombre_completo} ${c.dni || ''}`.toLowerCase().includes(cSearch.toLowerCase())
    ) || [];

    const stockFiltrado = vehiculos.filter(v => {
        const matchBusqueda = `${v.marca} ${v.modelo} ${v.patente} ${v.cliente?.nombre_completo || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEstado = filtroEstado === 'EN_CONSIGNACION'
            ? (v.estado === 'EN_CONSIGNACION' || v.estado === 'LISTO_PARA_VENTA' || v.estado === 'DISPONIBLE')
            : v.estado === 'VENDIDO';

        return matchBusqueda && matchEstado;
    });

    const disponibles = vehiculos.filter(v => v.estado === 'EN_CONSIGNACION' || v.estado === 'LISTO_PARA_VENTA' || v.estado === 'DISPONIBLE');
    const capitalTercerosUsd = disponibles.reduce((sum, v) => sum + v.precio_compra_usd, 0);
    const comisionesEsperadasUsd = disponibles.reduce((sum, v) => sum + (v.precio_venta_usd - v.precio_compra_usd), 0);
    const comisionesEsperadasArs = comisionesEsperadasUsd * dolarBlue;

    const handleGuardarConsignacion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cSeleccionado) return alert('Debes seleccionar al cliente dueño del vehículo.');
        if (!marca || !modelo || !patente || parseFloat(precioArs) <= 0) return alert('Completá los campos obligatorios.');

        setIsSubmitting(true);
        const res = await registrarConsignacion({
            id_cliente: cSeleccionado.id_cliente,
            marca,
            modelo,
            anio: parseInt(anio) || new Date().getFullYear(),
            patente,
            km: parseInt(km) || 0,
            precio_venta_ars: parseFloat(precioArs),
            comision_pct: parseFloat(comisionPct) || 0,
            cotizacion_dolar: dolarBlue
        });

        if (res.success) {
            setIsModalOpen(false);
            resetForm();
            router.refresh();
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    const resetForm = () => {
        setMarca(''); setModelo(''); setAnio(''); setPatente(''); setKm('');
        setPrecioArs(''); setPrecioUsd(''); setComisionPct('10'); setCSeleccionado(null);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800">
                    <ClipboardList className="w-8 h-8 text-fuchsia-600" /> Consignaciones
                </h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-sm transition-colors">
                    <Plus className="w-5 h-5" /> Recibir Auto
                </button>
            </div>

            {/* TARJETAS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Percent className="w-24 h-24" /></div>
                    <p className="text-xs font-black text-fuchsia-400 uppercase tracking-widest mb-2 relative z-10">Comisiones Proyectadas (ARS)</p>
                    <p className="text-4xl font-black relative z-10">$ {formatMoney(comisionesEsperadasArs)}</p>
                    <p className="text-sm font-bold text-slate-400 mt-2 relative z-10">~ U$S {formatMoney(comisionesEsperadasUsd)} (En salón)</p>
                </div>

                <div className="bg-fuchsia-50 p-6 rounded-2xl border border-fuchsia-100 shadow-sm flex items-center gap-4 text-fuchsia-900">
                    <div className="p-4 bg-fuchsia-200/50 rounded-xl text-fuchsia-700"><BadgeDollarSign className="w-8 h-8" /></div>
                    <div>
                        <p className="text-xs font-black text-fuchsia-600/70 uppercase tracking-widest mb-1">Capital de Terceros</p>
                        <p className="text-2xl font-black">U$S {formatMoney(capitalTercerosUsd)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 text-slate-800">
                    <div className="p-4 bg-slate-100 rounded-xl text-slate-600"><CarFront className="w-8 h-8" /></div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Stock Actual</p>
                        <p className="text-2xl font-black">{disponibles.length} Vehículos</p>
                    </div>
                </div>
            </div>

            {/* BUSCADOR Y TABLA */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Buscar modelo, patente o dueño..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 shadow-sm font-medium" />
                    </div>

                    <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200 w-full md:w-auto">
                        <button onClick={() => setFiltroEstado('EN_CONSIGNACION')} className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filtroEstado === 'EN_CONSIGNACION' ? 'bg-white shadow-sm text-fuchsia-700' : 'text-slate-500 hover:text-slate-700'}`}>En Salón</button>
                        <button onClick={() => setFiltroEstado('VENDIDO')} className={`flex-1 md:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filtroEstado === 'VENDIDO' ? 'bg-emerald-500 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}>Vendidos</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b">
                            <tr>
                                <th className="px-6 py-4">Ingreso</th>
                                <th className="px-6 py-4">Vehículo y Dueño</th>
                                <th className="px-6 py-4 text-center">Valor Público (ARS)</th>
                                <th className="px-6 py-4 text-center">Comisión</th>
                                <th className="px-6 py-4 text-right">Ganancia Agencia (ARS)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stockFiltrado.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">No hay vehículos en este estado.</td>
                                </tr>
                            ) : (
                                stockFiltrado.map((v) => {
                                    const gananciaAgenciaArs = v.precio_venta_ars - v.precio_compra_ars;
                                    return (
                                        // ACÁ ESTÁ LA CORRECCIÓN: Un solo <tr> que incluye el onClick
                                        <tr
                                            key={v.id_vehiculo}
                                            onClick={() => router.push(`/consignaciones/${v.id_vehiculo}`)}
                                            className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                {new Date(v.fecha_str).toLocaleDateString('es-AR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-black text-slate-900 text-base">{v.marca} {v.modelo}</p>
                                                <div className="flex items-center gap-2 mt-0.5 mb-1">
                                                    <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{v.patente}</span>
                                                    <span className="text-xs text-slate-400 font-bold">{v.anio}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-fuchsia-600 uppercase">
                                                    <UserRound className="w-3 h-3" /> {v.cliente?.nombre_completo || 'S/N'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-800">
                                                $ {formatMoney(v.precio_venta_ars)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-fuchsia-100 text-fuchsia-700 px-3 py-1 rounded-full text-xs font-black">
                                                    {v.comision_consignacion_pct}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-black text-lg text-emerald-600">
                                                    $ {formatMoney(gananciaAgenciaArs)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                    Liquidación dueño: $ {formatMoney(v.precio_compra_ars)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE INGRESO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <CarFront className="w-5 h-5 text-fuchsia-600" /> Ingresar Consignación
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-200 rounded-md transition-colors"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleGuardarConsignacion} className="p-6 space-y-6">
                            {/* SELECCIONAR DUEÑO */}
                            <div className="relative bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 uppercase flex justify-between mb-2">
                                    <span>Dueño del Vehículo *</span>
                                    <Link href="/clientes" className="text-fuchsia-600 hover:underline">Nuevo Cliente</Link>
                                </label>
                                {!cSeleccionado ? (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="Buscar por nombre o DNI..." value={cSearch} onChange={e => { setCSearch(e.target.value); setShowCSearch(true) }} onFocus={() => setShowCSearch(true)} className="w-full pl-9 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 text-sm bg-white" />
                                        {showCSearch && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                {clientesFiltrados.map(c => (
                                                    <div key={c.id_cliente} onClick={() => { setCSeleccionado(c); setShowCSearch(false) }} className="p-3 hover:bg-fuchsia-50 cursor-pointer border-b border-slate-100 text-sm">
                                                        <div className="font-bold text-slate-800">{c.nombre_completo}</div>
                                                        <div className="text-xs text-slate-500">DNI: {c.dni || 'S/N'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-fuchsia-100 border border-fuchsia-200 rounded-xl flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-fuchsia-900 text-base">{cSeleccionado.nombre_completo}</div>
                                            <div className="text-xs text-fuchsia-700/70 font-bold">DNI: {cSeleccionado.dni || 'S/N'}</div>
                                        </div>
                                        <button type="button" onClick={() => setCSeleccionado(null)} className="text-fuchsia-600 hover:underline text-sm font-bold bg-white px-3 py-1 rounded-lg border border-fuchsia-200">Cambiar</button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marca / Modelo *</label>
                                    <div className="flex gap-2">
                                        <input required type="text" value={marca} onChange={e => setMarca(e.target.value)} placeholder="Marca" className="flex-1 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 font-medium outline-none uppercase" />
                                        <input required type="text" value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Modelo" className="flex-1 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 font-medium outline-none uppercase" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año / KM</label>
                                    <div className="flex gap-2">
                                        <input required type="number" value={anio} onChange={e => setAnio(e.target.value)} placeholder="2021" className="w-20 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 font-medium outline-none" />
                                        <input required type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="KM" className="flex-1 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 font-medium outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patente *</label>
                                    <input required type="text" value={patente} onChange={e => setPatente(e.target.value)} placeholder="AB123CD" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 font-medium outline-none uppercase" />
                                </div>
                            </div>

                            <div className="p-5 bg-fuchsia-50 border border-fuchsia-100 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-black text-fuchsia-800 uppercase mb-1">Precio Público (ARS) *</label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-2.5 w-5 h-5 text-fuchsia-500" />
                                        <input required type="number" step="any" value={precioArs} onChange={e => handlePrecioArs(e.target.value)} placeholder="Ej: 25000000" className="w-full pl-10 p-2.5 border border-fuchsia-300 rounded-xl focus:ring-2 focus:ring-fuchsia-600 font-black outline-none text-fuchsia-900" />
                                    </div>
                                    {precioUsd && <div className="text-[10px] text-fuchsia-600 font-bold mt-1 uppercase">Ref: U$S {precioUsd} USD</div>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Comisión Pactada (%) *</label>
                                    <div className="relative">
                                        <Percent className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input required type="number" step="any" value={comisionPct} onChange={e => setComisionPct(e.target.value)} className="w-full pl-9 p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 font-bold outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Guardar en Stock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}