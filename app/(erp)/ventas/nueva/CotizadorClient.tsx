'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Calculator, CircleDollarSign, Loader2, Shuffle, TrendingUp } from 'lucide-react';
import { registrarVenta } from '@/actions/ventas';
import DualMoney from '@/components/common/DualMoney';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import SearchCombobox from '@/components/common/SearchCombobox';

type Props = {
  vehiculos: any[];
  clientes: any[];
  dolarActual: number;
  initialProspectoId?: number | null;
  initialQuote?: any | null;
};

function asInput(value: number | null | undefined) {
  return value && Number.isFinite(Number(value)) ? String(Number(value).toFixed(2)) : '';
}

export default function CotizadorClient({ vehiculos, clientes, dolarActual, initialProspectoId, initialQuote }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rate = Number(initialQuote?.cotizacion_dolar || dolarActual || 0);
  const [submitting, setSubmitting] = useState(false);

  const urlVehicleId = searchParams.get('v') || '';
  const urlClientId = searchParams.get('c') || '';
  const [vehiculoId, setVehiculoId] = useState(String(initialQuote?.id_vehiculo || urlVehicleId || ''));
  const [clienteId, setClienteId] = useState(String(initialQuote?.id_cliente || urlClientId || ''));

  const selectedVehicle = useMemo(() => vehiculos.find((v) => String(v.id_vehiculo) === vehiculoId) || null, [vehiculos, vehiculoId]);
  const selectedClient = useMemo(() => clientes.find((c) => String(c.id_cliente) === clienteId) || null, [clientes, clienteId]);

  const initialPriceUsd = Number(initialQuote?.precio_final_usd || 0);
  const initialPriceArs = initialPriceUsd > 0 ? initialPriceUsd * rate : Number(selectedVehicle?.precio_venta_ars || 0);
  const initialAdvanceUsd = Number(initialQuote?.anticipo_usd || 0);
  const initialTradeUsd = Number(initialQuote?.valor_permuta_usd || 0);

  const [precio, setPrecio] = useState({ ars: asInput(initialPriceArs), usd: asInput(initialPriceUsd || (initialPriceArs && rate ? initialPriceArs / rate : 0)) });
  const [formaPago, setFormaPago] = useState<'Contado' | 'Cuotas'>(initialQuote?.forma_pago === 'Cuotas' ? 'Cuotas' : 'Contado');
  const [anticipo, setAnticipo] = useState({ ars: asInput(initialAdvanceUsd * rate), usd: asInput(initialAdvanceUsd) });
  const [cantidadCuotas, setCantidadCuotas] = useState(String(initialQuote?.cantidad_cuotas || 12));
  const [recargoPct, setRecargoPct] = useState(() => {
    if (!initialQuote || initialQuote.forma_pago !== 'Cuotas') return '36';
    const count = Number(initialQuote.cantidad_cuotas || 0);
    const installment = Number(initialQuote.valor_cuota_usd || 0);
    const capital = Number(initialQuote.saldo_financiado_usd || 0);
    if (count > 0 && installment > 0 && capital > 0) return String(Math.max(0, ((installment * count / capital) - 1) * 100).toFixed(2));
    return '0';
  });
  const [fechaPrimerCuota, setFechaPrimerCuota] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [observaciones, setObservaciones] = useState(initialQuote?.observaciones || '');

  const [tienePermuta, setTienePermuta] = useState(Boolean(initialQuote?.tiene_permuta));
  const [valorPermuta, setValorPermuta] = useState({ ars: asInput(initialTradeUsd * rate), usd: asInput(initialTradeUsd) });
  const [permuta, setPermuta] = useState({ marca: '', modelo: '', version: '', anio: '', km: '', patente: '', color: '', motor: '' });

  useEffect(() => {
    if (!selectedVehicle || initialQuote) return;
    const ars = Number(selectedVehicle.precio_venta_ars || 0) || Number(selectedVehicle.precio_venta_usd || 0) * rate;
    const usd = Number(selectedVehicle.precio_venta_usd || 0) || (rate > 0 ? ars / rate : 0);
    setPrecio({ ars: asInput(ars), usd: asInput(usd) });
  }, [selectedVehicle, initialQuote, rate]);

  const vehicleOptions = useMemo(() => vehiculos.map((v) => ({
    value: String(v.id_vehiculo),
    label: v.nombre,
    description: `${v.patente || 'S/P'} · ${v.estado} · $ ${Number(v.precio_venta_ars || 0).toLocaleString('es-AR')} ARS · U$S ${Number(v.precio_venta_usd || 0).toLocaleString('es-AR')}`,
    searchText: `${v.nombre} ${v.patente || ''} ${v.marca || ''} ${v.modelo || ''} ${v.anio || ''}`,
  })), [vehiculos]);

  const clientOptions = useMemo(() => clientes.map((c) => ({
    value: String(c.id_cliente),
    label: c.nombre_completo,
    description: `DNI ${c.dni || 'S/N'}${c.telefono ? ` · ${c.telefono}` : ''}`,
    searchText: `${c.nombre_completo} ${c.dni || ''} ${c.cuit_cuil || ''} ${c.telefono || ''} ${c.email || ''}`,
  })), [clientes]);

  const finalArs = Number(precio.ars || 0);
  const finalUsd = Number(precio.usd || 0);
  const advanceArs = formaPago === 'Cuotas' ? Number(anticipo.ars || 0) : finalArs;
  const advanceUsd = formaPago === 'Cuotas' ? Number(anticipo.usd || 0) : finalUsd;
  const tradeArs = tienePermuta ? Number(valorPermuta.ars || 0) : 0;
  const tradeUsd = tienePermuta ? Number(valorPermuta.usd || 0) : 0;
  const capitalArs = formaPago === 'Cuotas' ? Math.max(0, finalArs - advanceArs - tradeArs) : 0;
  const capitalUsd = rate > 0 ? capitalArs / rate : 0;
  const count = Math.max(1, Number(cantidadCuotas || 1));
  const surcharge = formaPago === 'Cuotas' ? Math.max(0, Number(recargoPct || 0)) / 100 : 0;
  const financedArs = capitalArs * (1 + surcharge);
  const installmentArs = formaPago === 'Cuotas' ? financedArs / count : 0;
  const installmentUsd = rate > 0 ? installmentArs / rate : 0;
  const costArs = Number(selectedVehicle?.precio_costo_ars || 0) || Number(selectedVehicle?.precio_costo_usd || 0) * rate;
  const costUsd = Number(selectedVehicle?.precio_costo_usd || 0) || (rate > 0 ? costArs / rate : 0);
  const grossMarginArs = finalArs - costArs - tradeArs;
  const financeIncomeArs = financedArs - capitalArs;

  const buildInstallments = () => {
    if (formaPago !== 'Cuotas') return undefined;
    const [y, m, d] = fechaPrimerCuota.split('-').map(Number);
    return Array.from({ length: count }).map((_, index) => {
      const date = new Date(Date.UTC(y, m - 1 + index, d, 12, 0, 0));
      return { numero_cuota: index + 1, monto_usd: Number(installmentUsd.toFixed(2)), fecha_vencimiento: date.toISOString() };
    });
  };

  const procesar = async () => {
    if (!selectedVehicle || !selectedClient || finalArs <= 0 || finalUsd <= 0) return alert('Seleccioná vehículo, cliente y definí el precio final.');
    if (formaPago === 'Cuotas' && advanceArs + tradeArs >= finalArs) return alert('Anticipo + permuta deben ser menores al precio final para financiar saldo.');
    if (tienePermuta && (!permuta.marca.trim() || !permuta.modelo.trim() || Number(permuta.anio) <= 0 || Number(permuta.km) < 0 || tradeUsd <= 0)) return alert('Completá marca, modelo, año, kilometraje y valor de toma de la permuta.');

    setSubmitting(true);
    const res = await registrarVenta({
      id_vehiculo: selectedVehicle.id_vehiculo,
      id_cliente: selectedClient.id_cliente,
      precio_final_usd: Number(finalUsd.toFixed(2)),
      cotizacion_dolar: rate,
      forma_pago: formaPago,
      anticipo_usd: Number(advanceUsd.toFixed(2)),
      saldo_financiado_usd: formaPago === 'Cuotas' ? Number(capitalUsd.toFixed(2)) : 0,
      prospectoId: initialProspectoId || undefined,
      cotizacionId: initialQuote?.id_cotizacion || undefined,
      observaciones: observaciones || undefined,
      cuotas: buildInstallments(),
      permuta: tienePermuta ? {
        marca: permuta.marca.trim(),
        modelo: permuta.modelo.trim(),
        version: permuta.version.trim() || undefined,
        anio: Number(permuta.anio),
        km: Number(permuta.km),
        patente: permuta.patente.trim() || undefined,
        color: permuta.color.trim() || undefined,
        motor: permuta.motor.trim() || undefined,
        valor_toma_usd: Number(tradeUsd.toFixed(2)),
      } : undefined,
    });
    setSubmitting(false);

    if (!res.success) return alert(res.error || 'No se pudo registrar la venta.');
    router.push(`/ventas/${res.id_venta}`);
    router.refresh();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Calculator className="w-6 h-6" /></div>
        <div><h1 className="text-3xl font-black text-slate-900">Cotizador y cierre de venta</h1><p className="text-sm text-slate-500 mt-1">Seleccioná entidades con búsqueda y trabajá siempre con ARS + USD.</p>{initialQuote && <p className="text-xs font-bold text-blue-700 mt-2">Origen: cotización #{initialQuote.id_cotizacion}{initialProspectoId ? ` · operación #${initialProspectoId}` : ''}</p>}</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="font-black text-slate-900">1. Unidad y cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SearchCombobox label="Vehículo" required value={vehiculoId} onChange={setVehiculoId} options={vehicleOptions} placeholder="Buscar por modelo, patente o año..." />
              <div><SearchCombobox label="Cliente" required value={clienteId} onChange={setClienteId} options={clientOptions} placeholder="Buscar por nombre, DNI, CUIT o teléfono..." /><div className="mt-1 text-right"><Link href="/clientes" className="text-xs font-bold text-blue-700 hover:underline">Crear nuevo cliente</Link></div></div>
            </div>
            {selectedVehicle && <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4"><div><p className="text-[10px] uppercase font-black text-slate-400">Precio publicado</p><DualMoney ars={selectedVehicle.precio_venta_ars} usd={selectedVehicle.precio_venta_usd} rate={rate} /></div><div><p className="text-[10px] uppercase font-black text-slate-400">Costo registrado</p><DualMoney ars={costArs} usd={costUsd} rate={rate} /></div></div>}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <h2 className="font-black text-slate-900">2. Precio y modalidad</h2>
            <DualCurrencyInput label="Precio final pactado" required ars={precio.ars} usd={precio.usd} rate={rate} onChange={setPrecio} helper={initialQuote ? `Precio cargado desde la cotización #${initialQuote.id_cotizacion}. Podés ajustarlo antes de confirmar.` : undefined} />
            <div><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Forma de pago *</span><div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-xl p-1.5 mt-1.5"><button type="button" onClick={() => setFormaPago('Contado')} className={`py-2.5 rounded-lg text-sm font-black ${formaPago === 'Contado' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Contado</button><button type="button" onClick={() => setFormaPago('Cuotas')} className={`py-2.5 rounded-lg text-sm font-black ${formaPago === 'Cuotas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>Financiado</button></div></div>

            {formaPago === 'Cuotas' && (
              <div className="rounded-2xl bg-indigo-50/50 border border-indigo-200 p-4 space-y-4">
                <h3 className="font-black text-indigo-950 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Condiciones de financiación</h3>
                <DualCurrencyInput label="Anticipo" ars={anticipo.ars} usd={anticipo.usd} rate={rate} onChange={setAnticipo} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Cantidad de cuotas *</span><input type="number" min="1" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></label>
                  <label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Recargo total (%)</span><input type="number" min="0" step="any" value={recargoPct} onChange={(e) => setRecargoPct(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></label>
                  <label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Vencimiento 1ª cuota *</span><input type="date" value={fechaPrimerCuota} onChange={(e) => setFechaPrimerCuota(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><div className="rounded-xl bg-white border border-indigo-100 p-3"><p className="text-[10px] uppercase font-black text-slate-400">Saldo financiado</p><DualMoney ars={capitalArs} usd={capitalUsd} rate={rate} compact /></div><div className="rounded-xl bg-white border border-indigo-100 p-3"><p className="text-[10px] uppercase font-black text-slate-400">Valor por cuota</p><DualMoney ars={installmentArs} usd={installmentUsd} rate={rate} compact /></div><div className="rounded-xl bg-white border border-indigo-100 p-3"><p className="text-[10px] uppercase font-black text-slate-400">Interés total</p><DualMoney ars={financeIncomeArs} rate={rate} compact /></div></div>
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h2 className="font-black text-slate-900 flex items-center gap-2"><Shuffle className="w-4 h-4 text-amber-600" /> 3. Permuta</h2><p className="text-xs text-slate-500 mt-1">Si hay toma, el vehículo entra automáticamente al inventario.</p></div><label className="flex items-center gap-2 text-sm font-black text-slate-700"><input type="checkbox" checked={tienePermuta} onChange={(e) => setTienePermuta(e.target.checked)} /> Incluir permuta</label></div>
            {tienePermuta && <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label><span className="text-xs font-black text-slate-600 uppercase">Marca *</span><input value={permuta.marca} onChange={(e) => setPermuta({ ...permuta, marca: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white" /></label><label><span className="text-xs font-black text-slate-600 uppercase">Modelo *</span><input value={permuta.modelo} onChange={(e) => setPermuta({ ...permuta, modelo: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white" /></label><label><span className="text-xs font-black text-slate-600 uppercase">Versión</span><input value={permuta.version} onChange={(e) => setPermuta({ ...permuta, version: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white" /></label><label><span className="text-xs font-black text-slate-600 uppercase">Patente</span><input value={permuta.patente} onChange={(e) => setPermuta({ ...permuta, patente: e.target.value.toUpperCase() })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white uppercase" /></label><label><span className="text-xs font-black text-slate-600 uppercase">Año *</span><input type="number" value={permuta.anio} onChange={(e) => setPermuta({ ...permuta, anio: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white" /></label><label><span className="text-xs font-black text-slate-600 uppercase">Kilometraje *</span><input type="number" min="0" value={permuta.km} onChange={(e) => setPermuta({ ...permuta, km: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white" /></label><label><span className="text-xs font-black text-slate-600 uppercase">Color</span><input value={permuta.color} onChange={(e) => setPermuta({ ...permuta, color: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white" /></label><label><span className="text-xs font-black text-slate-600 uppercase">Motor</span><input value={permuta.motor} onChange={(e) => setPermuta({ ...permuta, motor: e.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white" /></label></div><DualCurrencyInput label="Valor de toma" required ars={valorPermuta.ars} usd={valorPermuta.usd} rate={rate} onChange={setValorPermuta} /></div>}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Observaciones de la venta</span><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Condiciones pactadas, documentación pendiente, aclaraciones..." className="mt-1.5 w-full min-h-24 px-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></label></section>
        </div>

        <aside className="space-y-5">
          <div className="bg-slate-950 text-white rounded-2xl p-5 shadow-xl sticky top-24 space-y-4">
            <div><p className="text-[10px] uppercase tracking-wider font-black text-slate-500">Resumen de operación</p><p className="text-sm font-bold text-slate-300 mt-1">TC aplicado: $ {rate.toLocaleString('es-AR')} / USD</p></div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4"><p className="text-[10px] uppercase font-black text-slate-500">Precio final</p><DualMoney ars={finalArs} usd={finalUsd} rate={rate} primaryClassName="text-2xl font-black text-white" secondaryClassName="text-sm font-bold text-slate-400" /></div>
            {tienePermuta && <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-4"><p className="text-[10px] uppercase font-black text-amber-400">Valor de toma</p><DualMoney ars={tradeArs} usd={tradeUsd} rate={rate} primaryClassName="font-black text-amber-100" secondaryClassName="text-xs text-amber-300" /></div>}
            {formaPago === 'Cuotas' && <div className="rounded-xl bg-indigo-500/10 border border-indigo-400/20 p-4 space-y-3"><div><p className="text-[10px] uppercase font-black text-indigo-400">Capital financiado</p><DualMoney ars={capitalArs} usd={capitalUsd} rate={rate} primaryClassName="font-black text-white" secondaryClassName="text-xs text-indigo-300" /></div><div><p className="text-[10px] uppercase font-black text-indigo-400">Plan</p><p className="text-xl font-black">{count} × $ {installmentArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-indigo-300">U$S {installmentUsd.toLocaleString('es-AR', { maximumFractionDigits: 2 })} por cuota</p></div></div>}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-4"><p className="text-[10px] uppercase font-black text-emerald-400">Margen comercial estimado</p><DualMoney ars={grossMarginArs} rate={rate} primaryClassName={`text-xl font-black ${grossMarginArs >= 0 ? 'text-emerald-300' : 'text-red-300'}`} secondaryClassName="text-xs text-slate-400" /></div>
            <button onClick={procesar} disabled={submitting || !selectedVehicle || !selectedClient || finalArs <= 0} className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center gap-2 disabled:opacity-50">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CircleDollarSign className="w-5 h-5" />} Confirmar venta <ArrowRight className="w-4 h-4" /></button>
          </div>
        </aside>
      </div>
    </div>
  );
}
