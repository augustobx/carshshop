'use client';

import { useState } from 'react';
import { agregarAnotacion } from '@/actions/anotaciones';
import { ArrowLeft, BookmarkCheck, Calculator, CarFront, Info, Loader2, MessageSquare, Plus, TrendingUp, UserCircle } from 'lucide-react';
import Link from 'next/link';
import type { SellerPwaConfig } from '@/lib/seller-pwa-config';

export default function VehiculoMobileClient({ vehiculo, dolarActual, pwaConfig }: { vehiculo: any; dolarActual: number; pwaConfig: SellerPwaConfig }) {
  const [nota, setNota] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const money = (amount: number, digits = 0) => Number(amount || 0).toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const handleGuardarNota = async () => {
    if (!nota.trim()) return;
    setIsSaving(true);
    const res = await agregarAnotacion(vehiculo.id_vehiculo, nota);
    if (res.success) setNota(''); else alert(res.error);
    setIsSaving(false);
  };

  const fotos = vehiculo.fotos || [];
  const anotaciones = vehiculo.anotaciones || [];
  const reserva = vehiculo.reserva || null;
  const original = reserva?.cotizacion_original || null;
  const originalArs = original ? Number(original.precio_usd || 0) * Number(original.rate || 0) : 0;
  const currentArs = Number(vehiculo.precio_venta_ars || 0);
  const currentUsd = Number(vehiculo.precio_venta_usd || 0);
  const costArs = Number(vehiculo.precio_compra_ars || 0);
  const costUsd = Number(vehiculo.precio_compra_usd || 0);
  const marginArs = currentArs - costArs;
  const marginUsd = currentUsd - costUsd;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 font-sans">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <Link href="/pwa/dashboard" className="rounded-full bg-slate-100 p-2 text-slate-700"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-base font-black uppercase tracking-wider text-slate-800">Ficha de unidad</h1><div className="w-9" />
      </header>

      <main className="space-y-4 p-4">
        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="relative h-64 bg-slate-100">
            {fotos.length ? <img src={fotos[Math.min(activePhoto, fotos.length - 1)].url} alt={`${vehiculo.marca} ${vehiculo.modelo}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><CarFront className="h-20 w-20" /></div>}
            <span className="absolute left-3 top-3 rounded-lg bg-slate-950/80 px-2.5 py-1 text-[10px] font-black uppercase text-white backdrop-blur">{String(vehiculo.estado).replace(/_/g, ' ')}</span>
            {reserva && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase text-white"><BookmarkCheck className="h-3.5 w-3.5" /> Reservado</span>}
          </div>
          {fotos.length > 1 && <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3">{fotos.map((foto: any, index: number) => <button key={foto.id_foto} onClick={() => setActivePhoto(index)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${activePhoto === index ? 'border-indigo-600' : 'border-transparent'}`}><img src={foto.url} alt="" className="h-full w-full object-cover" loading="lazy" /></button>)}</div>}
          <div className="p-5 text-center">
            <h2 className="text-2xl font-black text-slate-900">{vehiculo.marca} {vehiculo.modelo}</h2><p className="mt-1 text-sm font-bold text-slate-500">{vehiculo.version || 'Sin versión'} · {vehiculo.anio || 'S/A'} · {Number(vehiculo.km || 0).toLocaleString('es-AR')} km</p>
            <div className="mt-4 inline-flex min-w-56 flex-col items-center rounded-2xl bg-slate-900 px-6 py-3 text-white shadow-lg"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Precio actual</p>{pwaConfig.showArsPrices && <p className="mt-1 text-2xl font-black">$ {money(currentArs)} ARS</p>}{pwaConfig.showUsdPrices && <p className="mt-0.5 text-sm font-black text-emerald-300">USD {money(currentUsd, 2)}</p>}</div>
          </div>
        </section>

        {reserva && <section className="space-y-4 rounded-3xl border border-orange-200 bg-orange-50 p-5"><div className="flex items-start gap-3"><BookmarkCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" /><div><p className="text-xs font-black uppercase tracking-widest text-orange-600">Reserva activa</p>{pwaConfig.showReservationOwner && <p className="mt-1 font-black text-orange-950">{reserva.cliente_nombre}</p>}<p className="mt-1 text-xs text-orange-700">{reserva.recibo_nro || `Reserva #${reserva.id_senia}`}</p></div></div><div className="rounded-2xl border border-orange-100 bg-white p-4"><p className="text-[10px] font-black uppercase text-slate-400">Seña abonada</p>{pwaConfig.showArsPrices && <p className="mt-1 font-black text-slate-900">$ {money(reserva.monto_ars)} ARS</p>}{pwaConfig.showUsdPrices && <p className="text-xs font-bold text-slate-500">USD {money(reserva.monto_usd, 2)} al TC $ {money(reserva.cotizacion_reserva, 2)}</p>}</div>{original && <div className="grid grid-cols-1 gap-3"><div className="rounded-2xl border border-orange-100 bg-white p-4"><p className="text-[10px] font-black uppercase text-orange-600">Cotización reservada</p>{pwaConfig.showArsPrices && <p className="mt-1 text-lg font-black text-slate-900">$ {money(originalArs)} ARS</p>}{pwaConfig.showUsdPrices && <p className="text-xs font-bold text-slate-500">USD {money(original.precio_usd, 2)} · TC $ {money(original.rate, 2)}</p>}</div><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-[10px] font-black uppercase text-blue-600">Cotización actual</p>{pwaConfig.showArsPrices && <p className="mt-1 text-lg font-black text-blue-950">$ {money(currentArs)} ARS</p>}{pwaConfig.showUsdPrices && <p className="text-xs font-bold text-blue-700">USD {money(currentUsd, 2)} · TC $ {money(dolarActual, 2)}</p>}</div></div>}</section>}

        <section className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-black uppercase tracking-widest text-slate-400"><Info className="h-4 w-4" /> Información de la unidad</h3><div className="grid grid-cols-2 gap-3"><InfoBox label="Año" value={vehiculo.anio || 'S/A'} /><InfoBox label="Kilómetros" value={`${Number(vehiculo.km || 0).toLocaleString('es-AR')} km`} /><InfoBox label="Patente" value={vehiculo.patente || 'S/P'} /><InfoBox label="Color" value={vehiculo.color || 'S/D'} /><InfoBox label="Motor" value={vehiculo.motor || 'S/D'} /><InfoBox label="Transmisión" value={vehiculo.transmision || 'S/D'} /></div></section>

        {pwaConfig.showCostAndMargin && <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><TrendingUp className="h-4 w-4" /> Rentabilidad interna</h3><div className="grid grid-cols-2 gap-3"><Metric label="Costo" ars={costArs} usd={costUsd} config={pwaConfig} /><Metric label="Margen potencial" ars={marginArs} usd={marginUsd} config={pwaConfig} /></div></section>}

        {pwaConfig.showNotes && <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><MessageSquare className="h-4 w-4" /> Bitácora / notas</h3><div className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-200 bg-white p-2 shadow-sm"><input type="text" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Escribir una nota..." className="flex-1 bg-transparent p-3 text-sm font-medium text-slate-700 outline-none" /><button onClick={handleGuardarNota} disabled={isSaving || !nota.trim()} className="rounded-xl bg-amber-500 p-3 font-black text-white transition-all active:scale-95 disabled:opacity-50">{isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}</button></div><div className="space-y-3">{anotaciones.length === 0 ? <p className="py-4 text-center text-sm font-bold text-amber-600/60">Sin anotaciones.</p> : anotaciones.map((n: any) => <div key={n.id_anotacion} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"><p className="whitespace-pre-wrap text-sm font-bold leading-relaxed text-slate-800">{n.texto}</p><div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3"><div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400"><UserCircle className="h-3.5 w-3.5" />{n.usuario?.nombre || n.usuario?.name || 'Usuario'}</div><div className="text-[10px] font-bold uppercase text-slate-400">{new Date(n.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} hs</div></div></div>)}</div></section>}
      </main>

      <div className="fixed bottom-0 left-0 w-full border-t border-slate-200 bg-white p-4 pb-safe"><Link href={`/pwa/cotizador?v=${vehiculo.id_vehiculo}`} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand,#4f46e5)] p-4 font-black text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"><Calculator className="h-6 w-6" /> Crear cotización</Link></div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><span className="block text-[10px] font-bold uppercase text-slate-400">{label}</span><span className="mt-1 block text-sm font-black text-slate-700">{value}</span></div>; }
function Metric({ label, ars, usd, config }: { label: string; ars: number; usd: number; config: SellerPwaConfig }) { return <div className="rounded-2xl border border-emerald-100 bg-white p-3"><p className="text-[10px] font-black uppercase text-emerald-700">{label}</p>{config.showArsPrices && <p className="mt-1 font-black text-slate-900">$ {Number(ars || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>}{config.showUsdPrices && <p className="text-xs font-bold text-slate-500">USD {Number(usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>}</div>; }
