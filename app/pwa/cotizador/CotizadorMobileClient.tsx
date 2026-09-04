'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, BookmarkCheck, Calculator, CheckCircle2, Clock3, Loader2, RefreshCw } from 'lucide-react';
import { registrarVenta } from '@/actions/ventas';
import SearchCombobox from '@/components/common/SearchCombobox';
import type { SellerPwaConfig } from '@/lib/seller-pwa-config';

type PricingMode = 'ORIGINAL' | 'CURRENT' | '';

type Props = {
  vehiculos: any[];
  clientes: any[];
  dolarActual: number;
  tnaFinanciacion: number;
  reservasActivas: any[];
  initialVehicleId?: string;
  pwaConfig: SellerPwaConfig;
};

export default function CotizadorMobileClient({ vehiculos, clientes, dolarActual, tnaFinanciacion, reservasActivas, initialVehicleId = '', pwaConfig }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [vehiculoId, setVehiculoId] = useState(initialVehicleId);
  const [clienteId, setClienteId] = useState('');
  const [pricingMode, setPricingMode] = useState<PricingMode>('');
  const [precio, setPrecio] = useState({ ars: '', usd: '' });
  const [formaPago, setFormaPago] = useState<'Contado' | 'Cuotas'>('Contado');
  const [anticipo, setAnticipo] = useState({ ars: '', usd: '' });
  const [cantidadCuotas, setCantidadCuotas] = useState('12');
  const [recargoPct, setRecargoPct] = useState(String(Number(tnaFinanciacion || 0)));
  const [fechaPrimerCuota, setFechaPrimerCuota] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); });

  const vehiculo = useMemo(() => vehiculos.find((v) => String(v.id_vehiculo) === vehiculoId) || null, [vehiculos, vehiculoId]);
  const cliente = useMemo(() => clientes.find((c) => String(c.id_cliente) === clienteId) || null, [clientes, clienteId]);
  const vehicleReservation = useMemo(() => reservasActivas.find((s) => String(s.id_vehiculo) === vehiculoId) || null, [reservasActivas, vehiculoId]);
  const activeReservation = useMemo(() => vehicleReservation && String(vehicleReservation.id_cliente) === clienteId ? vehicleReservation : null, [vehicleReservation, clienteId]);
  const reservationMismatch = Boolean(vehicleReservation && clienteId && String(vehicleReservation.id_cliente) !== clienteId);
  const originalQuote = activeReservation?.cotizacion_original || null;

  const vehicleOptions = useMemo(() => vehiculos.map((v) => {
    const r = reservasActivas.find((s) => s.id_vehiculo === v.id_vehiculo);
    const parts = [`${v.tipo_vehiculo} · ${v.anio || 'S/A'} · ${v.patente || 'S/P'}`];
    if (r) parts.push(pwaConfig.showReservationOwner ? `RESERVADO: ${r.cliente_nombre}` : 'RESERVADO');
    if (pwaConfig.showArsPrices) parts.push(`$ ${Number(v.precio_venta_ars || 0).toLocaleString('es-AR')} ARS`);
    if (pwaConfig.showUsdPrices) parts.push(`USD ${Number(v.precio_venta_usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`);
    return {
      value: String(v.id_vehiculo),
      label: `${v.marca} ${v.modelo}${v.version ? ` ${v.version}` : ''}`,
      description: parts.join(' · '),
      searchText: `${v.marca} ${v.modelo} ${v.version || ''} ${v.patente || ''} ${v.anio || ''} ${pwaConfig.showReservationOwner ? r?.cliente_nombre || '' : ''}`,
    };
  }), [vehiculos, reservasActivas, pwaConfig]);

  const clientOptions = useMemo(() => clientes.map((c) => ({
    value: String(c.id_cliente),
    label: c.nombre_completo,
    description: `DNI ${c.dni || 'S/D'}${c.telefono ? ` · ${c.telefono}` : ''}`,
    searchText: `${c.nombre_completo} ${c.dni || ''} ${c.cuit_cuil || ''} ${c.telefono || ''}`,
  })), [clientes]);

  const applyCurrentPrice = (v: any) => {
    const usd = Number(v?.precio_venta_usd || 0);
    const ars = usd > 0 ? usd * dolarActual : Number(v?.precio_venta_ars || 0);
    setPrecio({ ars: String(Number(ars.toFixed(2))), usd: String(Number((usd || (dolarActual > 0 ? ars / dolarActual : 0)).toFixed(2))) });
    setPricingMode('CURRENT');
  };

  const selectVehicle = (id: string) => {
    setVehiculoId(id);
    const v = vehiculos.find((x) => String(x.id_vehiculo) === id);
    const r = reservasActivas.find((s) => String(s.id_vehiculo) === id);
    if (r) {
      setClienteId(String(r.id_cliente));
      setPricingMode(r.cotizacion_original ? '' : 'CURRENT');
      if (!r.cotizacion_original && v) applyCurrentPrice(v);
    } else {
      setClienteId('');
      if (v) applyCurrentPrice(v);
    }
  };

  useEffect(() => {
    if (initialVehicleId && vehiculo && !precio.ars && !precio.usd) selectVehicle(initialVehicleId);
    // Sólo inicializa el deep-link una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialVehicleId, vehiculo]);

  const selectPricing = (mode: Exclude<PricingMode, ''>) => {
    if (!vehiculo) return;
    if (mode === 'ORIGINAL' && originalQuote) {
      const rate = Number(originalQuote.rate || 0);
      const usd = Number(originalQuote.precio_usd || 0);
      setPrecio({ ars: String(Number((usd * rate).toFixed(2))), usd: String(Number(usd.toFixed(2))) });
      setPricingMode('ORIGINAL');
      return;
    }
    applyCurrentPrice(vehiculo);
  };

  const saleRate = pricingMode === 'ORIGINAL' && originalQuote ? Number(originalQuote.rate || dolarActual) : dolarActual;
  const finalArs = Number(precio.ars || 0);
  const finalUsd = Number(precio.usd || 0);
  const reservationArs = Number(activeReservation?.monto_ars || 0);
  const reservationUsdOriginal = Number(activeReservation?.monto_usd || 0);
  const reservationUsdApplied = activeReservation && saleRate > 0 ? reservationArs / saleRate : 0;

  useEffect(() => {
    if (!activeReservation || saleRate <= 0) return;
    setAnticipo({ ars: String(Number(reservationArs.toFixed(2))), usd: String(Number(reservationUsdApplied.toFixed(2))) });
  }, [activeReservation?.id_senia, saleRate]);

  const anticipoArs = formaPago === 'Cuotas' ? Number(anticipo.ars || 0) : finalArs;
  const anticipoUsd = formaPago === 'Cuotas' ? Number(anticipo.usd || 0) : finalUsd;
  const capitalArs = formaPago === 'Cuotas' ? Math.max(0, finalArs - anticipoArs) : 0;
  const capitalUsd = saleRate > 0 ? capitalArs / saleRate : 0;
  const cuotasN = Math.max(1, Number(cantidadCuotas || 1));
  const recargo = Math.max(0, Number(recargoPct || 0)) / 100;
  const totalFinanciadoArs = capitalArs * (1 + recargo);
  const cuotaArs = formaPago === 'Cuotas' ? totalFinanciadoArs / cuotasN : 0;
  const cuotaUsd = saleRate > 0 ? cuotaArs / saleRate : 0;
  const additionalDueArs = formaPago === 'Contado' ? Math.max(0, finalArs - reservationArs) : Math.max(0, anticipoArs - reservationArs);

  const plan = () => {
    if (formaPago !== 'Cuotas') return undefined;
    const base = new Date(`${fechaPrimerCuota}T12:00:00`);
    return Array.from({ length: cuotasN }, (_, index) => {
      const date = new Date(base); date.setMonth(date.getMonth() + index);
      return { numero_cuota: index + 1, monto_usd: Number(cuotaUsd.toFixed(2)), fecha_vencimiento: date.toISOString() };
    });
  };

  const confirmar = async () => {
    if (!pwaConfig.allowCloseSales) return alert('El cierre de ventas está deshabilitado para vendedores desde Configuración.');
    if (!vehiculo || !cliente || finalArs <= 0 || finalUsd <= 0) return alert('Seleccioná vehículo, cliente y precio final.');
    if (reservationMismatch) return alert(pwaConfig.showReservationOwner ? `Esta unidad está reservada por ${vehicleReservation.cliente_nombre}.` : 'Esta unidad tiene una reserva activa para otro cliente.');
    if (activeReservation?.cotizacion_original && !pricingMode) return alert('Elegí si respetás la cotización reservada o usás la cotización actual.');
    if (formaPago === 'Cuotas' && anticipoArs >= finalArs) return alert('El anticipo debe ser menor al precio final para financiar saldo.');

    setSubmitting(true);
    const res = await registrarVenta({
      id_vehiculo: vehiculo.id_vehiculo,
      id_cliente: cliente.id_cliente,
      precio_final_usd: Number(finalUsd.toFixed(2)),
      cotizacion_dolar: saleRate,
      forma_pago: formaPago,
      anticipo_usd: Number(anticipoUsd.toFixed(2)),
      saldo_financiado_usd: formaPago === 'Cuotas' ? Number(capitalUsd.toFixed(2)) : 0,
      prospectoId: activeReservation?.prospectoId || undefined,
      cotizacionId: pricingMode === 'ORIGINAL' ? activeReservation?.cotizacionId || undefined : undefined,
      observaciones: activeReservation ? `Reserva ${activeReservation.recibo_nro || `#${activeReservation.id_senia}`} aplicada. Cierre con ${pricingMode === 'ORIGINAL' ? 'cotización reservada' : 'cotización actual'}.` : undefined,
      cuotas: plan(),
    });
    setSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo cerrar la operación.');
    router.replace('/pwa/dashboard');
  };

  const canContinueStep1 = Boolean(vehiculo && cliente && !reservationMismatch);
  const pricingRequired = Boolean(activeReservation?.cotizacion_original);
  const canContinueStep2 = finalArs > 0 && finalUsd > 0 && (!pricingRequired || Boolean(pricingMode));

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-40 bg-slate-950 text-white px-4 py-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.replace('/pwa/dashboard')} className="p-2 rounded-xl bg-white/10"><ArrowLeft className="w-5 h-5" /></button>
          <div className="text-center"><p className="text-[10px] uppercase tracking-widest font-black text-blue-400">OnlyCars Sales</p><h1 className="text-lg font-black">Cotizador móvil</h1></div>
          <span className="text-xs font-black text-emerald-400">$ {dolarActual.toLocaleString('es-AR')}</span>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} /></div>
      </header>

      <main className="p-4 space-y-4">
        {step === 1 && <>
          <section className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2"><Calculator className="w-5 h-5 text-blue-600" /><div><h2 className="font-black text-slate-900">Unidad y cliente</h2><p className="text-xs text-slate-500">Buscá la unidad y el cliente de la operación.</p></div></div>
            <SearchCombobox label="Vehículo *" value={vehiculoId} onChange={selectVehicle} options={vehicleOptions} placeholder="Buscar vehículo..." required />
            <SearchCombobox label="Cliente *" value={clienteId} onChange={setClienteId} options={clientOptions} placeholder="Buscar cliente..." required />
            <p className="text-[10px] text-slate-400">Si el cliente no existe, el alta se realiza desde administración. El vendedor permanece dentro de la PWA.</p>

            {vehicleReservation && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-2"><BookmarkCheck className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="font-black text-amber-900 text-sm">Unidad reservada</p>{pwaConfig.showReservationOwner && <p className="text-xs text-amber-700">{vehicleReservation.cliente_nombre}</p>}</div></div>}
            {reservationMismatch && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 text-red-600 shrink-0" /><p className="text-xs font-bold text-red-800">{pwaConfig.showReservationOwner ? `La reserva pertenece a ${vehicleReservation.cliente_nombre}.` : 'La reserva pertenece a otro cliente.'} No se puede cerrar la venta mientras siga activa.</p></div>}
            {activeReservation && <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3"><p className="text-xs font-black text-emerald-800 flex items-center gap-1"><BookmarkCheck className="w-4 h-4" /> Seña detectada</p><MoneyLines ars={reservationArs} usd={reservationUsdOriginal} config={pwaConfig} rate={Number(activeReservation.cotizacion || 0)} /></div>}
          </section>
        </>}

        {step === 2 && <section className="space-y-4">
          {activeReservation?.cotizacion_original ? <section className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
            <div><h2 className="font-black text-slate-900">Elegí la cotización de cierre</h2><p className="text-xs text-slate-500 mt-1">La reserva conserva su cotización histórica; también podés cerrar con el valor vigente.</p></div>
            <QuoteChoice
              selected={pricingMode === 'ORIGINAL'}
              title="Cotización reservada"
              subtitle={`TC $ ${Number(activeReservation.cotizacion_original.rate).toLocaleString('es-AR')} · ${new Date(activeReservation.cotizacion_original.fecha).toLocaleDateString('es-AR')}`}
              ars={Number(activeReservation.cotizacion_original.precio_usd) * Number(activeReservation.cotizacion_original.rate)}
              usd={Number(activeReservation.cotizacion_original.precio_usd)}
              config={pwaConfig}
              icon={<Clock3 className="w-5 h-5" />}
              onClick={() => selectPricing('ORIGINAL')}
            />
            <QuoteChoice
              selected={pricingMode === 'CURRENT'}
              title="Cotización actual"
              subtitle={`TC $ ${dolarActual.toLocaleString('es-AR')} · valor vigente`}
              ars={Number(vehiculo?.precio_venta_ars || 0)}
              usd={Number(vehiculo?.precio_venta_usd || 0)}
              config={pwaConfig}
              icon={<RefreshCw className="w-5 h-5" />}
              onClick={() => selectPricing('CURRENT')}
            />
          </section> : <section className="bg-white border rounded-3xl p-5 shadow-sm space-y-4"><div><h2 className="font-black text-slate-900">Precio de cierre</h2><p className="text-xs text-slate-500">Trabajá con el valor actual de la unidad.</p></div><PwaMoneyInput label="Precio final" value={precio} rate={saleRate} onChange={setPrecio} config={pwaConfig} /></section>}

          {pricingMode && <section className="bg-white border rounded-3xl p-5 shadow-sm space-y-5">
            <div className="rounded-2xl bg-slate-950 text-white p-4"><p className="text-[10px] uppercase font-black text-slate-500">Precio elegido</p><MoneyLines ars={finalArs} usd={finalUsd} config={pwaConfig} rate={saleRate} inverse /></div>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl"><button type="button" onClick={() => setFormaPago('Contado')} className={`py-3 rounded-xl text-sm font-black ${formaPago === 'Contado' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Contado</button><button type="button" onClick={() => setFormaPago('Cuotas')} className={`py-3 rounded-xl text-sm font-black ${formaPago === 'Cuotas' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}>Financiado</button></div>
            {activeReservation && <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><p className="text-[10px] font-black uppercase text-emerald-700">Seña ya cobrada</p><MoneyLines ars={reservationArs} usd={reservationUsdOriginal} config={pwaConfig} rate={Number(activeReservation.cotizacion || 0)} /><p className="text-[10px] text-emerald-700 mt-2">Al cierre equivale a USD {reservationUsdApplied.toLocaleString('es-AR', { maximumFractionDigits: 2 })} usando el TC elegido.</p></div>}
            {formaPago === 'Cuotas' && <div className="space-y-4 pt-2 border-t"><PwaMoneyInput label="Anticipo total" value={anticipo} rate={saleRate} onChange={setAnticipo} config={pwaConfig} /><div className="grid grid-cols-2 gap-3"><Field label="Cantidad de cuotas"><input type="number" min="1" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} className="w-full p-3 border rounded-xl" /></Field><Field label="TNA / recargo %"><input type="number" min="0" step="0.01" value={recargoPct} onChange={(e) => setRecargoPct(e.target.value)} className="w-full p-3 border rounded-xl" /><span className="text-[10px] text-slate-400 mt-1 block">Configurado: {Number(tnaFinanciacion || 0).toLocaleString('es-AR')}%</span></Field></div><Field label="Vencimiento primera cuota"><input type="date" value={fechaPrimerCuota} onChange={(e) => setFechaPrimerCuota(e.target.value)} className="w-full p-3 border rounded-xl" /></Field><div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-indigo-600">Saldo financiado</p><MoneyLines ars={capitalArs} usd={capitalUsd} config={pwaConfig} rate={saleRate} /><p className="text-xs font-bold text-indigo-800 mt-3">{cuotasN} cuotas de $ {cuotaArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}{pwaConfig.showUsdPrices ? ` · USD ${cuotaUsd.toLocaleString('es-AR', { maximumFractionDigits: 2 })}` : ''}</p></div></div>}
          </section>}
        </section>}

        {step === 3 && <section className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl space-y-5">
          <div><p className="text-[10px] uppercase tracking-widest font-black text-blue-400">Confirmación</p><h2 className="text-2xl font-black mt-1">{vehiculo?.marca} {vehiculo?.modelo}</h2><p className="text-sm text-slate-400">{cliente?.nombre_completo}</p></div>
          <div className="border-y border-slate-800 py-4"><p className="text-[10px] uppercase font-black text-slate-500">Precio final · {pricingMode === 'ORIGINAL' ? 'cotización reservada' : 'cotización actual'}</p><MoneyLines ars={finalArs} usd={finalUsd} config={pwaConfig} rate={saleRate} inverse big /></div>
          {activeReservation && <Summary label="Seña abonada" ars={reservationArs} usd={reservationUsdApplied} rate={saleRate} config={pwaConfig} />}
          {formaPago === 'Cuotas' ? <div className="space-y-3"><Summary label="Anticipo total" ars={anticipoArs} usd={anticipoUsd} rate={saleRate} config={pwaConfig} /><Summary label="Capital financiado" ars={capitalArs} usd={capitalUsd} rate={saleRate} config={pwaConfig} /><div className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-4 text-center"><p className="text-xs font-black text-blue-300">PLAN DE PAGO</p><p className="text-3xl font-black mt-2">{cuotasN} × $ {cuotaArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>{pwaConfig.showUsdPrices && <p className="text-xs text-slate-400 mt-1">USD {cuotaUsd.toLocaleString('es-AR', { maximumFractionDigits: 2 })} por cuota</p>}</div></div> : <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-4"><p className="text-sm text-emerald-300 font-bold">Saldo a cobrar ahora</p><p className="text-2xl font-black mt-1">$ {additionalDueArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p></div>}
          {!pwaConfig.allowCloseSales && <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4 text-sm font-bold text-amber-300">Esta cuenta puede simular operaciones, pero el cierre de ventas está deshabilitado por configuración.</div>}
        </section>}
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur border-t p-4 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,.08)]">
        {step < 3 ? <button onClick={() => setStep(step + 1)} disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2)} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 disabled:opacity-40">Continuar <ArrowRight className="w-5 h-5" /></button> : <button onClick={confirmar} disabled={submitting || !pwaConfig.allowCloseSales} className="w-full bg-emerald-500 text-slate-950 p-4 rounded-2xl font-black flex justify-center items-center gap-2 disabled:opacity-40">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Confirmar venta</button>}
      </footer>
    </div>
  );
}

function QuoteChoice({ selected, title, subtitle, ars, usd, config, icon, onClick }: { selected: boolean; title: string; subtitle: string; ars: number; usd: number; config: SellerPwaConfig; icon: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`w-full text-left rounded-2xl border p-4 transition-all ${selected ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>{icon}</div><div><p className="font-black text-slate-900">{title}</p><p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p></div></div>{selected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}</div><div className="mt-3 pl-13"><MoneyLines ars={ars} usd={usd} config={config} rate={usd > 0 ? ars / usd : 0} /></div></button>;
}

function PwaMoneyInput({ label, value, rate, onChange, config }: { label: string; value: { ars: string; usd: string }; rate: number; onChange: (next: { ars: string; usd: string }) => void; config: SellerPwaConfig }) {
  const field = 'w-full p-3 border border-slate-300 rounded-xl font-bold text-slate-800';
  return <div><p className="text-[10px] uppercase tracking-wider font-black text-slate-500 mb-2">{label}</p><div className={`grid gap-3 ${config.showArsPrices && config.showUsdPrices ? 'grid-cols-2' : 'grid-cols-1'}`}>{config.showArsPrices && <label><span className="text-[10px] font-black text-slate-400">PESOS (ARS)</span><input type="number" min="0" step="0.01" value={value.ars} onChange={(e) => { const ars = e.target.value; const usd = rate > 0 && Number(ars) > 0 ? String(Number((Number(ars) / rate).toFixed(2))) : ''; onChange({ ars, usd }); }} className={`${field} mt-1`} /></label>}{config.showUsdPrices && <label><span className="text-[10px] font-black text-slate-400">DÓLARES (USD)</span><input type="number" min="0" step="0.01" value={value.usd} onChange={(e) => { const usd = e.target.value; const ars = rate > 0 && Number(usd) > 0 ? String(Number((Number(usd) * rate).toFixed(2))) : ''; onChange({ ars, usd }); }} className={`${field} mt-1`} /></label>}</div></div>;
}

function MoneyLines({ ars, usd, config, rate, inverse = false, big = false }: { ars: number; usd: number; config: SellerPwaConfig; rate?: number; inverse?: boolean; big?: boolean }) {
  return <div className={inverse ? 'text-white' : 'text-slate-900'}>{config.showArsPrices && <p className={`${big ? 'text-3xl' : 'text-lg'} font-black`}>$ {Number(ars || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p>}{config.showUsdPrices && <p className={`${big ? 'text-sm' : 'text-xs'} font-bold ${inverse ? 'text-slate-400' : 'text-slate-500'}`}>USD {Number(usd || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}{rate ? ` · TC $ ${Number(rate).toLocaleString('es-AR', { maximumFractionDigits: 2 })}` : ''}</p>}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="text-[10px] uppercase tracking-wider font-black text-slate-500 block mb-1.5">{label}</span>{children}</label>; }
function Summary({ label, ars, usd, rate, config }: { label: string; ars: number; usd: number; rate: number; config: SellerPwaConfig }) { return <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-400">{label}</span><div className="text-right"><MoneyLines ars={ars} usd={usd} rate={rate} config={config} inverse /></div></div>; }
