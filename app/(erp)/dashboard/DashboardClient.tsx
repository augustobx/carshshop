'use client';

import { Car, BadgeDollarSign, ClipboardList, Wrench, BarChart3, TrendingUp, ArrowRight, Wallet, Users, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DashboardClient({ stats }: { stats: any }) {
  const formatMoney = (amount: number) => amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 font-medium mt-1">Resumen financiero y operativo en tiempo real.</p>
        </div>
        <Link href="/ventas/nueva" className="bg-[var(--color-brand,#4f46e5)] hover:bg-[var(--color-brand-hover,#4338ca)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[var(--color-brand,#4f46e5)]/30 transition-all active:scale-95">
          <BadgeDollarSign className="w-5 h-5" />
          Nueva Venta
        </Link>
      </div>

      {/* SECCIÓN 1: MÉTRICAS FINANCIERAS (Tarjetas Premium con Gradiente) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ventas Mes */}
        <Link href="/ventas" className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-3xl shadow-xl shadow-emerald-900/10 group cursor-pointer border border-emerald-400/50 hover:scale-[1.02] transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-emerald-50 font-bold uppercase tracking-widest text-xs mb-2">Ventas (Últimos 30 Días)</p>
            <h2 className="text-5xl font-black text-white drop-shadow-sm mb-1">
              <span className="text-emerald-300 text-3xl mr-1">u$s</span>
              {formatMoney(stats.ventasMesUsd)}
            </h2>
            <div className="inline-flex items-center gap-1 mt-4 text-emerald-100 text-sm font-medium group-hover:text-white transition-colors">
              Ver detalle de operaciones <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* Capital en Stock */}
        <Link href="/vehiculos" className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 p-8 rounded-3xl shadow-xl shadow-slate-900/20 group cursor-pointer border border-slate-700/50 hover:scale-[1.02] transition-all">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Wallet className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Capital en Stock (Compra)</p>
            <h2 className="text-5xl font-black text-white drop-shadow-sm mb-1">
              <span className="text-slate-500 text-3xl mr-1">u$s</span>
              {formatMoney(stats.capitalStockUsd)}
            </h2>
            <div className="inline-flex items-center gap-1 mt-4 text-slate-300 text-sm font-medium group-hover:text-white transition-colors">
              Ir al inventario <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* SECCIÓN 2: OPERATIVA DIARIA (Tarjetas Blancas Limpias) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Link href="/vehiculos?estado=LISTO_PARA_VENTA" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Car className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{stats.stockDisponible}</h3>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Listos para Venta</p>
        </Link>

        <Link href="/vehiculos?estado=EN_PREPARACION" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{stats.enReparacion}</h3>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">En Reparación</p>
        </Link>

        <Link href="/vehiculos" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <ClipboardList className="w-6 h-6" />
            </div>
            {stats.tareasPendientes > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>
          <h3 className="text-3xl font-black text-slate-800">{stats.tareasPendientes}</h3>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Tareas Pendientes</p>
        </Link>

        <Link href="/ventas" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{stats.totalOperaciones}</h3>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">Operaciones Totales</p>
        </Link>

      </div>

      {/* SECCIÓN 3: ACCESOS RÁPIDOS */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Accesos Rápidos</h3>
        <div className="flex flex-wrap gap-4">
          <Link href="/vehiculos/agregar" className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-400" /> Ingresar Vehículo
          </Link>
          <Link href="/clientes" className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" /> Cartera de Clientes
          </Link>
          <Link href="/caja" className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Movimientos de Caja
          </Link>
        </div>
      </div>

    </div>
  );
}