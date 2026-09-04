'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookmarkCheck, CalendarClock, CheckCircle2, Clock3, FileText, Loader2, MessageSquareText, RefreshCw, Share2, ShoppingCart, XCircle } from 'lucide-react';
import { EstadoProspecto } from '@prisma/client';
import { actualizarSeguimientoPwa } from '@/actions/pwa';
import { registrarReservaProspecto } from '@/actions/operaciones';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import type { SellerPwaConfig } from '@/lib/seller-pwa-config';
import PwaBottomNav from '../../PwaBottomNav';

function estadoLabel(v: string) {
  return ({ NUEVO: 'Nuevo', CONTACTADO: 'Contactado', VISITA_AGENDADA: 'Visita agendada', COTIZADO: 'Cotizado', NEGOCIACION: 'Negociación', PERMUTANDO: 'Permuta', RESERVADO: 'Reservado', GANADO: 'Vendido', PERDIDO: 'Perdido' } as Record<string, string>)[v] || v;
}

function Money({ ars, usd, config }: { ars: number; usd: number; config: SellerPwaConfig }) {
  return <div>{config.showArsPrices && <p className="text-lg font-black text-slate-900">$ {Number(ars || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>}{config.showUsdPrices && <p className="text-xs font-black text-emerald-700">USD {Number(usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>}</div>;
}

export default function OperacionMobileClient({ operacion, dolarActual, pwaConfig }: { operacion: any; dolarActual: number; pwaConfig: SellerPwaConfig }) {
  const router = useRouter();
  const latest = operacion.cotizaciones?.[0] || null;
  const quoteExpired = Boolean(latest?.validez && new Date(latest.validez).getTime() < Date.now());
  const closed = ['GANADO', 'PERDIDO'].includes(operacion.estado);
  const [savingFollowup, setSavingFollowup] = useState(false);
  const [savingReservation, setSavingReservation] = useState(false);
  const [notas, setNotas] = useState(operacion.notas || '');
  const [proxima, setProxima] = useState(operacion.proxima_accion ? String(operacion.proxima_accion).slice(0, 10) : '');
  const [reservaMonto, setReservaMonto] = useState({ ars: '', usd: '' });
  const [reservaLimite, setReservaLimite] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().slice(0, 10); });
  const reserveRate = Number(latest?.rate || dolarActual);

  const saveFollowup = async () => {
    setSavingFollowup(true);
    const res = await actualizarSeguimientoPwa({ prospectoId: operacion.id_prospecto, proxima_accion: proxima || undefined, notas, estado: operacion.estado === 'COTIZADO' ? EstadoProspecto.NEGOCIACION : undefined });
    setSavingFollowup(false);
    if (!res.success) return alert(res.error || 'No se pudo guardar.');
    router.refresh();
  };

  const reserve = async () => {
    if (!latest) return alert('Primero guardá una cotización.');
    if (quoteExpired) return alert('La cotización está vencida. Generá una nueva antes de reservar.');
    if (Number(reservaMonto.usd || 0) <= 0) return alert('Indicá el monto de la seña.');
    setSavingReservation(true);
    const res = await registrarReservaProspecto({ prospectoId: operacion.id_prospecto, cotizacionId: latest.id, monto_usd: Number(reservaMonto.usd), cotizacion_dolar: reserveRate, fecha_limite: reservaLimite || undefined });
    setSavingReservation(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar la reserva.');
    setReservaMonto({ ars: '', usd: '' });
    router.refresh();
  };

  const markLost = async () => {
    if (!confirm('¿Marcar esta oportunidad como perdida?')) return;
    const res = await actualizarSeguimientoPwa({ prospectoId: operacion.id_prospecto, estado: EstadoProspecto.PERDIDO, notas });
    if (!res.success) return alert(res.error || 'No se pudo cerrar la oportunidad.');
    router.replace('/pwa/operaciones');
  };

  const shareQuote = async () => {
    if (!latest) return;
    const lines = [
      `${operacion.vehiculo?.nombre || 'Vehículo'}`,
      pwaConfig.showArsPrices ? `$ ${Number(latest.ars).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS` : '',
      pwaConfig.showUsdPrices ? `USD ${Number(latest.usd).toLocaleString('es-AR', { maximumFractionDigits: 2 })}` : '',
      `Cotización dólar: $ ${Number(latest.rate).toLocaleString('es-AR')}`,
      latest.forma_pago === 'Cuotas' && latest.cantidad_cuotas ? `${latest.cantidad_cuotas} cuotas` : 'Contado',
      latest.validez ? `Válida hasta ${new Date(latest.validez).toLocaleDateString('es-AR')}` : '',
    ].filter(Boolean).join('\n');
    try {
      if (navigator.share) await navigator.share({ title: 'Cotización OnlyCars', text: lines });
      else { await navigator.clipboard.writeText(lines); alert('Cotización copiada.'); }
    } catch {}
  };

  return <div className="min-h-screen bg-slate-50 pb-28">
    <header className="sticky top-0 z-40 rounded-b-3xl bg-slate-950 px-4 py-4 text-white shadow-lg">
      <div className="flex items-center gap-3"><Link href="/pwa/operaciones" className="rounded-xl bg-white/10 p-2"><ArrowLeft className="h-5 w-5" /></Link><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Operación #{operacion.id_prospecto}</p><h1 className="truncate text-lg font-black">{operacion.nombre}</h1></div><span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${operacion.estado === 'RESERVADO' ? 'bg-orange-500/20 text-orange-300' : operacion.estado === 'GANADO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>{estadoLabel(operacion.estado)}</span></div>
    </header>

    <main className="space-y-4 p-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cliente</p><p className="mt-1 text-xl font-black text-slate-900">{operacion.nombre}</p>{operacion.telefono && <a href={`tel:${operacion.telefono}`} className="mt-1 block text-sm font-bold text-blue-700">{operacion.telefono}</a>}
        <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase text-slate-400">Unidad de interés</p><p className="mt-1 font-black text-slate-900">{operacion.vehiculo?.nombre || 'Sin vehículo'}</p><p className="text-xs font-bold text-slate-500">{operacion.vehiculo?.patente || ''}</p></div>
      </section>

      {latest && <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase text-blue-600">Última cotización #{latest.id}</p><p className="mt-1 text-xs font-bold text-blue-800">{new Date(latest.fecha).toLocaleDateString('es-AR')} · TC $ {Number(latest.rate).toLocaleString('es-AR')}</p></div>{quoteExpired ? <span className="rounded-lg bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">VENCIDA</span> : <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">VIGENTE</span>}</div>
        <div className="mt-3"><Money ars={latest.ars} usd={latest.usd} config={pwaConfig} /></div>
        <div className="mt-4 flex gap-2"><button onClick={shareQuote} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white py-2.5 text-xs font-black text-blue-700"><Share2 className="h-4 w-4" /> Compartir</button><Link href={`/pwa/cotizador?p=${operacion.id_prospecto}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white"><RefreshCw className="h-4 w-4" /> Nueva versión</Link></div>
      </section>}

      {!latest && !closed && <Link href={`/pwa/cotizador?p=${operacion.id_prospecto}`} className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 p-4 font-black text-white"><FileText className="h-5 w-5" /> Crear primera cotización</Link>}

      {operacion.reserva ? <section className="rounded-3xl border border-orange-200 bg-orange-50 p-5"><div className="flex items-center gap-2 text-orange-800"><BookmarkCheck className="h-5 w-5" /><h2 className="font-black">Reserva activa</h2></div><div className="mt-3"><Money ars={operacion.reserva.ars} usd={operacion.reserva.usd} config={pwaConfig} /></div><p className="mt-2 text-xs font-bold text-orange-700">TC reserva $ {Number(operacion.reserva.rate).toLocaleString('es-AR')}{operacion.reserva.limite ? ` · vence ${new Date(operacion.reserva.limite).toLocaleDateString('es-AR')}` : ''}</p>{pwaConfig.allowCloseSales && !operacion.venta && <Link href={`/pwa/cotizador?p=${operacion.id_prospecto}&mode=sale&q=${operacion.reserva.cotizacionId || latest?.id || ''}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-black text-white"><ShoppingCart className="h-5 w-5" /> Preparar cierre de venta</Link>}</section> : latest && !closed && !quoteExpired ? <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><BookmarkCheck className="h-5 w-5 text-orange-500" /><div><h2 className="font-black text-slate-900">Registrar reserva</h2><p className="text-xs text-slate-500">La reserva queda vinculada a esta cotización.</p></div></div><div className="mt-4 space-y-4"><DualCurrencyInput label="Seña" ars={reservaMonto.ars} usd={reservaMonto.usd} rate={reserveRate} onChange={setReservaMonto} required /><label className="block"><span className="text-[10px] font-black uppercase text-slate-500">Vigencia de la reserva</span><input type="date" value={reservaLimite} onChange={(e) => setReservaLimite(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm" /></label><button onClick={reserve} disabled={savingReservation} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-black text-white disabled:opacity-50">{savingReservation ? <Loader2 className="h-5 w-5 animate-spin" /> : <BookmarkCheck className="h-5 w-5" />} Confirmar reserva</button></div></section> : null}

      {!closed && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-indigo-600" /><div><h2 className="font-black text-slate-900">Seguimiento</h2><p className="text-xs text-slate-500">Qué hay que hacer después con este cliente.</p></div></div><div className="mt-4 space-y-3"><label className="block"><span className="text-[10px] font-black uppercase text-slate-500">Próxima acción</span><input type="date" value={proxima} onChange={(e) => setProxima(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm" /></label><label className="block"><span className="text-[10px] font-black uppercase text-slate-500">Notas comerciales</span><textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Qué habló el cliente, objeciones, próximo paso..." className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm" /></label><button onClick={saveFollowup} disabled={savingFollowup} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-black text-white disabled:opacity-50">{savingFollowup ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquareText className="h-5 w-5" />} Guardar seguimiento</button></div></section>}

      {operacion.cotizaciones?.length > 1 && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black text-slate-900">Historial de cotizaciones</h2><div className="mt-3 space-y-2">{operacion.cotizaciones.map((q: any) => <div key={q.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"><div><p className="text-xs font-black text-slate-800">#{q.id} · {new Date(q.fecha).toLocaleDateString('es-AR')}</p><p className="text-[10px] font-bold text-slate-400">TC $ {Number(q.rate).toLocaleString('es-AR')} · {q.estado}</p></div><Money ars={q.ars} usd={q.usd} config={pwaConfig} /></div>)}</div></section>}

      {operacion.venta && <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /><h2 className="font-black">Venta cerrada</h2></div><p className="mt-2 text-sm font-bold text-emerald-900">{operacion.venta.boleto || `Venta #${operacion.venta.id}`} · {new Date(operacion.venta.fecha).toLocaleDateString('es-AR')}</p></section>}

      {!closed && !operacion.reserva && <button onClick={markLost} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3 text-sm font-black text-red-600"><XCircle className="h-5 w-5" /> Marcar oportunidad perdida</button>}
    </main>

    <PwaBottomNav active="operations" />
  </div>;
}
