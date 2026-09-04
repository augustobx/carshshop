'use client';

import { useState } from 'react';
import { agregarAnotacion } from '@/actions/anotaciones';
import { ArrowLeft, BookmarkCheck, Calculator, CarFront, Info, Loader2, MessageSquare, Plus, TrendingUp, UserCircle } from 'lucide-react';
import Link from 'next/link';
import type { SellerPwaConfig } from '@/lib/seller-pwa-config';

export default function VehiculoMobileClient({ vehiculo, dolarActual, pwaConfig }: { vehiculo: any; dolarActual: number; pwaConfig: SellerPwaConfig }) {
  const [nota, setNota] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const money = (amount: number, digits = 0) => Number(amount || 0).toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const handleGuardarNota = async () => {
    if (!nota.trim()) return;
    setIsSaving(true);
    const res = await agregarAnotacion(vehiculo.id_vehiculo, nota);
    if (res.success) setNota(''); else alert(res.error);
    setIsSaving(false);
  };

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
      <header className="bg-white sticky top-0 z-50 border-b border-slate-200 px-4 py-4 flex items-center justify-between shadow-sm">
        <Link href="/pwa/dashboard" className="p-2 bg-slate-100 rounded-full text-slate-700"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-base font-black text-slate-800 uppercase tracking-wider">Ficha de unidad</h1>
        <div className="w-9" />
      </header>

      <main className="p-4 space-y-4">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><CarFront className="w-8 h-8" /></div>
          <h2 className="text-2xl font-black text-slate-800">{vehiculo.marca}</h2>
          <p className="text-lg text-slate-500 font-bold">{vehiculo.modelo}{vehiculo.version ? ` ${vehiculo.version}` : ''}</p>
          <p className="text-xs font-black uppercase text-slate-400 mt-2">{String(vehiculo.estado).replace(/_/g, ' ')}</p>

          <div className="mt-5 inline-flex flex-col items-center bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-lg min-w-56">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Precio actual</p>
            {pwaConfig.showArsPrices && <p className="text-2xl font-black mt-1">$ {money(currentArs)} ARS</p>}
            {pwaConfig.showUsdPrices && <p className="text-sm font-black text-emerald-300 mt-0.5">USD {money(currentUsd, 2)}</p>}
          </div>
        </section>

        {reserva && <section className="bg-orange-50 border border-orange-200 rounded-3xl p-5 space-y-4">
          <div className="flex items-start gap-3"><BookmarkCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" /><div><p className="text-xs uppercase tracking-widest font-black text-orange-600">Reserva activa</p>{pwaConfig.showReservationOwner && <p className="font-black text-orange-950 mt-1">{reserva.cliente_nombre}</p>}<p className="text-xs text-orange-700 mt-1">{reserva.recibo_nro || `Reserva #${reserva.id_senia}`}</p></div></div>
          <div className="rounded-2xl bg-white border border-orange-100 p-4"><p className="text-[10px] uppercase font-black text-slate-400">Seña abonada</p>{pwaConfig.showArsPrices && <p className="font-black text-slate-900 mt-1">$ {money(reserva.monto_ars)} ARS</p>}{pwaConfig.showUsdPrices && <p className="text-xs font-bold text-slate-500">USD {money(reserva.monto_usd, 2)} al TC $ {money(reserva.cotizacion_reserva, 2)}</p>}</div>
          {original && <div className="grid grid-cols-1 gap-3">
            <div className="rounded-2xl bg-white border border-orange-100 p-4"><p className="text-[10px] uppercase font-black text-orange-600">Cotización reservada</p>{pwaConfig.showArsPrices && <p className="text-lg font-black text-slate-900 mt-1">$ {money(originalArs)} ARS</p>}{pwaConfig.showUsdPrices && <p className="text-xs font-bold text-slate-500">USD {money(original.precio_usd, 2)} · TC $ {money(original.rate, 2)}</p>}</div>
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4"><p className="text-[10px] uppercase font-black text-blue-600">Cotización actual</p>{pwaConfig.showArsPrices && <p className="text-lg font-black text-blue-950 mt-1">$ {money(currentArs)} ARS</p>}{pwaConfig.showUsdPrices && <p className="text-xs font-bold text-blue-700">USD {money(currentUsd, 2)} · TC $ {money(dolarActual, 2)}</p>}</div>
          </div>}
        </section>}

        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2"><Info className="w-4 h-4" /> Información de la unidad</h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoBox label="Año" value={vehiculo.anio || 'S/A'} />
            <InfoBox label="Kilómetros" value={`${Number(vehiculo.km || 0).toLocaleString('es-AR')} km`} />
            <InfoBox label="Patente" value={vehiculo.patente || 'S/P'} />
            <InfoBox label="Color" value={vehiculo.color || 'S/D'} />
            <InfoBox label="Motor" value={vehiculo.motor || 'S/D'} />
            <InfoBox label="Transmisión" value={vehiculo.transmision || 'S/D'} />
          </div>
        </section>

        {pwaConfig.showCostAndMargin && <section className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5">
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4" /> Rentabilidad interna</h3>
          <div className="grid grid-cols-2 gap-3"><Metric label="Costo" ars={costArs} usd={costUsd} config={pwaConfig} /><Metric label="Margen potencial" ars={marginArs} usd={marginUsd} config={pwaConfig} /></div>
        </section>}

        {pwaConfig.showNotes && <section className="bg-amber-50 p-5 rounded-3xl shadow-sm border border-amber-200">
          <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4" /> Bitácora / notas</h3>
          <div className="bg-white p-2 rounded-2xl border border-amber-200 shadow-sm mb-5 flex items-center gap-2">
            <input type="text" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Escribir una nota..." className="flex-1 bg-transparent p-3 text-sm font-medium outline-none text-slate-700" />
            <button onClick={handleGuardarNota} disabled={isSaving || !nota.trim()} className="p-3 bg-amber-500 text-white rounded-xl font-black disabled:opacity-50 active:scale-95 transition-all">{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}</button>
          </div>
          <div className="space-y-3">{anotaciones.length === 0 ? <p className="text-center text-amber-600/60 font-bold text-sm py-4">Sin anotaciones.</p> : anotaciones.map((n: any) => <div key={n.id_anotacion} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm"><p className="text-sm font-bold text-slate-800 whitespace-pre-wrap leading-relaxed">{n.texto}</p><div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50"><div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400"><UserCircle className="w-3.5 h-3.5" />{n.usuario?.nombre || n.usuario?.name || 'Usuario'}</div><div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(n.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} hs</div></div></div>)}</div>
        </section>}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-safe">
        <Link href={`/pwa/cotizador?v=${vehiculo.id_vehiculo}`} className="w-full bg-[var(--color-brand,#4f46e5)] text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"><Calculator className="w-6 h-6" /> Crear cotización</Link>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase block">{label}</span><span className="font-black text-slate-700 text-sm block mt-1">{value}</span></div>;
}

function Metric({ label, ars, usd, config }: { label: string; ars: number; usd: number; config: SellerPwaConfig }) {
  return <div className="bg-white rounded-2xl border border-emerald-100 p-3"><p className="text-[10px] uppercase font-black text-emerald-700">{label}</p>{config.showArsPrices && <p className="font-black text-slate-900 mt-1">$ {Number(ars || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>}{config.showUsdPrices && <p className="text-xs font-bold text-slate-500">USD {Number(usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>}</div>;
}
