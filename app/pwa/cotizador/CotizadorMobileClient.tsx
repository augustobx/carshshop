'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, BookmarkCheck, Calculator, CheckCircle2, Clock3, FileText, Loader2, Plus, RefreshCw, ShoppingCart, UserPlus } from 'lucide-react';
import { guardarCotizacionPwa } from '@/actions/pwa';
import { guardarCliente } from '@/actions/clientes';
import { registrarVenta } from '@/actions/ventas';
import SearchCombobox from '@/components/common/SearchCombobox';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import type { SellerPwaConfig } from '@/lib/seller-pwa-config';
import PwaBottomNav from '../PwaBottomNav';

type PricingMode = 'SAVED' | 'CURRENT' | '';

type Props = {
  vehiculos: any[];
  clientes: any[];
  dolarActual: number;
  tnaFinanciacion: number;
  reservasActivas: any[];
  initialVehicleId?: string;
  initialOperation?: any | null;
  mode?: 'quote' | 'sale';
  pwaConfig: SellerPwaConfig;
};

function toInput(value: number | null | undefined) {
  return Number(value || 0) > 0 ? String(Number(Number(value).toFixed(2))) : '';
}

function MoneyLines({ ars, usd, config }: { ars: number; usd: number; config: SellerPwaConfig }) {
  return <div>{config.showArsPrices && <p className="font-black text-slate-900">$ {Number(ars || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>}{config.showUsdPrices && <p className="text-xs font-black text-emerald-700">USD {Number(usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>}</div>;
}

function MoneyInput({ label, value, rate, config, onChange, helper }: { label: string; value: { ars: string; usd: string }; rate: number; config: SellerPwaConfig; onChange: (v: { ars: string; usd: string }) => void; helper?: string }) {
  if (config.showArsPrices && config.showUsdPrices) return <DualCurrencyInput label={label} ars={value.ars} usd={value.usd} rate={rate} onChange={onChange} helper={helper} />;
  if (config.showArsPrices) return <label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label} · ARS</span><input type="number" min="0" step="any" value={value.ars} onChange={(e) => { const ars = e.target.value; const n = Number(ars || 0); onChange({ ars, usd: rate > 0 && n > 0 ? String(Number((n / rate).toFixed(2))) : '' }); }} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-bold" />{helper && <span className="mt-1 block text-[10px] text-slate-400">{helper}</span>}</label>;
  return <label className="block"><span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label} · USD</span><input type="number" min="0" step="any" value={value.usd} onChange={(e) => { const usd = e.target.value; const n = Number(usd || 0); onChange({ usd, ars: rate > 0 && n > 0 ? String(Number((n * rate).toFixed(2))) : '' }); }} className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 font-bold" />{helper && <span className="mt-1 block text-[10px] text-slate-400">{helper}</span>}</label>;
}

export default function CotizadorMobileClient({ vehiculos, clientes, dolarActual, tnaFinanciacion, reservasActivas, initialVehicleId = '', initialOperation, mode = 'quote', pwaConfig }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [localClients, setLocalClients] = useState(clientes);
  const [vehiculoId, setVehiculoId] = useState(String(initialOperation?.id_vehiculo || initialVehicleId || ''));
  const [clienteId, setClienteId] = useState(String(initialOperation?.id_cliente || ''));
  const [pricingMode, setPricingMode] = useState<PricingMode>('');
  const [precio, setPrecio] = useState({ ars: '', usd: '' });
  const [formaPago, setFormaPago] = useState<'Contado' | 'Cuotas'>(initialOperation?.latestQuote?.forma_pago === 'Cuotas' ? 'Cuotas' : 'Contado');
  const [anticipo, setAnticipo] = useState({ ars: '', usd: '' });
  const [cantidadCuotas, setCantidadCuotas] = useState(String(initialOperation?.latestQuote?.cantidad_cuotas || 12));
  const [recargoPct, setRecargoPct] = useState(String(Number(tnaFinanciacion || 0)));
  const [fechaPrimerCuota, setFechaPrimerCuota] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); });
  const [validezDias, setValidezDias] = useState('7');
  const [proximaAccion, setProximaAccion] = useState(initialOperation?.proxima_accion ? String(initialOperation.proxima_accion).slice(0, 10) : (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().slice(0, 10); })());
  const [observaciones, setObservaciones] = useState(initialOperation?.latestQuote?.observaciones || initialOperation?.notas || '');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ nombre_completo: '', dni: '', telefono: '', email: '' });
  const [creatingClient, setCreatingClient] = useState(false);

  const vehiculo = useMemo(() => vehiculos.find((v) => String(v.id_vehiculo) === vehiculoId) || null, [vehiculos, vehiculoId]);
  const cliente = useMemo(() => localClients.find((c) => String(c.id_cliente) === clienteId) || null, [localClients, clienteId]);
  const vehicleReservation = useMemo(() => reservasActivas.find((s) => String(s.id_vehiculo) === vehiculoId) || null, [reservasActivas, vehiculoId]);
  const activeReservation = useMemo(() => vehicleReservation && String(vehicleReservation.id_cliente) === clienteId ? vehicleReservation : null, [vehicleReservation, clienteId]);
  const reservationMismatch = Boolean(vehicleReservation && clienteId && String(vehicleReservation.id_cliente) !== clienteId);
  const savedQuote = activeReservation?.cotizacion_original || initialOperation?.latestQuote || null;

  const vehicleOptions = useMemo(() => vehiculos.map((v) => {
    const r = reservasActivas.find((s) => s.id_vehiculo === v.id_vehiculo);
    const parts = [`${v.tipo_vehiculo} · ${v.anio || 'S/A'} · ${v.patente || 'S/P'}`];
    if (r) parts.push(pwaConfig.showReservationOwner ? `RESERVADO: ${r.cliente_nombre}` : 'RESERVADO');
    if (pwaConfig.showArsPrices) parts.push(`$ ${Number(v.precio_venta_ars || 0).toLocaleString('es-AR')} ARS`);
    if (pwaConfig.showUsdPrices) parts.push(`USD ${Number(v.precio_venta_usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`);
    return { value: String(v.id_vehiculo), label: `${v.marca} ${v.modelo}${v.version ? ` ${v.version}` : ''}`, description: parts.join(' · '), searchText: `${v.marca} ${v.modelo} ${v.version || ''} ${v.patente || ''} ${v.anio || ''}` };
  }), [vehiculos, reservasActivas, pwaConfig]);

  const clientOptions = useMemo(() => localClients.map((c) => ({ value: String(c.id_cliente), label: c.nombre_completo, description: `DNI ${c.dni || 'S/D'}${c.telefono ? ` · ${c.telefono}` : ''}`, searchText: `${c.nombre_completo} ${c.dni || ''} ${c.cuit_cuil || ''} ${c.telefono || ''} ${c.email || ''}` })), [localClients]);

  const applyCurrentPrice = (v: any) => {
    const usd = Number(v?.precio_venta_usd || 0);
    const ars = usd > 0 ? usd * dolarActual : Number(v?.precio_venta_ars || 0);
    setPrecio({ ars: toInput(ars), usd: toInput(usd || (dolarActual > 0 ? ars / dolarActual : 0)) });
    setPricingMode(mode === 'sale' && savedQuote ? 'CURRENT' : 'CURRENT');
  };

  const applySavedQuote = () => {
    if (!savedQuote) return;
    const rate = Number(savedQuote.rate || dolarActual);
    const usd = Number(savedQuote.precio_usd || 0);
    setPrecio({ ars: toInput(usd * rate), usd: toInput(usd) });
    setFormaPago(savedQuote.forma_pago === 'Cuotas' ? 'Cuotas' : 'Contado');
    const adv = Number(savedQuote.anticipo_usd || 0);
    setAnticipo({ ars: toInput(adv * rate), usd: toInput(adv) });
    if (savedQuote.cantidad_cuotas) setCantidadCuotas(String(savedQuote.cantidad_cuotas));
    setPricingMode('SAVED');
  };

  const selectVehicle = (id: string) => {
    setVehiculoId(id);
    const v = vehiculos.find((x) => String(x.id_vehiculo) === id);
    const r = reservasActivas.find((s) => String(s.id_vehiculo) === id);
    if (mode === 'sale' && r) setClienteId(String(r.id_cliente));
    if (v) applyCurrentPrice(v);
  };

  useEffect(() => {
    if (!vehiculo || precio.ars || precio.usd) return;
    if (mode === 'sale' && savedQuote) {
      setPricingMode('');
      return;
    }
    applyCurrentPrice(vehiculo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculo?.id_vehiculo]);

  useEffect(() => {
    if (formaPago !== 'Cuotas') return;
    if (activeReservation) {
      const rate = pricingMode === 'SAVED' && savedQuote ? Number(savedQuote.rate || dolarActual) : dolarActual;
      const ars = Number(activeReservation.monto_ars || 0);
      setAnticipo({ ars: toInput(ars), usd: toInput(rate > 0 ? ars / rate : 0) });
    } else if (initialOperation?.latestQuote?.anticipo_usd && !anticipo.usd) {
      const usd = Number(initialOperation.latestQuote.anticipo_usd || 0);
      setAnticipo({ ars: toInput(usd * dolarActual), usd: toInput(usd) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formaPago, activeReservation?.id_senia, pricingMode]);

  const rate = mode === 'sale' && pricingMode === 'SAVED' && savedQuote ? Number(savedQuote.rate || dolarActual) : dolarActual;
  const finalArs = Number(precio.ars || 0);
  const finalUsd = Number(precio.usd || 0);
  const advanceArs = formaPago === 'Cuotas' ? Number(anticipo.ars || 0) : 0;
  const advanceUsd = formaPago === 'Cuotas' ? Number(anticipo.usd || 0) : 0;
  const capitalArs = formaPago === 'Cuotas' ? Math.max(0, finalArs - advanceArs) : 0;
  const capitalUsd = rate > 0 ? capitalArs / rate : 0;
  const count = Math.max(1, Number(cantidadCuotas || 1));
  const surcharge = Math.max(0, Number(recargoPct || 0)) / 100;
  const installmentArs = formaPago === 'Cuotas' ? capitalArs * (1 + surcharge) / count : 0;
  const installmentUsd = rate > 0 ? installmentArs / rate : 0;

  const createClient = async () => {
    if (!newClient.nombre_completo.trim()) return alert('Ingresá el nombre del cliente.');
    setCreatingClient(true);
    const res = await guardarCliente(newClient);
    setCreatingClient(false);
    if (!res.success || !res.id_cliente) return alert(res.error || 'No se pudo crear el cliente.');
    const added = { id_cliente: res.id_cliente, ...newClient, cuit_cuil: null };
    setLocalClients((prev) => [...prev, added]);
    setClienteId(String(res.id_cliente));
    setShowNewClient(false);
  };

  const saveQuote = async () => {
    if (!vehiculo || !cliente || finalUsd <= 0 || finalArs <= 0) return alert('Seleccioná cliente, vehículo y precio.');
    if (reservationMismatch) return alert(pwaConfig.showReservationOwner ? `La unidad está reservada por ${vehicleReservation.cliente_nombre}. Elegí otra unidad o ese cliente.` : 'La unidad tiene una reserva activa para otro cliente.');
    if (formaPago === 'Cuotas' && advanceArs >= finalArs) return alert('El anticipo debe ser menor al precio final.');
    setSubmitting(true);
    const res = await guardarCotizacionPwa({
      prospectoId: initialOperation?.id_prospecto || undefined,
      id_cliente: Number(cliente.id_cliente),
      id_vehiculo: Number(vehiculo.id_vehiculo),
      precio_final_usd: Number(finalUsd.toFixed(2)),
      cotizacion_dolar: dolarActual,
      forma_pago: formaPago,
      anticipo_usd: formaPago === 'Cuotas' ? Number(advanceUsd.toFixed(2)) : 0,
      cantidad_cuotas: formaPago === 'Cuotas' ? count : undefined,
      valor_cuota_usd: formaPago === 'Cuotas' ? Number(installmentUsd.toFixed(2)) : undefined,
      observaciones: observaciones || undefined,
      validez_dias: Number(validezDias || 7),
      proxima_accion: proximaAccion || undefined,
    });
    setSubmitting(false);
    if (!res.success || !res.id_prospecto) return alert(res.error || 'No se pudo guardar la cotización.');
    router.replace(`/pwa/operaciones/${res.id_prospecto}`);
  };

  const buildInstallments = () => {
    if (formaPago !== 'Cuotas') return undefined;
    const base = new Date(`${fechaPrimerCuota}T12:00:00`);
    return Array.from({ length: count }, (_, i) => { const d = new Date(base); d.setMonth(d.getMonth() + i); return { numero_cuota: i + 1, monto_usd: Number(installmentUsd.toFixed(2)), fecha_vencimiento: d.toISOString() }; });
  };

  const closeSale = async () => {
    if (!pwaConfig.allowCloseSales) return alert('El cierre de ventas está deshabilitado para vendedores.');
    if (!initialOperation?.id_prospecto) return alert('Primero guardá una cotización para crear la operación.');
    if (!vehiculo || !cliente || finalUsd <= 0 || finalArs <= 0) return alert('Faltan datos de la operación.');
    if (reservationMismatch) return alert('La unidad tiene una reserva activa para otro cliente.');
    if (savedQuote && !pricingMode) return alert('Elegí si cerrás con la cotización guardada o con el precio vigente.');
    if (formaPago === 'Cuotas' && advanceArs >= finalArs) return alert('El anticipo debe ser menor al precio final.');
    setSubmitting(true);
    const res = await registrarVenta({
      id_vehiculo: Number(vehiculo.id_vehiculo), id_cliente: Number(cliente.id_cliente), precio_final_usd: Number(finalUsd.toFixed(2)), cotizacion_dolar: rate, forma_pago: formaPago,
      anticipo_usd: formaPago === 'Cuotas' ? Number(advanceUsd.toFixed(2)) : 0,
      saldo_financiado_usd: formaPago === 'Cuotas' ? Number(capitalUsd.toFixed(2)) : 0,
      prospectoId: initialOperation.id_prospecto,
      cotizacionId: pricingMode === 'SAVED' ? Number(savedQuote?.id_cotizacion || savedQuote?.id || 0) || undefined : undefined,
      usarCotizacionReserva: Boolean(activeReservation && pricingMode === 'SAVED'),
      cuotas: buildInstallments(),
      observaciones: `Cierre desde PWA. ${pricingMode === 'SAVED' ? 'Se respetó la cotización guardada.' : 'Se aplicó el valor vigente.'}${observaciones ? ` ${observaciones}` : ''}`,
    });
    setSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo cerrar la venta.');
    router.replace(`/pwa/operaciones/${initialOperation.id_prospecto}`);
  };

  const canNext1 = Boolean(vehiculo && cliente && !reservationMismatch);
  const requiresPricingChoice = mode === 'sale' && Boolean(savedQuote);
  const canNext2 = finalArs > 0 && finalUsd > 0 && (!requiresPricingChoice || Boolean(pricingMode));

  return <div className="min-h-screen bg-slate-50 pb-28">
    <header className="sticky top-0 z-40 rounded-b-3xl bg-slate-950 px-4 py-4 text-white shadow-lg">
      <div className="flex items-center justify-between"><button onClick={() => step > 1 ? setStep(step - 1) : router.replace(mode === 'sale' && initialOperation ? `/pwa/operaciones/${initialOperation.id_prospecto}` : '/pwa/dashboard')} className="rounded-xl bg-white/10 p-2"><ArrowLeft className="h-5 w-5" /></button><div className="text-center"><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">OnlyCars Sales</p><h1 className="text-lg font-black">{mode === 'sale' ? 'Preparar cierre' : 'Nueva cotización'}</h1></div><span className="text-xs font-black text-emerald-400">$ {dolarActual.toLocaleString('es-AR')}</span></div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-blue-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} /></div>
    </header>

    <main className="space-y-4 p-4">
      {step === 1 && <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2"><Calculator className="h-5 w-5 text-blue-600" /><div><h2 className="font-black text-slate-900">Cliente y unidad</h2><p className="text-xs text-slate-500">Una cotización siempre queda asociada a una oportunidad.</p></div></div>
        <SearchCombobox label="Vehículo *" value={vehiculoId} onChange={selectVehicle} options={vehicleOptions} placeholder="Buscar vehículo..." required />
        <SearchCombobox label="Cliente *" value={clienteId} onChange={setClienteId} options={clientOptions} placeholder="Buscar cliente..." required />
        {!initialOperation && <button type="button" onClick={() => setShowNewClient((v) => !v)} className="flex items-center gap-2 text-xs font-black text-blue-700"><UserPlus className="h-4 w-4" /> Cliente nuevo</button>}
        {showNewClient && <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-black text-blue-900">Alta rápida de cliente</p><input value={newClient.nombre_completo} onChange={(e) => setNewClient({ ...newClient, nombre_completo: e.target.value })} placeholder="Nombre completo *" className="w-full rounded-xl border p-3 text-sm" /><div className="grid grid-cols-2 gap-2"><input value={newClient.dni} onChange={(e) => setNewClient({ ...newClient, dni: e.target.value })} placeholder="DNI" className="w-full rounded-xl border p-3 text-sm" /><input value={newClient.telefono} onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })} placeholder="Teléfono" className="w-full rounded-xl border p-3 text-sm" /></div><input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="Email" className="w-full rounded-xl border p-3 text-sm" /><button type="button" onClick={createClient} disabled={creatingClient} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-black text-white disabled:opacity-50">{creatingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear y seleccionar</button></div>}
        {vehicleReservation && <div className={`rounded-2xl border p-3 ${reservationMismatch ? 'border-red-200 bg-red-50 text-red-800' : 'border-orange-200 bg-orange-50 text-orange-800'}`}><div className="flex items-center gap-2"><BookmarkCheck className="h-5 w-5" /><div><p className="text-xs font-black uppercase">Unidad reservada</p>{pwaConfig.showReservationOwner && <p className="text-sm font-bold">{vehicleReservation.cliente_nombre}</p>}</div></div>{reservationMismatch && <p className="mt-2 text-xs font-bold">No puede cotizarse/cerrarse para otro cliente mientras la reserva siga activa.</p>}</div>}
      </section>}

      {step === 2 && <section className="space-y-4">
        {mode === 'sale' && savedQuote && <section className="space-y-3 rounded-3xl border border-indigo-200 bg-indigo-50 p-5"><div><h2 className="font-black text-indigo-950">¿Qué valor respetamos?</h2><p className="text-xs text-indigo-700">Antes de vender elegí explícitamente la cotización guardada o el precio vigente.</p></div><button type="button" onClick={applySavedQuote} className={`w-full rounded-2xl border p-4 text-left ${pricingMode === 'SAVED' ? 'border-indigo-600 bg-white ring-2 ring-indigo-200' : 'border-indigo-200 bg-white/60'}`}><div className="flex items-center gap-2 text-xs font-black text-indigo-700"><Clock3 className="h-4 w-4" /> Cotización guardada · TC $ {Number(savedQuote.rate || 0).toLocaleString('es-AR')}</div><div className="mt-2"><MoneyLines ars={Number(savedQuote.precio_usd || 0) * Number(savedQuote.rate || 0)} usd={Number(savedQuote.precio_usd || 0)} config={pwaConfig} /></div></button><button type="button" onClick={() => vehiculo && applyCurrentPrice(vehiculo)} className={`w-full rounded-2xl border p-4 text-left ${pricingMode === 'CURRENT' ? 'border-emerald-600 bg-white ring-2 ring-emerald-100' : 'border-emerald-200 bg-white/60'}`}><div className="flex items-center gap-2 text-xs font-black text-emerald-700"><RefreshCw className="h-4 w-4" /> Valor vigente · TC $ {dolarActual.toLocaleString('es-AR')}</div>{vehiculo && <div className="mt-2"><MoneyLines ars={vehiculo.precio_venta_ars} usd={vehiculo.precio_venta_usd} config={pwaConfig} /></div>}</button></section>}

        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div><h2 className="font-black text-slate-900">Propuesta comercial</h2><p className="text-xs text-slate-500">Definí el precio y condiciones que se le ofrecen al cliente.</p></div><MoneyInput label="Precio cotizado" value={precio} rate={rate} config={pwaConfig} onChange={setPrecio} /><div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5"><button type="button" onClick={() => setFormaPago('Contado')} className={`rounded-xl py-3 text-sm font-black ${formaPago === 'Contado' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Contado</button><button type="button" onClick={() => setFormaPago('Cuotas')} className={`rounded-xl py-3 text-sm font-black ${formaPago === 'Cuotas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>Financiado</button></div>{formaPago === 'Cuotas' && <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"><MoneyInput label="Anticipo" value={anticipo} rate={rate} config={pwaConfig} onChange={setAnticipo} helper={activeReservation ? 'La seña ya cobrada se toma como mínimo del anticipo.' : undefined} /><div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase text-slate-500">Cuotas</span><input type="number" min="1" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} className="mt-1.5 w-full rounded-xl border p-3" /></label><label><span className="text-[10px] font-black uppercase text-slate-500">Tasa / recargo %</span><input type="number" min="0" step="0.01" value={recargoPct} onChange={(e) => setRecargoPct(e.target.value)} className="mt-1.5 w-full rounded-xl border p-3" /><span className="mt-1 block text-[9px] text-slate-400">Configurado: {Number(tnaFinanciacion || 0).toLocaleString('es-AR')}%</span></label></div><div className="rounded-xl bg-white p-3"><p className="text-[10px] font-black uppercase text-indigo-500">Estimación</p><MoneyLines ars={installmentArs} usd={installmentUsd} config={pwaConfig} /><p className="mt-1 text-[10px] font-bold text-indigo-700">{count} cuotas estimadas</p></div>{mode === 'sale' && <label><span className="text-[10px] font-black uppercase text-slate-500">Vencimiento primera cuota</span><input type="date" value={fechaPrimerCuota} onChange={(e) => setFechaPrimerCuota(e.target.value)} className="mt-1.5 w-full rounded-xl border p-3" /></label>}</div>}</section>
      </section>}

      {step === 3 && <section className="space-y-4">
        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-xl"><p className="text-[10px] font-black uppercase tracking-widest text-blue-400">{mode === 'sale' ? 'Confirmación de cierre' : 'Resumen de cotización'}</p><h2 className="mt-1 text-xl font-black">{vehiculo?.marca} {vehiculo?.modelo}</h2><p className="text-sm font-bold text-slate-400">{cliente?.nombre_completo}</p><div className="my-4 border-y border-slate-800 py-4"><p className="text-[10px] font-black uppercase text-slate-500">Precio</p>{pwaConfig.showArsPrices && <p className="text-2xl font-black">$ {finalArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>}{pwaConfig.showUsdPrices && <p className="text-sm font-bold text-emerald-400">USD {finalUsd.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>}<p className="mt-1 text-[10px] text-slate-500">TC aplicado $ {rate.toLocaleString('es-AR')}</p></div>{formaPago === 'Cuotas' && <div className="rounded-2xl bg-white/5 p-4"><p className="text-[10px] font-black uppercase text-slate-500">Financiación</p><p className="mt-1 font-black">{count} cuotas</p><MoneyLines ars={installmentArs} usd={installmentUsd} config={pwaConfig} /></div>}</section>

        {mode === 'quote' ? <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><div><h2 className="font-black text-slate-900">Guardar para seguimiento</h2><p className="text-xs text-slate-500">La operación queda abierta; no registra una venta.</p></div></div><div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-black uppercase text-slate-500">Validez (días)</span><input type="number" min="1" max="90" value={validezDias} onChange={(e) => setValidezDias(e.target.value)} className="mt-1.5 w-full rounded-xl border p-3" /></label><label><span className="text-[10px] font-black uppercase text-slate-500">Próximo contacto</span><input type="date" value={proximaAccion} onChange={(e) => setProximaAccion(e.target.value)} className="mt-1.5 w-full rounded-xl border p-3" /></label></div><label><span className="text-[10px] font-black uppercase text-slate-500">Notas</span><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Interés, objeciones, condiciones habladas..." className="mt-1.5 min-h-24 w-full rounded-xl border p-3 text-sm" /></label><button onClick={saveQuote} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-black text-white disabled:opacity-50">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} Guardar cotización</button></section> : <section className="space-y-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-2"><ShoppingCart className="h-5 w-5 text-emerald-700" /><div><h2 className="font-black text-emerald-950">Cerrar venta</h2><p className="text-xs text-emerald-700">Sólo llegaste acá desde una operación ya creada.</p></div></div><button onClick={closeSale} disabled={submitting || !pwaConfig.allowCloseSales} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-black text-white disabled:opacity-50">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />} Confirmar venta</button></section>}
      </section>}
    </main>

    <div className="fixed bottom-[68px] left-0 right-0 z-40 mx-auto max-w-md px-4">{step < 3 && <button onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={step === 1 ? !canNext1 : !canNext2} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 font-black text-white shadow-xl disabled:opacity-40">Continuar <ArrowRight className="h-5 w-5" /></button>}</div>
    <PwaBottomNav active="quote" />
  </div>;
}
