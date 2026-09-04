'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ChevronRight, Search, BookmarkCheck, ReceiptText } from 'lucide-react';
import PwaBottomNav from '../PwaBottomNav';

const CLOSED = new Set(['GANADO', 'PERDIDO']);

function statusLabel(value: string) {
  return ({ NUEVO: 'Nuevo', CONTACTADO: 'Contactado', VISITA_AGENDADA: 'Visita', COTIZADO: 'Cotizado', NEGOCIACION: 'Negociación', PERMUTANDO: 'Permuta', RESERVADO: 'Reservado', GANADO: 'Vendido', PERDIDO: 'Perdido' } as Record<string, string>)[value] || value;
}

export default function OperacionesMobileClient({ operaciones }: { operaciones: any[] }) {
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return operaciones.filter((o) => {
      const isClosed = CLOSED.has(o.estado);
      if (filter === 'open' ? isClosed : !isClosed) return false;
      return !q || `${o.nombre} ${o.telefono || ''} ${o.vehiculo} ${o.patente || ''}`.toLowerCase().includes(q);
    });
  }, [operaciones, filter, search]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-40 rounded-b-3xl bg-slate-950 px-4 py-5 text-white shadow-lg">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">OnlyCars Sales</p>
        <div className="mt-1 flex items-end justify-between gap-3"><div><h1 className="text-2xl font-black">Mis operaciones</h1><p className="mt-1 text-xs text-slate-400">Cotizaciones, seguimientos, reservas y cierres.</p></div><Link href="/pwa/cotizador" className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black">+ Cotizar</Link></div>
        <div className="relative mt-4"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, vehículo o patente..." className="w-full rounded-2xl bg-slate-800 py-3 pl-10 pr-3 text-sm outline-none ring-blue-500 placeholder:text-slate-500 focus:ring-2" /></div>
      </header>

      <main className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/70 p-1.5">
          <button onClick={() => setFilter('open')} className={`rounded-xl py-2.5 text-sm font-black ${filter === 'open' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Abiertas</button>
          <button onClick={() => setFilter('closed')} className={`rounded-xl py-2.5 text-sm font-black ${filter === 'closed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Cerradas</button>
        </div>

        {rows.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-black text-slate-700">Sin operaciones</p><p className="mt-1 text-sm text-slate-400">Las cotizaciones guardadas aparecen acá para poder retomarlas.</p></div> : rows.map((o) => {
          const overdue = o.proxima_accion && new Date(o.proxima_accion).getTime() < Date.now() && !CLOSED.has(o.estado);
          return <Link key={o.id_prospecto} href={`/pwa/operaciones/${o.id_prospecto}`} className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99]">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-lg font-black text-slate-900">{o.nombre}</p><p className="mt-1 truncate text-xs font-bold text-slate-500">{o.vehiculo}{o.patente ? ` · ${o.patente}` : ''}</p></div><span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-black uppercase ${o.estado === 'RESERVADO' ? 'bg-orange-100 text-orange-700' : o.estado === 'GANADO' ? 'bg-emerald-100 text-emerald-700' : o.estado === 'PERDIDO' ? 'bg-slate-200 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>{statusLabel(o.estado)}</span></div>
            {o.cotizacion && <div className="mt-3 rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400"><ReceiptText className="h-3.5 w-3.5" /> Última cotización</div><p className="mt-1 font-black text-slate-800">$ {Number(o.cotizacion.ars).toLocaleString('es-AR', { maximumFractionDigits: 0 })} · USD {Number(o.cotizacion.usd).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p></div>}
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"><div className={`flex min-w-0 items-center gap-2 text-xs font-bold ${overdue ? 'text-red-600' : 'text-slate-500'}`}>{o.reserva ? <BookmarkCheck className="h-4 w-4 text-orange-500" /> : <CalendarClock className="h-4 w-4" />}<span className="truncate">{o.reserva ? 'Reserva activa' : o.proxima_accion ? `${overdue ? 'Seguimiento vencido · ' : 'Seguimiento · '}${new Date(o.proxima_accion).toLocaleDateString('es-AR')}` : 'Sin seguimiento agendado'}</span></div><ChevronRight className="h-5 w-5 shrink-0 text-slate-300" /></div>
          </Link>;
        })}
      </main>

      <PwaBottomNav active="operations" />
    </div>
  );
}
