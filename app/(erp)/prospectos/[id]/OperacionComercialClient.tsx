'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarCheck2,
  Car,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Handshake,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  ReceiptText,
  Tag,
  Truck,
  UserRound,
} from 'lucide-react';
import DualMoney from '@/components/common/DualMoney';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import SearchCombobox from '@/components/common/SearchCombobox';
import {
  asegurarClienteProspecto,
  completarEntrega,
  crearCotizacionProspecto,
  programarEntrega,
  registrarReservaProspecto,
} from '@/actions/operaciones';
import { actualizarEstadoProspecto } from '@/actions/prospectos';

const etapas = [
  { key: 'NUEVO', label: 'Lead' },
  { key: 'CONTACTADO', label: 'Contacto' },
  { key: 'COTIZADO', label: 'Cotización' },
  { key: 'RESERVADO', label: 'Reserva' },
  { key: 'GANADO', label: 'Venta' },
];

function etapaIndex(estado: string) {
  if (estado === 'GANADO') return 4;
  if (estado === 'RESERVADO') return 3;
  if (['COTIZADO', 'NEGOCIACION', 'PERMUTANDO'].includes(estado)) return 2;
  if (['CONTACTADO', 'VISITA_AGENDADA'].includes(estado)) return 1;
  return 0;
}

function asText(value: number | string | null | undefined) {
  if (value === null || value === undefined || Number(value) === 0) return '';
  return String(value);
}

export default function OperacionComercialClient({
  prospecto,
  vehiculos,
  dolarActual,
  timeline,
}: {
  prospecto: any;
  vehiculos: any[];
  dolarActual: number;
  timeline: any[];
}) {
  const latestQuote = prospecto.cotizaciones?.[0] || null;
  const activeReservation = prospecto.senias?.find((s: any) => s.estado === 'ACTIVA') || null;
  const sale = prospecto.ventas?.[0] || null;
  const delivery = sale?.entrega || null;
  const currentVehicle = prospecto.vehiculo_interes || null;
  const currentStage = etapaIndex(prospecto.estado);

  const [working, setWorking] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showReserve, setShowReserve] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);

  const initialVehicleArs = Number(currentVehicle?.precio_venta_ars || 0) || Number(currentVehicle?.precio_venta_usd || 0) * dolarActual;
  const initialVehicleUsd = Number(currentVehicle?.precio_venta_usd || 0) || (initialVehicleArs > 0 ? initialVehicleArs / dolarActual : 0);

  const [quote, setQuote] = useState({
    id_vehiculo: String(currentVehicle?.id_vehiculo || ''),
    precio_final_ars: asText(initialVehicleArs),
    precio_final_usd: asText(initialVehicleUsd),
    forma_pago: 'Contado' as 'Contado' | 'Cuotas',
    anticipo_ars: '',
    anticipo_usd: '',
    cantidad_cuotas: '12',
    valor_cuota_ars: '',
    valor_cuota_usd: '',
    valor_permuta_ars: '',
    valor_permuta_usd: '',
    observaciones: '',
    validez_dias: '7',
  });

  const [reserve, setReserve] = useState({ monto_ars: '', monto_usd: '', fecha_limite: '' });
  const [deliveryForm, setDeliveryForm] = useState({ fecha_programada: '', notas: '' });

  const vehicleOptions = useMemo(() => vehiculos.map((v) => ({
    value: String(v.id_vehiculo),
    label: `${v.marca || ''} ${v.modelo || ''}${v.version ? ` ${v.version}` : ''}`.trim(),
    description: `${v.anio || 'S/A'} · ${v.patente || 'S/P'} · $ ${Number(v.precio_venta_ars || 0).toLocaleString('es-AR')} ARS · U$S ${Number(v.precio_venta_usd || 0).toLocaleString('es-AR')}`,
    searchText: `${v.marca || ''} ${v.modelo || ''} ${v.version || ''} ${v.patente || ''} ${v.anio || ''}`,
  })), [vehiculos]);

  const selectedVehicle = useMemo(
    () => vehiculos.find((v) => v.id_vehiculo === Number(quote.id_vehiculo)) || currentVehicle,
    [vehiculos, quote.id_vehiculo, currentVehicle]
  );

  const changeVehicle = (value: string) => {
    const v = vehiculos.find((item) => item.id_vehiculo === Number(value));
    const ars = Number(v?.precio_venta_ars || 0) || Number(v?.precio_venta_usd || 0) * dolarActual;
    const usd = Number(v?.precio_venta_usd || 0) || (ars > 0 ? ars / dolarActual : 0);
    setQuote((prev) => ({
      ...prev,
      id_vehiculo: value,
      precio_final_ars: asText(ars),
      precio_final_usd: asText(usd),
    }));
  };

  const crearCotizacion = async () => {
    if (!quote.id_vehiculo || Number(quote.precio_final_usd) <= 0) return alert('Seleccioná un vehículo y definí el precio final.');
    setWorking(true);
    const res = await crearCotizacionProspecto({
      prospectoId: prospecto.id_prospecto,
      id_vehiculo: Number(quote.id_vehiculo),
      precio_final_usd: Number(quote.precio_final_usd),
      cotizacion_dolar: dolarActual,
      forma_pago: quote.forma_pago,
      anticipo_usd: Number(quote.anticipo_usd || 0),
      cantidad_cuotas: quote.forma_pago === 'Cuotas' ? Number(quote.cantidad_cuotas || 0) : undefined,
      valor_cuota_usd: quote.forma_pago === 'Cuotas' ? Number(quote.valor_cuota_usd || 0) : undefined,
      valor_permuta_usd: Number(quote.valor_permuta_usd || 0),
      observaciones: quote.observaciones,
      validez_dias: Number(quote.validez_dias || 7),
    });
    setWorking(false);
    if (!res.success) return alert(res.error || 'No se pudo crear la cotización.');
    window.location.reload();
  };

  const registrarReserva = async () => {
    if (Number(reserve.monto_usd) <= 0) return alert('Ingresá el monto de la reserva.');
    setWorking(true);
    const res = await registrarReservaProspecto({
      prospectoId: prospecto.id_prospecto,
      cotizacionId: latestQuote?.id_cotizacion,
      monto_usd: Number(reserve.monto_usd),
      cotizacion_dolar: dolarActual,
      fecha_limite: reserve.fecha_limite || undefined,
    });
    setWorking(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar la reserva.');
    window.location.reload();
  };

  const prepararVenta = async () => {
    const vehicleId = latestQuote?.id_vehiculo || currentVehicle?.id_vehiculo;
    if (!vehicleId) return alert('La operación necesita un vehículo asignado.');
    setWorking(true);
    const res = await asegurarClienteProspecto(prospecto.id_prospecto);
    setWorking(false);
    if (!res.success || !res.id_cliente) return alert(res.error || 'No se pudo preparar el cliente.');
    const params = new URLSearchParams({
      v: String(vehicleId),
      c: String(res.id_cliente),
      p: String(prospecto.id_prospecto),
    });
    if (latestQuote?.id_cotizacion) params.set('q', String(latestQuote.id_cotizacion));
    window.location.href = `/ventas/nueva?${params.toString()}`;
  };

  const agendarEntrega = async () => {
    if (!sale || !deliveryForm.fecha_programada) return alert('Indicá fecha y hora de entrega.');
    setWorking(true);
    const res = await programarEntrega({ id_venta: sale.id_venta, fecha_programada: deliveryForm.fecha_programada, notas: deliveryForm.notas });
    setWorking(false);
    if (!res.success) return alert(res.error || 'No se pudo programar la entrega.');
    window.location.reload();
  };

  const finalizarEntrega = async () => {
    if (!sale || !confirm('¿Confirmar que la unidad fue entregada al cliente?')) return;
    setWorking(true);
    const res = await completarEntrega(sale.id_venta);
    setWorking(false);
    if (!res.success) return alert(res.error || 'No se pudo completar la entrega.');
    window.location.reload();
  };

  const marcarContactado = async () => {
    setWorking(true);
    await actualizarEstadoProspecto(prospecto.id_prospecto, 'CONTACTADO' as any);
    setWorking(false);
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <Link href="/prospectos" className="text-sm font-bold text-slate-500 hover:text-blue-700 flex items-center gap-2 mb-3"><ArrowLeft className="w-4 h-4" /> Volver al pipeline</Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center"><Handshake className="w-6 h-6" /></div>
            <div><h1 className="text-3xl font-black text-slate-900">Operación #{prospecto.id_prospecto}</h1><p className="text-sm text-slate-500">{prospecto.nombre} · {prospecto.origen || 'SHOWROOM'}</p></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prospecto.telefono && <a href={`https://wa.me/${String(prospecto.telefono).replace(/\D/g, '')}`} target="_blank" className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> WhatsApp</a>}
          {currentVehicle && <Link href={`/vehiculos/${currentVehicle.id_vehiculo}`} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1.5"><Car className="w-4 h-4" /> Ver unidad</Link>}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-x-auto">
        <div className="min-w-[720px] flex items-center">
          {etapas.map((e, idx) => {
            const complete = idx <= currentStage;
            return <div key={e.key} className="flex items-center flex-1 last:flex-none"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${complete ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{complete ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}</div><span className={`text-xs font-black ${complete ? 'text-slate-900' : 'text-slate-400'}`}>{e.label}</span></div>{idx < etapas.length - 1 && <div className={`h-px flex-1 mx-3 ${idx < currentStage ? 'bg-blue-500' : 'bg-slate-200'}`} />}</div>;
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2"><UserRound className="w-5 h-5 text-blue-600" /><h2 className="font-black text-slate-900">Cliente / Lead</h2></div>
          <div><p className="text-lg font-black text-slate-900">{prospecto.nombre}</p>{prospecto.cliente && <p className="text-xs text-emerald-700 font-bold">Cliente vinculado #{prospecto.cliente.id_cliente}</p>}</div>
          <div className="space-y-2 text-sm text-slate-600"><p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {prospecto.telefono || 'Sin teléfono'}</p><p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {prospecto.email || 'Sin email'}</p><p className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-slate-400" /> Alta {new Date(prospecto.fecha_contacto).toLocaleDateString('es-AR')}</p></div>
          {Number(prospecto.presupuesto_estimado_usd || 0) > 0 && <div className="bg-blue-50 border border-blue-100 rounded-xl p-3"><p className="text-[10px] uppercase font-black text-blue-600">Presupuesto estimado</p><DualMoney usd={prospecto.presupuesto_estimado_usd} rate={dolarActual} primaryClassName="font-black text-blue-950" /></div>}
          {prospecto.notas && <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-xs text-slate-600">{prospecto.notas}</div>}
          {prospecto.estado === 'NUEVO' && <button disabled={working} onClick={marcarContactado} className="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-black">Marcar contactado</button>}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2"><Car className="w-5 h-5 text-indigo-600" /><h2 className="font-black text-slate-900">Unidad negociada</h2></div>
          {currentVehicle ? <><div><p className="text-xl font-black text-slate-900">{currentVehicle.marca} {currentVehicle.modelo}</p><p className="text-sm text-slate-500">{currentVehicle.version || ''} · {currentVehicle.anio || 'S/A'} · {currentVehicle.patente || 'S/P'}</p></div><div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4"><p className="text-[10px] uppercase font-black text-indigo-500">Precio publicado</p><DualMoney ars={currentVehicle.precio_venta_ars} usd={currentVehicle.precio_venta_usd} rate={dolarActual} primaryClassName="text-2xl font-black text-indigo-950" /><p className="text-xs font-bold text-indigo-700 mt-2">{currentVehicle.estado.replace(/_/g, ' ')}</p></div></> : <p className="text-sm text-slate-500">Todavía no hay una unidad asignada.</p>}
          {prospecto.tiene_permuta && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-[10px] uppercase font-black text-amber-700">Permuta declarada</p><p className="text-sm font-bold text-amber-900 mt-1">{prospecto.detalle_permuta || 'Pendiente de tasación'}</p></div>}
        </section>

        <section className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="font-black flex items-center gap-2"><ChevronRight className="w-5 h-5 text-blue-400" /> Próximo paso</h2>
          {!latestQuote && !sale && <button disabled={working} onClick={() => setShowQuote(true)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-sm flex items-center justify-center gap-2"><BadgeDollarSign className="w-4 h-4" /> Crear cotización</button>}
          {latestQuote && !activeReservation && !sale && <button disabled={working} onClick={() => setShowReserve(true)} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-sm flex items-center justify-center gap-2"><Tag className="w-4 h-4" /> Registrar reserva</button>}
          {(activeReservation || latestQuote) && !sale && <button disabled={working} onClick={prepararVenta} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-sm flex items-center justify-center gap-2">{working ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleDollarSign className="w-4 h-4" />} Pasar a venta</button>}
          {sale && delivery?.estado !== 'ENTREGADA' && <button disabled={working} onClick={() => setShowDelivery(true)} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-sm flex items-center justify-center gap-2"><Truck className="w-4 h-4" /> {delivery?.estado === 'PROGRAMADA' ? 'Reprogramar entrega' : 'Programar entrega'}</button>}
          {sale && delivery?.estado === 'PROGRAMADA' && <button disabled={working} onClick={finalizarEntrega} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-sm flex items-center justify-center gap-2"><FileCheck2 className="w-4 h-4" /> Confirmar entrega</button>}
          {sale && delivery?.estado === 'ENTREGADA' && <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-4 text-emerald-300"><p className="font-black flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Operación completada</p><p className="text-xs mt-1">Unidad entregada al cliente.</p></div>}
          {latestQuote && <div className="text-xs text-slate-300 border-t border-slate-700 pt-3"><p className="mb-1">Última cotización · {latestQuote.estado}</p><DualMoney usd={latestQuote.precio_final_usd} rate={latestQuote.cotizacion_dolar || dolarActual} primaryClassName="font-black text-white" secondaryClassName="text-[10px] text-slate-400" /></div>}
        </section>
      </div>

      {showQuote && (
        <section className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between"><div><h2 className="font-black text-slate-900 flex items-center gap-2"><BadgeDollarSign className="w-5 h-5 text-blue-600" /> Nueva cotización</h2><p className="text-xs text-slate-500 mt-1">Todos los valores se pueden ingresar en pesos o dólares.</p></div><button onClick={() => setShowQuote(false)} className="text-slate-400">✕</button></div>
          <SearchCombobox label="Vehículo a cotizar" required value={quote.id_vehiculo} onChange={changeVehicle} options={vehicleOptions} placeholder="Buscar por marca, modelo, patente o año..." />
          {selectedVehicle && <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-900">Precio publicado</p><p className="text-xs text-slate-500">Referencia del inventario, editable en la cotización.</p></div><DualMoney ars={selectedVehicle.precio_venta_ars} usd={selectedVehicle.precio_venta_usd} rate={dolarActual} compact /></div>}
          <DualCurrencyInput label="Precio final ofrecido" required ars={quote.precio_final_ars} usd={quote.precio_final_usd} rate={dolarActual} onChange={({ ars, usd }) => setQuote({ ...quote, precio_final_ars: ars, precio_final_usd: usd })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Forma de pago *</span><select value={quote.forma_pago} onChange={(e) => setQuote({ ...quote, forma_pago: e.target.value as any })} className="mt-1.5 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm"><option value="Contado">Contado</option><option value="Cuotas">Financiado</option></select></label><label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Validez de la oferta (días)</span><input type="number" min="1" value={quote.validez_dias} onChange={(e) => setQuote({ ...quote, validez_dias: e.target.value })} className="mt-1.5 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm" /></label></div>
          {quote.forma_pago === 'Cuotas' && <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-4"><h3 className="text-sm font-black text-indigo-900">Financiación</h3><DualCurrencyInput label="Anticipo" ars={quote.anticipo_ars} usd={quote.anticipo_usd} rate={dolarActual} onChange={({ ars, usd }) => setQuote({ ...quote, anticipo_ars: ars, anticipo_usd: usd })} /><label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Cantidad de cuotas</span><input type="number" min="1" value={quote.cantidad_cuotas} onChange={(e) => setQuote({ ...quote, cantidad_cuotas: e.target.value })} className="mt-1.5 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm" /></label><DualCurrencyInput label="Valor estimado por cuota" ars={quote.valor_cuota_ars} usd={quote.valor_cuota_usd} rate={dolarActual} onChange={({ ars, usd }) => setQuote({ ...quote, valor_cuota_ars: ars, valor_cuota_usd: usd })} /></div>}
          {prospecto.tiene_permuta && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3"><h3 className="text-sm font-black text-amber-900">Tasación preliminar de permuta</h3><p className="text-xs text-amber-800">{prospecto.detalle_permuta || 'Vehículo a tasar'}</p><DualCurrencyInput label="Valor estimado de toma" ars={quote.valor_permuta_ars} usd={quote.valor_permuta_usd} rate={dolarActual} onChange={({ ars, usd }) => setQuote({ ...quote, valor_permuta_ars: ars, valor_permuta_usd: usd })} /></div>}
          <label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Condiciones y observaciones</span><textarea value={quote.observaciones} onChange={(e) => setQuote({ ...quote, observaciones: e.target.value })} placeholder="Condiciones comerciales, documentación pendiente, aclaraciones..." className="mt-1.5 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm min-h-24" /></label>
          <div className="flex items-center justify-between gap-3 pt-3 border-t"><span className="text-xs text-slate-500">Cotización utilizada: $ {dolarActual.toLocaleString('es-AR')} por USD</span><button disabled={working} onClick={crearCotizacion} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black flex items-center gap-2">{working ? <Loader2 className="w-4 h-4 animate-spin" /> : <ReceiptText className="w-4 h-4" />} Guardar cotización</button></div>
        </section>
      )}

      {showReserve && (
        <section className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between"><div><h2 className="font-black text-slate-900 flex items-center gap-2"><Tag className="w-5 h-5 text-orange-600" /> Registrar reserva</h2><p className="text-xs text-slate-500 mt-1">La reserva queda vinculada a esta operación y a la última cotización.</p></div><button onClick={() => setShowReserve(false)} className="text-slate-400">✕</button></div>
          <DualCurrencyInput label="Monto de la reserva" required ars={reserve.monto_ars} usd={reserve.monto_usd} rate={dolarActual} onChange={({ ars, usd }) => setReserve({ ...reserve, monto_ars: ars, monto_usd: usd })} />
          <label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Vigencia de la reserva</span><input type="datetime-local" value={reserve.fecha_limite} onChange={(e) => setReserve({ ...reserve, fecha_limite: e.target.value })} className="mt-1.5 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm" /></label>
          <div className="flex justify-end"><button disabled={working} onClick={registrarReserva} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-black flex items-center gap-2">{working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />} Confirmar reserva</button></div>
        </section>
      )}

      {showDelivery && sale && (
        <section className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between"><div><h2 className="font-black text-slate-900 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-600" /> Programar entrega</h2><p className="text-xs text-slate-500 mt-1">Definí fecha, hora y cualquier indicación operativa.</p></div><button onClick={() => setShowDelivery(false)} className="text-slate-400">✕</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Fecha y hora *</span><input type="datetime-local" value={deliveryForm.fecha_programada} onChange={(e) => setDeliveryForm({ ...deliveryForm, fecha_programada: e.target.value })} className="mt-1.5 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm" /></label><label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Notas de entrega</span><input value={deliveryForm.notas} onChange={(e) => setDeliveryForm({ ...deliveryForm, notas: e.target.value })} placeholder="Ej: traer DNI y comprobante de seguro" className="mt-1.5 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm" /></label></div>
          <div className="flex justify-end"><button disabled={working || !deliveryForm.fecha_programada} onClick={agendarEntrega} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black flex items-center gap-2"><CalendarCheck2 className="w-4 h-4" /> Guardar fecha</button></div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><h2 className="font-black text-slate-900 mb-4">Historial comercial</h2><div className="space-y-3">{timeline.map((event) => <div key={event.id} className="flex gap-3"><div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">{event.type === 'VENTA' ? <CircleDollarSign className="w-4 h-4 text-emerald-600" /> : event.type === 'RESERVA' ? <Tag className="w-4 h-4 text-orange-600" /> : event.type === 'COTIZACION' ? <BadgeDollarSign className="w-4 h-4 text-blue-600" /> : event.type === 'ENTREGA' ? <Truck className="w-4 h-4 text-indigo-600" /> : <UserRound className="w-4 h-4 text-slate-500" />}</div><div className="flex-1 border-b border-slate-100 pb-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-900">{event.title}</p><span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(event.date).toLocaleString('es-AR')}</span></div><p className="text-xs text-slate-500 mt-0.5">{event.detail}</p></div></div>)}</div></section>
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"><h2 className="font-black text-slate-900">Resumen de la operación</h2>{latestQuote ? <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-[10px] uppercase font-black text-cyan-700">Cotización vigente / última</p><DualMoney usd={latestQuote.precio_final_usd} rate={latestQuote.cotizacion_dolar || dolarActual} primaryClassName="text-xl font-black text-cyan-950" /><p className="text-xs text-cyan-800 mt-1">{latestQuote.forma_pago} · {latestQuote.estado}</p></div> : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Sin cotización registrada.</div>}{activeReservation && <div className="rounded-xl border border-orange-200 bg-orange-50 p-4"><p className="text-[10px] uppercase font-black text-orange-700">Reserva activa</p><DualMoney ars={activeReservation.monto_ars} usd={activeReservation.monto_usd} rate={activeReservation.cotizacion || dolarActual} primaryClassName="text-xl font-black text-orange-950" /><p className="text-xs text-orange-800 mt-1">{activeReservation.recibo_nro}</p></div>}{sale && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-[10px] uppercase font-black text-emerald-700">Venta cerrada</p><DualMoney usd={sale.precio_final_usd} rate={sale.cotizacion_dolar_venta || dolarActual} primaryClassName="text-xl font-black text-emerald-950" /><p className="text-xs text-emerald-800 mt-1">{sale.numero_boleto || `Venta #${sale.id_venta}`}</p></div>}{delivery && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><p className="text-[10px] uppercase font-black text-indigo-700">Entrega</p><p className="text-sm font-black text-indigo-950 mt-1">{delivery.estado}</p><p className="text-xs text-indigo-800 mt-1">{delivery.fecha_programada ? new Date(delivery.fecha_programada).toLocaleString('es-AR') : 'Sin fecha programada'}</p></div>}</section>
      </div>
    </div>
  );
}
