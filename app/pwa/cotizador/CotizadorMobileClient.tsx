'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowRight, BookmarkCheck, Calculator, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { registrarVenta } from '@/actions/ventas';
import SearchCombobox from '@/components/common/SearchCombobox';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import DualMoney from '@/components/common/DualMoney';

export default function CotizadorMobileClient({
  vehiculos,
  clientes,
  dolarActual,
  tnaFinanciacion,
  reservasActivas,
}: {
  vehiculos: any[];
  clientes: any[];
  dolarActual: number;
  tnaFinanciacion: number;
  reservasActivas: any[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [vehiculoId, setVehiculoId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [precio, setPrecio] = useState({ ars: '', usd: '' });
  const [formaPago, setFormaPago] = useState<'Contado' | 'Cuotas'>('Contado');
  const [anticipo, setAnticipo] = useState({ ars: '', usd: '' });
  const [cantidadCuotas, setCantidadCuotas] = useState('12');
  const [recargoPct, setRecargoPct] = useState(String(Number(tnaFinanciacion || 0)));
  const [fechaPrimerCuota, setFechaPrimerCuota] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10); });
  const appliedReservation = useRef<number | null>(null);

  const vehiculo = useMemo(() => vehiculos.find((v) => String(v.id_vehiculo) === vehiculoId) || null, [vehiculos, vehiculoId]);
  const cliente = useMemo(() => clientes.find((c) => String(c.id_cliente) === clienteId) || null, [clientes, clienteId]);
  const vehicleReservation = useMemo(() => reservasActivas.find((s) => String(s.id_vehiculo) === vehiculoId) || null, [reservasActivas, vehiculoId]);
  const activeReservation = useMemo(() => vehicleReservation && String(vehicleReservation.id_cliente) === clienteId ? vehicleReservation : null, [vehicleReservation, clienteId]);
  const reservationMismatch = Boolean(vehicleReservation && clienteId && String(vehicleReservation.id_cliente) !== clienteId);

  const vehicleOptions = vehiculos.map((v) => {
    const r = reservasActivas.find((s) => s.id_vehiculo === v.id_vehiculo);
    return { value: String(v.id_vehiculo), label: `${v.marca} ${v.modelo}${v.version ? ` ${v.version}` : ''}`, description: `${v.tipo_vehiculo} · ${v.anio || 'S/A'} · ${v.patente || 'S/P'}${r ? ` · RESERVADO: ${r.cliente_nombre}` : ''} · $ ${Number(v.precio_venta_ars || 0).toLocaleString('es-AR')} / USD ${Number(v.precio_venta_usd || 0).toLocaleString('es-AR')}`, searchText: `${v.marca} ${v.modelo} ${v.version || ''} ${v.patente || ''} ${v.anio || ''} ${r?.cliente_nombre || ''}` };
  });
  const clientOptions = clientes.map((c) => ({ value: String(c.id_cliente), label: c.nombre_completo, description: `DNI ${c.dni || 'S/D'}${c.telefono ? ` · ${c.telefono}` : ''}`, searchText: `${c.nombre_completo} ${c.dni || ''} ${c.cuit_cuil || ''} ${c.telefono || ''}` }));

  const selectVehicle = (id: string) => {
    setVehiculoId(id);
    const v = vehiculos.find((x) => String(x.id_vehiculo) === id);
    if (v) setPrecio({ ars: String(Number(v.precio_venta_ars || 0)), usd: String(Number(v.precio_venta_usd || 0)) });
  };

  useEffect(() => {
    if (activeReservation && appliedReservation.current !== activeReservation.id_senia) {
      setAnticipo({ ars: String(Number(activeReservation.monto_ars || 0)), usd: String(Number(activeReservation.monto_usd || 0)) });
      appliedReservation.current = activeReservation.id_senia;
    } else if (!activeReservation && appliedReservation.current !== null) {
      setAnticipo({ ars: '', usd: '' });
      appliedReservation.current = null;
    }
  }, [activeReservation]);

  const finalArs = Number(precio.ars || 0);
  const finalUsd = Number(precio.usd || 0);
  const anticipoArs = formaPago === 'Cuotas' ? Number(anticipo.ars || 0) : finalArs;
  const anticipoUsd = formaPago === 'Cuotas' ? Number(anticipo.usd || 0) : finalUsd;
  const capitalArs = formaPago === 'Cuotas' ? Math.max(0, finalArs - anticipoArs) : 0;
  const capitalUsd = dolarActual > 0 ? capitalArs / dolarActual : 0;
  const cuotasN = Math.max(1, Number(cantidadCuotas || 1));
  const recargo = Math.max(0, Number(recargoPct || 0)) / 100;
  const totalFinanciadoArs = capitalArs * (1 + recargo);
  const cuotaArs = formaPago === 'Cuotas' ? totalFinanciadoArs / cuotasN : 0;
  const cuotaUsd = dolarActual > 0 ? cuotaArs / dolarActual : 0;
  const reservationArs = Number(activeReservation?.monto_ars || 0);
  const reservationUsd = Number(activeReservation?.monto_usd || 0);
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
    if (!vehiculo || !cliente || finalArs <= 0 || finalUsd <= 0) return alert('Seleccioná vehículo, cliente y precio final.');
    if (reservationMismatch) return alert(`Esta unidad está reservada por ${vehicleReservation.cliente_nombre}. Seleccioná al cliente de la reserva o cancelala antes de vender.`);
    if (formaPago === 'Cuotas' && anticipoArs >= finalArs) return alert('El anticipo debe ser menor al precio final para financiar saldo.');
    setSubmitting(true);
    const res = await registrarVenta({
      id_vehiculo: vehiculo.id_vehiculo,
      id_cliente: cliente.id_cliente,
      precio_final_usd: Number(finalUsd.toFixed(2)),
      cotizacion_dolar: dolarActual,
      forma_pago: formaPago,
      anticipo_usd: Number(anticipoUsd.toFixed(2)),
      saldo_financiado_usd: formaPago === 'Cuotas' ? Number(capitalUsd.toFixed(2)) : 0,
      prospectoId: activeReservation?.prospectoId || undefined,
      cotizacionId: activeReservation?.cotizacionId || undefined,
      cuotas: plan(),
    });
    setSubmitting(false);
    if (!res.success) return alert(res.error || 'No se pudo cerrar la operación.');
    router.push(`/ventas/${res.id_venta}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-40 bg-slate-950 text-white px-4 py-4 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between"><button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="p-2 rounded-xl bg-white/10"><ArrowLeft className="w-5 h-5" /></button><div className="text-center"><p className="text-[10px] uppercase tracking-widest font-black text-blue-400">OnlyCars Sales</p><h1 className="text-lg font-black">Cotizador móvil</h1></div><span className="text-xs font-black text-emerald-400">${dolarActual.toLocaleString('es-AR')}</span></div>
        <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-blue-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} /></div>
      </header>

      <main className="p-4 space-y-4">
        {step === 1 && <><section className="bg-white border rounded-3xl p-5 shadow-sm space-y-4"><div className="flex items-center gap-2"><Calculator className="w-5 h-5 text-blue-600" /><div><h2 className="font-black text-slate-900">Unidad y cliente</h2><p className="text-xs text-slate-500">Buscá por modelo/patente y nombre/DNI.</p></div></div><SearchCombobox label="Vehículo *" value={vehiculoId} onChange={selectVehicle} options={vehicleOptions} placeholder="Buscar vehículo..." required /><SearchCombobox label="Cliente *" value={clienteId} onChange={setClienteId} options={clientOptions} placeholder="Buscar cliente..." required /><Link href="/clientes" className="inline-flex items-center gap-1 text-xs font-black text-blue-700"><UserPlus className="w-4 h-4" /> Crear cliente desde ERP</Link>{vehicleReservation && !clienteId && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-2"><BookmarkCheck className="w-5 h-5 text-amber-600 shrink-0" /><div><p className="font-black text-amber-900 text-sm">Unidad reservada</p><p className="text-xs text-amber-700">{vehicleReservation.cliente_nombre}</p></div></div>}{reservationMismatch && <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex gap-2"><AlertTriangle className="w-5 h-5 text-red-600 shrink-0" /><p className="text-xs font-bold text-red-800">La reserva pertenece a {vehicleReservation.cliente_nombre}. No se puede vender a otro cliente mientras siga activa.</p></div>}{activeReservation && <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3"><p className="text-xs font-black text-emerald-800 flex items-center gap-1"><BookmarkCheck className="w-4 h-4" /> Seña detectada y aplicada</p><DualMoney ars={reservationArs} usd={reservationUsd} rate={activeReservation.cotizacion || dolarActual} compact primaryClassName="font-black text-emerald-900 mt-1" /></div>}</section>{vehiculo && <section className="bg-blue-50 border border-blue-200 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-blue-600">Precio publicado</p><DualMoney ars={vehiculo.precio_venta_ars} usd={vehiculo.precio_venta_usd} rate={dolarActual} primaryClassName="text-2xl font-black text-blue-950 mt-1" /></section>}</>}

        {step === 2 && <section className="bg-white border rounded-3xl p-5 shadow-sm space-y-5"><div><h2 className="font-black text-slate-900">Precio y pago</h2><p className="text-xs text-slate-500">Podés editar ARS o USD; la otra moneda se sincroniza.</p></div><DualCurrencyInput label="Precio final" ars={precio.ars} usd={precio.usd} rate={dolarActual} onChange={setPrecio} required /><div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl"><button type="button" onClick={() => setFormaPago('Contado')} className={`py-3 rounded-xl text-sm font-black ${formaPago === 'Contado' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Contado</button><button type="button" onClick={() => setFormaPago('Cuotas')} className={`py-3 rounded-xl text-sm font-black ${formaPago === 'Cuotas' ? 'bg-blue-600 text-white shadow' : 'text-slate-500'}`}>Financiado</button></div>{activeReservation && <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><p className="text-[10px] font-black uppercase text-emerald-700">Seña ya cobrada</p><DualMoney ars={reservationArs} usd={reservationUsd} rate={activeReservation.cotizacion || dolarActual} compact /></div>}{formaPago === 'Cuotas' && <div className="space-y-4 pt-2 border-t"><DualCurrencyInput label="Anticipo total" ars={anticipo.ars} usd={anticipo.usd} rate={dolarActual} onChange={setAnticipo} helper={activeReservation ? 'La seña ya está incluida. Podés aumentar el anticipo.' : undefined} /><div className="grid grid-cols-2 gap-3"><Field label="Cantidad de cuotas"><input type="number" min="1" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} className="w-full p-3 border rounded-xl" /></Field><Field label="Tasa / recargo %"><input type="number" min="0" step="0.01" value={recargoPct} onChange={(e) => setRecargoPct(e.target.value)} className="w-full p-3 border rounded-xl" /><span className="text-[10px] text-slate-400 mt-1 block">Configurado: {Number(tnaFinanciacion || 0).toLocaleString('es-AR')}%</span></Field></div><Field label="Vencimiento primera cuota"><input type="date" value={fechaPrimerCuota} onChange={(e) => setFechaPrimerCuota(e.target.value)} className="w-full p-3 border rounded-xl" /></Field><div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4"><p className="text-[10px] uppercase font-black text-indigo-600">Saldo financiado</p><DualMoney ars={capitalArs} usd={capitalUsd} rate={dolarActual} compact /><p className="text-xs font-bold text-indigo-800 mt-3">{cuotasN} cuotas de $ {cuotaArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })} · USD {cuotaUsd.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p></div></div>}</section>}

        {step === 3 && <section className="bg-slate-950 text-white rounded-3xl p-6 shadow-xl space-y-5"><div><p className="text-[10px] uppercase tracking-widest font-black text-blue-400">Confirmación</p><h2 className="text-2xl font-black mt-1">{vehiculo?.marca} {vehiculo?.modelo}</h2><p className="text-sm text-slate-400">{cliente?.nombre_completo}</p></div><div className="border-y border-slate-800 py-4"><p className="text-[10px] uppercase font-black text-slate-500">Precio final</p><DualMoney ars={finalArs} usd={finalUsd} rate={dolarActual} primaryClassName="text-3xl font-black text-white" secondaryClassName="text-sm font-bold text-slate-400" /></div>{activeReservation && <Summary label="Seña ya abonada" ars={reservationArs} usd={reservationUsd} rate={activeReservation.cotizacion || dolarActual} />}{formaPago === 'Cuotas' ? <div className="space-y-3"><Summary label="Anticipo total" ars={anticipoArs} usd={anticipoUsd} rate={dolarActual} /><Summary label="Capital financiado" ars={capitalArs} usd={capitalUsd} rate={dolarActual} /><div className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-4 text-center"><p className="text-xs font-black text-blue-300">PLAN DE PAGO</p><p className="text-3xl font-black mt-2">{cuotasN} × $ {cuotaArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-slate-400 mt-1">USD {cuotaUsd.toLocaleString('es-AR', { maximumFractionDigits: 2 })} por cuota</p></div></div> : <p className="text-sm text-emerald-300 font-bold">Contado. A cobrar al cierre: $ {additionalDueArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}{activeReservation ? ' descontando la seña ya recibida.' : '.'}</p>}</section>}
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur border-t p-4 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,.08)]">{step < 3 ? <button onClick={() => setStep(step + 1)} disabled={(step === 1 && (!vehiculo || !cliente || reservationMismatch)) || (step === 2 && finalArs <= 0)} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black flex justify-center items-center gap-2 disabled:opacity-40">Continuar <ArrowRight className="w-5 h-5" /></button> : <button onClick={confirmar} disabled={submitting || reservationMismatch} className="w-full bg-emerald-500 text-slate-950 p-4 rounded-2xl font-black flex justify-center items-center gap-2 disabled:opacity-50">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Confirmar venta</button>}</footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="text-[10px] uppercase tracking-wider font-black text-slate-500 block mb-1.5">{label}</span>{children}</label>; }
function Summary({ label, ars, usd, rate }: { label: string; ars: number; usd: number; rate: number }) { return <div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-slate-400">{label}</span><DualMoney ars={ars} usd={usd} rate={rate} primaryClassName="text-sm font-black text-white text-right" secondaryClassName="text-[10px] text-slate-500 text-right" compact /></div>; }
