'use client';

import { DollarSign, CarFront, Wrench, Handshake, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardClient({ stats }: { stats: any }) {
  const formatUsd = (val: number) => `U$S ${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
  const formatArs = (val: number) => `$ ${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resumen General</h1>
          <p className="text-slate-500 mt-1 font-medium">Bienvenido de nuevo. Aquí está el estado de tu negocio hoy.</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dólar Blue (Venta)</p>
            <p className="text-xl font-black text-slate-800">{formatArs(stats.dolarBlue)}</p>
          </div>
        </div>
      </div>

      {/* Tarjetas de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-indigo-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Stock Listo para Venta</p>
              <h3 className="text-4xl font-black text-slate-800">{stats.vehiculosListos}</h3>
            </div>
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <CarFront className="w-6 h-6" />
            </div>
          </div>
          <div className="relative z-10 mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">{stats.vehiculosEnPrep} en preparación</span>
            <Link href="/vehiculos" className="text-indigo-600 font-bold hover:underline">Ver inventario →</Link>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-emerald-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Capital en Préstamos</p>
              <h3 className="text-2xl font-black text-slate-800 mb-1">{formatUsd(stats.capitalEnCalleUsd)}</h3>
              <p className="text-sm font-semibold text-emerald-600">{formatArs(stats.capitalEnCalleArs)} ARS</p>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Handshake className="w-6 h-6" />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <Link href="/prestamos" className="text-emerald-600 font-bold hover:underline text-sm">Gestionar cobranzas →</Link>
          </div>
        </div>

        {/* KPI 3 (Accesos Rápidos) */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg text-white flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-400" /> Acciones Rápidas</h3>
            <div className="space-y-3">
              <Link href="/ventas/nueva" className="block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold text-center transition-colors shadow-sm">
                + Nueva Venta / Cotización
              </Link>
              <Link href="/caja" className="block w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-center transition-colors border border-slate-700">
                Registrar Gasto
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}