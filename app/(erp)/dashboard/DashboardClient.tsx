'use client';

import { Car, BadgeDollarSign, ClipboardList, Wrench, BarChart3, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardClient({ stats }: { stats: any }) {
  const formatMoney = (amount: number) => amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const cards = [
    {
      title: 'Ventas (30 días)',
      value: `u$s ${formatMoney(stats.ventasMesUsd)}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      link: '/ventas'
    },
    {
      title: 'Stock Disponible',
      value: stats.stockDisponible,
      icon: Car,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      link: '/vehiculos?estado=LISTO_PARA_VENTA'
    },
    {
      title: 'Tareas Pendientes',
      value: stats.tareasPendientes,
      icon: ClipboardList,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      link: '/vehiculos' // Lleva a vehículos para buscar los que tienen tareas
    },
    {
      title: 'En Reparación',
      value: stats.enReparacion,
      icon: Wrench,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      link: '/vehiculos?estado=EN_PREPARACION'
    },
    {
      title: 'Op. Cerradas',
      value: stats.totalOperaciones,
      icon: BarChart3,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      link: '/ventas'
    },
    {
      title: 'Capital en Stock',
      value: `u$s ${formatMoney(stats.capitalStockUsd)}`,
      icon: BadgeDollarSign,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      link: '/vehiculos'
    }
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Resumen Operativo</h1>
          <p className="text-slate-500 font-medium mt-1">Estadísticas en tiempo real de tu agencia.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <Link key={i} href={card.link}>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[var(--color-brand)] transition-all cursor-pointer group h-full">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{card.title}</p>
                  <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
                </div>
                <div className={`p-4 rounded-2xl ${card.bg} group-hover:scale-110 transition-transform`}>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}