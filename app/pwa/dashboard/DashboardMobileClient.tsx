'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookmarkCheck, Calculator, LayoutGrid, Search } from 'lucide-react';
import { useConfigStore } from '@/store/useConfigStore';
import type { SellerPwaConfig } from '@/lib/seller-pwa-config';

export default function DashboardMobileClient({ vehiculos, pwaConfig }: { vehiculos: any[]; pwaConfig: SellerPwaConfig }) {
  const { dolarBlue } = useConfigStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filtrados = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return vehiculos.filter((v) => !q || `${v.marca} ${v.modelo} ${v.version || ''} ${v.patente}`.toLowerCase().includes(q));
  }, [vehiculos, searchTerm]);

  const money = (value: number, digits = 0) => Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md px-4 py-5 rounded-b-3xl mb-2">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-black text-blue-400">OnlyCars Sales</p>
            <h1 className="text-2xl font-black tracking-tight mt-1">Stock en vivo</h1>
          </div>
          <div className="flex items-center gap-2">
            {pwaConfig.showUsdPrices && <span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">USD $ {Number(dolarBlue || 0).toLocaleString('es-AR')}</span>}
            <div className="bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-300 uppercase border border-slate-700">{vehiculos.length} unidades</div>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar marca, modelo, versión o patente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-white placeholder:text-slate-400 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[var(--color-brand,#4f46e5)] font-medium transition-all"
          />
        </div>
      </header>

      <main className="p-4 space-y-3 mt-2">
        {filtrados.length === 0 ? <p className="text-center text-slate-500 font-bold mt-10">No se encontraron vehículos.</p> : filtrados.map((v) => (
          <Link key={v.id_vehiculo} href={`/pwa/vehiculo/${v.id_vehiculo}`} className="block bg-white p-4 rounded-3xl shadow-sm border border-slate-100 active:scale-[0.99] transition-all">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-800 leading-tight truncate">{v.marca} {v.modelo}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{v.version || 'Sin versión'} · {v.anio || 'S/A'} · {Number(v.km || 0).toLocaleString('es-AR')} km</p>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase shrink-0 ${v.estado === 'EN_PREPARACION' ? 'bg-amber-100 text-amber-700' : v.estado === 'EN_CONSIGNACION' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {v.estado === 'EN_PREPARACION' ? 'Preparación' : v.estado === 'EN_CONSIGNACION' ? 'Consignación' : 'Disponible'}
              </span>
            </div>

            {v.reservado && <div className="mt-3 rounded-xl bg-orange-50 border border-orange-200 px-3 py-2 flex items-center gap-2 text-orange-800">
              <BookmarkCheck className="w-4 h-4 shrink-0" />
              <div className="min-w-0"><p className="text-[10px] uppercase font-black">Reservado</p>{pwaConfig.showReservationOwner && <p className="text-xs font-bold truncate">{v.reserva_cliente}</p>}</div>
            </div>}

            <div className="flex justify-between items-end mt-4 gap-3">
              <div className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-slate-600 uppercase">{v.patente}</div>
              <div className="text-right">
                {pwaConfig.showArsPrices && <p className="text-xl font-black text-indigo-700">$ {money(v.precio_venta_ars)} ARS</p>}
                {pwaConfig.showUsdPrices && <p className="text-xs font-black text-emerald-700 mt-0.5">USD {money(v.precio_venta_usd, 2)}</p>}
              </div>
            </div>
          </Link>
        ))}
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-3 pb-safe flex justify-around items-center shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-50">
        <Link href="/pwa/dashboard" className="flex flex-col items-center text-indigo-600"><LayoutGrid className="w-6 h-6 mb-1" /><span className="text-[10px] font-black uppercase">Stock</span></Link>
        <Link href="/pwa/cotizador" className="flex flex-col items-center text-slate-400 hover:text-slate-900 transition-colors"><Calculator className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold uppercase">Cotizar</span></Link>
      </nav>
    </div>
  );
}
