'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookmarkCheck, CarFront, Search } from 'lucide-react';
import { useConfigStore } from '@/store/useConfigStore';
import type { SellerPwaConfig } from '@/lib/seller-pwa-config';
import PwaBottomNav from '../PwaBottomNav';

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
      <header className="sticky top-0 z-50 mb-2 rounded-b-3xl bg-slate-900 px-4 py-5 text-white shadow-md">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">OnlyCars Sales</p><h1 className="mt-1 text-2xl font-black tracking-tight">Stock en vivo</h1></div>
          <div className="flex items-center gap-2">
            {pwaConfig.showUsdPrices && <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400">USD $ {Number(dolarBlue || 0).toLocaleString('es-AR')}</span>}
            <div className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-black uppercase text-slate-300">{vehiculos.length}</div>
          </div>
        </div>
        <div className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" /><input type="text" placeholder="Marca, modelo, versión o patente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-2xl bg-slate-800 py-3.5 pl-12 pr-4 font-medium text-white outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--color-brand,#4f46e5)]" /></div>
      </header>

      <main className="mt-2 space-y-3 p-4">
        {filtrados.length === 0 ? <p className="mt-10 text-center font-bold text-slate-500">No se encontraron vehículos.</p> : filtrados.map((v) => (
          <Link key={v.id_vehiculo} href={`/pwa/vehiculo/${v.id_vehiculo}`} className="block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all active:scale-[0.99]">
            <div className="relative h-44 w-full bg-slate-100">
              {v.foto ? <img src={v.foto} alt={`${v.marca} ${v.modelo}`} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-slate-300"><CarFront className="h-14 w-14" /></div>}
              <span className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase shadow-sm ${v.estado === 'EN_PREPARACION' ? 'bg-amber-100 text-amber-700' : v.estado === 'EN_CONSIGNACION' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-emerald-100 text-emerald-700'}`}>{v.estado === 'EN_PREPARACION' ? 'Preparación' : v.estado === 'EN_CONSIGNACION' ? 'Consignación' : 'Disponible'}</span>
              {v.reservado && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-white shadow-sm"><BookmarkCheck className="h-3.5 w-3.5" /> Reservado</span>}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-black leading-tight text-slate-900">{v.marca} {v.modelo}</h2><p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{v.version || 'Sin versión'} · {v.anio || 'S/A'} · {Number(v.km || 0).toLocaleString('es-AR')} km</p></div><div className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-600">{v.patente}</div></div>
              {v.reservado && pwaConfig.showReservationOwner && <p className="mt-2 truncate text-xs font-bold text-orange-700">Reserva: {v.reserva_cliente}</p>}
              <div className="mt-4 text-right">{pwaConfig.showArsPrices && <p className="text-xl font-black text-indigo-700">$ {money(v.precio_venta_ars)} ARS</p>}{pwaConfig.showUsdPrices && <p className="mt-0.5 text-xs font-black text-emerald-700">USD {money(v.precio_venta_usd, 2)}</p>}</div>
            </div>
          </Link>
        ))}
      </main>

      <PwaBottomNav active="stock" />
    </div>
  );
}
