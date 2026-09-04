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
  RefreshCw,
  Tag,
  Truck,
  UserRound,
} from 'lucide-react';
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
  const [working, setWorking] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showReserve, setShowReserve] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);

  const latestQuote = prospecto.cotizaciones?.[0] || null;
  const activeReservation = prospecto.senias?.find((s: any) => s.estado === 'ACTIVA') || null;
  const sale = prospecto.ventas?.[0] || null;
  const delivery = sale?.entrega || null;
  const currentVehicle = prospecto.vehiculo_interes || null;
  const currentStage = etapaIndex(prospecto.estado);

  const [quote, setQuote] = useState({
    id_vehiculo: String(currentVehicle?.id_vehiculo || vehiculos[0]?.id_vehiculo || ''),
    precio_final_usd: String(currentVehicle?.precio_venta_usd || ''),
    forma_pago: 'Contado' as 'Contado' | 'Cuotas',
    anticipo_usd: '',
    cantidad_cuotas: '12',
    valor_cuota_usd: '',
    valor_permuta_usd: '',
    observaciones: '',
    validez_dias: '7',
  });

  const [reserve, setReserve] = useState({
    monto_usd: '',
    fecha_limite: '',
  });

  const [deliveryForm, setDeliveryForm] = useState({
    fecha_programada: '',
    notas: '',
  });

  const selectedVehicle = useMemo(
    () => vehiculos.find((v) => v.id_vehiculo === Number(quote.id_vehiculo)) || currentVehicle,
    [vehiculos, quote.id_vehiculo, currentVehicle]
  );

  const crearCotizacion = async () => {
    if (!quote.id_vehiculo || Number(quote.precio_final_usd) <= 0) return alert('Seleccioná vehículo y precio final.');
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
    if (!currentVehicle?.id_vehiculo) return alert('La operación necesita un vehículo asignado.');
    setWorking(true);
    const res = await asegurarClienteProspecto(prospecto.id_prospecto);
    setWorking(false);
    if (!res.success || !res.id_cliente) return alert(res.error || 'No se pudo preparar el cliente.');
    window.location.href = `/ventas/nueva?v=${currentVehicle.id_vehiculo}&c=${res.id_cliente}`;
  };

  const agendarEntrega = async () => {
    if (!sale || !deliveryForm.fecha_programada) return;
    setWorking(true);
    const res = await programarEntrega({
      id_venta: sale.id_venta,
      fecha_programada: deliveryForm.fecha_programada,
      notas: deliveryForm.notas,
    });
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
          <Link href="/prospectos" className="text-sm font-bold text-slate-500 hover:text-blue-700 flex items-center gap-2 mb-3">
            <ArrowLeft className="w-4 h-4" /> Volver al pipeline
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center"><Handshake className="w-6 h-6" /></div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Operación #{prospecto.id_prospecto}</h1>
              <p className="text-sm text-slate-500">{prospecto.nombre} · {prospecto.origen || 'SHOWROOM'}</p>
            </div>
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
            return (
              <div key={e.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${complete ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{complete ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}</div>
                  <span className={`text-xs font-black ${complete ? 'text-slate-900' : 'text-slate-400'}`}>{e.label}</span>
                </div>
                {idx < etapas.length - 1 && <div className={`h-px flex-1 mx-3 ${idx < currentStage ? 'bg-blue-500' : 'bg-slate-200'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2"><UserRound className="w-5 h-5 text-blue-600" /><h2 className="font-black text-slate-900">Cliente / Lead</h2></div>
          <div>
            <p className="text-lg font-black text-slate-900">{prospecto.nombre}</p>
            {prospecto.cliente && <p className="text-xs text-emerald-700 font-bold">Cliente vinculado #{prospecto.cliente.id_cliente}</p>}
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {prospecto.telefono || 'Sin teléfono'}</p>
            <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {prospecto.email || 'Sin email'}</p>
            <p className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-slate-400" /> Alta {new Date(prospecto.fecha_contacto).toLocaleDateString('es-AR')}</p>
          </div>
          {prospecto.notas && <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-xs text-slate-600">{prospecto.notas}</div>}
          {prospecto.estado === 'NUEVO' && <button disabled={working} onClick={marcarContactado} className="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-black">Marcar contactado</button>}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2"><Car className="w-5 h-5 text-indigo-600" /><h2 className="font-black text-slate-900">Unidad negociada</h2></div>
          {currentVehicle ? (
            <>
              <div>
                <p className="text-xl font-black text-slate-900">{currentVehicle.marca} {currentVehicle.modelo}</p>
                <p className="text-sm text-slate-500">{currentVehicle.version || ''} · {currentVehicle.anio || 'S/A'} · {currentVehicle.patente || 'S/P'}</p>
              </div>
              <div className="flex items-end justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <div><p className="text-[10px] uppercase font-black text-indigo-500">Precio publicado</p><p className="text-2xl font-black text-indigo-900">USD {Number(currentVehicle.precio_venta_usd || 0).toLocaleString('es-AR')}</p></div>
                <span className="text-xs font-black text-indigo-700">{currentVehicle.estado.replace(/_/g, ' ')}</span>
              </div>
            </>
          ) : <p className="text-sm text-slate-500">Todavía no hay una unidad asignada.</p>}
          {prospecto.tiene_permuta && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-[10px] uppercase font-black text-amber-700">Permuta declarada</p><p className="text-sm font-bold text-amber-900 mt-1">{prospecto.detalle_permuta || 'Pendiente de tasación'}</p></div>}
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4">
          <h2 className="font-black flex items-center gap-2"><ChevronRight className="w-5 h-5 text-blue-400" /> Próximo paso</h2>
          {!latestQuote && !sale && <button disabled={working} onClick={() => setShowQuote(true)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-black text-sm flex items-center justify-center gap-2"><BadgeDollarSign className="w-4 h-4" /> Crear cotización</button>}
          {latestQuote && !activeReservation && !sale && <button disabled={working} onClick={() => setShowReserve(true)} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 font-black text-sm flex items-center justify-center gap-2"><Tag className="w-4 h-4" /> Registrar reserva</button>}
          {(activeReservation || latestQuote) && !sale && <button disabled={working} onClick={prepararVenta} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-sm flex items-center justify-center gap-2">{working ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleDollarSign className="w-4 h-4" />} Pasar a venta</button>}
          {sale && delivery?.estado !== 'ENTREGADA' && <button disabled={working} onClick={() => setShowDelivery(true)} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-sm flex items-center justify-center gap-2"><Truck className="w-4 h-4" /> {delivery?.estado === 'PROGRAMADA' ? 'Reprogramar entrega' : 'Programar entrega'}</button>}
          {sale && delivery?.estado === 'PROGRAMADA' && <button disabled={working} onClick={finalizarEntrega} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-sm flex items-center justify-center gap-2"><FileCheck2 className="w-4 h-4" /> Confirmar entrega</button>}
          {sale && delivery?.estado === 'ENTREGADA' && <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-4 text-emerald-300"><p className="font-black flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Operación completada</p><p className="text-xs mt-1">Unidad entregada al cliente.</p></div>}
          {latestQuote && <div className="text-xs text-slate-300 border-t border-slate-700 pt-3">Última cotización: <strong>USD {Number(latestQuote.precio_final_usd).toLocaleString('es-AR')}</strong> · {latestQuote.estado}</div>}
        </div>
      </div>

      {showQuote && (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-black text-slate-900 flex items-center gap-2"><BadgeDollarSign className="w-5 h-5 text-blue-600" /> Nueva cotización</h2><button onClick={() => setShowQuote(false)} className="text-slate-400">✕</button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={quote.id_vehiculo} onChange={(e) => { const id = e.target.value; const v = vehiculos.find((x) => x.id_vehiculo === Number(id)); setQuote({ ...quote, id_vehiculo: id, precio_final_usd: String(v?.precio_venta_usd || '') }); }} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm md:col-span-2">
              <option value="">Seleccionar vehículo</option>{vehiculos.map((v) => <option key={v.id_vehiculo} value={v.id_vehiculo}>{v.marca} {v.modelo} {v.anio} · USD {Number(v.precio_venta_usd || 0).toLocaleString('es-AR')}</option>)}
            </select>
            <input type="number" value={quote.precio_final_usd} onChange={(e) => setQuote({ ...quote, precio_final_usd: e.target.value })} placeholder="Precio final USD" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            <select value={quote.forma_pago} onChange={(e) => setQuote({ ...quote, forma_pago: e.target.value as any })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm"><option value="Contado">Contado</option><option value="Cuotas">Financiado</option></select>
            <input type="number" value={quote.anticipo_usd} onChange={(e) => setQuote({ ...quote, anticipo_usd: e.target.value })} placeholder="Anticipo USD" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            <input type="number" value={quote.validez_dias} onChange={(e) => setQuote({ ...quote, validez_dias: e.target.value })} placeholder="Validez días" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            {quote.forma_pago === 'Cuotas' && <><input type="number" value={quote.cantidad_cuotas} onChange={(e) => setQuote({ ...quote, cantidad_cuotas: e.target.value })} placeholder="Cantidad cuotas" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><input type="number" value={quote.valor_cuota_usd} onChange={(e) => setQuote({ ...quote, valor_cuota_usd: e.target.value })} placeholder="Valor cuota USD" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></>}
            {prospecto.tiene_permuta && <input type="number" value={quote.valor_permuta_usd} onChange={(e) => setQuote({ ...quote, valor_permuta_usd: e.target.value })} placeholder="Valor estimado permuta USD" className="border border-amber-200 bg-amber-50 rounded-xl px-3 py-2.5 text-sm" />}
          </div>
          <textarea value={quote.observaciones} onChange={(e) => setQuote({ ...quote, observaciones: e.target.value })} placeholder="Condiciones y observaciones" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm min-h-20" />
          <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Tipo de cambio: ${dolarActual.toLocaleString('es-AR')}</span><button disabled={working} onClick={crearCotizacion} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black flex items-center gap-2">{working ? <Loader2 className="w-4 h-4 animate-spin" /> : <ReceiptText className="w-4 h-4" />} Guardar cotización</button></div>
        </div>
      )}

      {showReserve && (
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-black text-slate-900 flex items-center gap-2"><Tag className="w-5 h-5 text-orange-600" /> Registrar reserva</h2><button onClick={() => setShowReserve(false)} className="text-slate-400">✕</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><input type="number" value={reserve.monto_usd} onChange={(e) => setReserve({ ...reserve, monto_usd: e.target.value })} placeholder="Monto de reserva USD" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><input type="datetime-local" value={reserve.fecha_limite} onChange={(e) => setReserve({ ...reserve, fecha_limite: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          <div className="flex justify-end"><button disabled={working} onClick={registrarReserva} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-black flex items-center gap-2">{working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />} Confirmar reserva</button></div>
        </div>
      )}

      {showDelivery && sale && (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-black text-slate-900 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-600" /> Programar entrega</h2><button onClick={() => setShowDelivery(false)} className="text-slate-400">✕</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><input type="datetime-local" value={deliveryForm.fecha_programada} onChange={(e) => setDeliveryForm({ ...deliveryForm, fecha_programada: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /><input value={deliveryForm.notas} onChange={(e) => setDeliveryForm({ ...deliveryForm, notas: e.target.value })} placeholder="Notas de entrega" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div>
          <div className="flex justify-end"><button disabled={working || !deliveryForm.fecha_programada} onClick={agendarEntrega} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-black flex items-center gap-2"><CalendarCheck2 className="w-4 h-4" /> Guardar fecha</button></div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="font-black text-slate-900 mb-4">Historial comercial</h2>
          <div className="space-y-3">
            {timeline.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">{event.type === 'VENTA' ? <CircleDollarSign className="w-4 h-4 text-emerald-600" /> : event.type === 'RESERVA' ? <Tag className="w-4 h-4 text-orange-600" /> : event.type === 'COTIZACION' ? <BadgeDollarSign className="w-4 h-4 text-blue-600" /> : event.type === 'ENTREGA' ? <Truck className="w-4 h-4 text-indigo-600" /> : <UserRound className="w-4 h-4 text-slate-500" />}</div>
                <div className="flex-1 border-b border-slate-100 pb-3"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-900">{event.title}</p><span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(event.date).toLocaleString('es-AR')}</span></div><p className="text-xs text-slate-500 mt-0.5">{event.detail}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-black text-slate-900">Resumen de la operación</h2>
          {latestQuote ? <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="text-[10px] uppercase font-black text-cyan-700">Cotización vigente / última</p><p className="text-xl font-black text-cyan-950 mt-1">USD {Number(latestQuote.precio_final_usd).toLocaleString('es-AR')}</p><p className="text-xs text-cyan-800 mt-1">{latestQuote.forma_pago} · {latestQuote.estado}</p></div> : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Sin cotización registrada.</div>}
          {activeReservation && <div className="rounded-xl border border-orange-200 bg-orange-50 p-4"><p className="text-[10px] uppercase font-black text-orange-700">Reserva activa</p><p className="text-xl font-black text-orange-950 mt-1">USD {Number(activeReservation.monto_usd).toLocaleString('es-AR')}</p><p className="text-xs text-orange-800 mt-1">{activeReservation.recibo_nro}</p></div>}
          {sale && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-[10px] uppercase font-black text-emerald-700">Venta cerrada</p><p className="text-xl font-black text-emerald-950 mt-1">USD {Number(sale.precio_final_usd).toLocaleString('es-AR')}</p><p className="text-xs text-emerald-800 mt-1">{sale.numero_boleto || `Venta #${sale.id_venta}`}</p></div>}
          {delivery && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><p className="text-[10px] uppercase font-black text-indigo-700">Entrega</p><p className="text-sm font-black text-indigo-950 mt-1">{delivery.estado}</p><p className="text-xs text-indigo-800 mt-1">{delivery.fecha_programada ? new Date(delivery.fecha_programada).toLocaleString('es-AR') : 'Sin fecha programada'}</p></div>}
        </div>
      </div>

      {working && <div className="fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Procesando operación...</div>}
    </div>
  );
}
