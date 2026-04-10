'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserRound, Phone, Mail, MapPin, BadgeDollarSign, CarFront, HandCoins, CalendarClock } from 'lucide-react';

export default function ClienteCarpetaClient({ cliente }: { cliente: any }) {
    const [activeTab, setActiveTab] = useState<'resumen' | 'ventas' | 'senias' | 'prestamos'>('resumen');
    const formatMoney = (amount: any) => Number(amount).toLocaleString('es-AR');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ENCABEZADO VIP */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Link href="/clientes" className="text-indigo-300 hover:text-white flex items-center gap-2 text-sm font-medium mb-5 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4" /> Volver a Clientes
                    </Link>
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-indigo-500/20 border-2 border-indigo-500/50 rounded-full flex items-center justify-center text-indigo-300 font-black text-3xl">
                            {cliente.nombre_completo.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{cliente.nombre_completo}</h1>
                            <p className="text-slate-400 mt-1 font-mono text-lg">DNI: {cliente.dni || 'Sin registrar'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-center min-w-[120px]">
                        <p className="text-3xl font-black text-white">{cliente.ventas.length}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Autos Comprados</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-center min-w-[120px]">
                        <p className="text-3xl font-black text-emerald-400">{cliente.senias.length}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Señas Históricas</p>
                    </div>
                </div>
            </div>

            {/* PESTAÑAS */}
            <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={() => setActiveTab('resumen')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'resumen' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <UserRound className="w-4 h-4" /> Ficha y Contacto
                </button>
                <button onClick={() => setActiveTab('ventas')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'ventas' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <BadgeDollarSign className="w-4 h-4" /> Ventas y Compras ({cliente.ventas.length})
                </button>
                <button onClick={() => setActiveTab('senias')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'senias' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <CarFront className="w-4 h-4" /> Señas ({cliente.senias.length})
                </button>
                <button onClick={() => setActiveTab('prestamos')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'prestamos' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <HandCoins className="w-4 h-4" /> Préstamos ({cliente.prestamos.length})
                </button>
            </div>

            {/* CONTENIDO DE LAS PESTAÑAS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 min-h-[400px]">

                {activeTab === 'resumen' && (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4">Información de Contacto</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl text-slate-500"><Phone className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Teléfono</p>
                                    <p className="font-bold text-slate-800 text-lg">{cliente.telefono || 'No registrado'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl text-slate-500"><Mail className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Correo Electrónico</p>
                                    <p className="font-bold text-slate-800 text-lg">{cliente.email || 'No registrado'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 md:col-span-2">
                                <div className="p-3 bg-slate-50 rounded-xl text-slate-500"><MapPin className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Domicilio</p>
                                    <p className="font-bold text-slate-800 text-lg">{cliente.domicilio || 'No registrado'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ventas' && (
                    <div className="space-y-4">
                        {cliente.ventas.length === 0 ? <p className="text-slate-500 font-bold">No hay compras registradas.</p> : (
                            cliente.ventas.map((v: any) => (
                                <Link href={`/ventas/${v.id_venta}`} key={v.id_venta} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <CarFront className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-lg">{v.vehiculo.marca} {v.vehiculo.modelo}</p>
                                            <p className="text-sm font-bold text-slate-500">{new Date(v.fecha_venta).toLocaleDateString('es-AR')} • {v.forma_pago}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 md:mt-0 text-right">
                                        <p className="text-2xl font-black text-emerald-600">U$S {formatMoney(v.precio_final_usd)}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'senias' && (
                    <div className="space-y-4">
                        {cliente.senias.length === 0 ? <p className="text-slate-500 font-bold">No hay señas registradas.</p> : (
                            cliente.senias.map((s: any) => (
                                <div key={s.id_senia} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 rounded-2xl">
                                    <div>
                                        <p className="font-black text-slate-800 text-lg">{s.vehiculo?.marca} {s.vehiculo?.modelo}</p>
                                        <p className="text-sm font-bold text-slate-500">{new Date(s.fecha_senia).toLocaleDateString('es-AR')}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <p className="text-xl font-black text-emerald-600">U$S {formatMoney(s.monto_usd)}</p>
                                            <p className="text-xs font-bold text-slate-400">$ {formatMoney(s.monto_ars)} ARS</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${s.estado === 'ACTIVA' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                                            {s.estado}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'prestamos' && (
                    <div className="space-y-4">
                        {cliente.prestamos.length === 0 ? <p className="text-slate-500 font-bold">No hay préstamos activos o históricos.</p> : (
                            cliente.prestamos.map((p: any) => (
                                <div key={p.id_prestamo} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-200 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                            <CalendarClock className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-lg">Préstamo Directo</p>
                                            <p className="text-sm font-bold text-slate-500">{new Date(p.fecha_prestamo).toLocaleDateString('es-AR')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Capital a devolver</p>
                                            <p className="text-xl font-black text-blue-600">U$S {formatMoney(p.total_devolver_usd)}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${p.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                            {p.estado}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}