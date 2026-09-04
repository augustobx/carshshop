'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BadgeDollarSign,
  Camera,
  Car,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  History,
  MessageSquare,
  Printer,
  Tag,
  Truck,
  UserRound,
  Wrench,
} from 'lucide-react';
import VehiculoForm from '@/components/vehiculos/VehiculoForm';
import TareasManager from '@/components/vehiculos/TareasManager';
import AnotacionesManager from '@/components/vehiculos/AnotacionesManager';
import GaleriaFotos from '@/components/vehiculos/GaleriaFotos';
import SeniasManager from '@/components/vehiculos/SeniasManager';
import { useConfigStore } from '@/store/useConfigStore';

type Tab = 'resumen' | 'comercial' | 'costos' | 'documentacion' | 'historial';

function estadoClass(estado: string) {
  if (estado === 'VENDIDO') return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20';
  if (estado === 'SENADO') return 'bg-orange-500/15 text-orange-300 border-orange-400/20';
  if (estado === 'LISTO_PARA_VENTA') return 'bg-blue-500/15 text-blue-300 border-blue-400/20';
  return 'bg-slate-500/15 text-slate-300 border-slate-400/20';
}

export default function VehiculoDashboardClient({
  vehiculo,
  clientes,
  timeline,
}: {
  vehiculo: any;
  clientes: any[];
  timeline: any[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const { dolarBlue } = useConfigStore();

  const gastosTareas = vehiculo.tareas.reduce(
    (sum: number, t: any) => sum + t.gastos.reduce((acc: number, g: any) => acc + Number(g.monto_usd || 0), 0),
    0
  );
  const costoRegistrado = Number(vehiculo.costo_total_real_usd || 0);
  const costoCalculado = Number(vehiculo.precio_compra_usd || 0) + gastosTareas + Number(vehiculo.gastos_preparacion_usd || 0) + Number(vehiculo.gastos_gestoria_usd || 0);
  const costoTotalUsd = Math.max(costoRegistrado, costoCalculado);
  const precioVenta = Number(vehiculo.precio_venta_usd || 0);
  const margenPotencial = precioVenta - costoTotalUsd;
  const margenPct = costoTotalUsd > 0 ? (margenPotencial / costoTotalUsd) * 100 : 0;

  const activeProspects = vehiculo.prospectos.filter((p: any) => !['GANADO', 'PERDIDO'].includes(p.estado));
  const latestQuote = vehiculo.cotizaciones?.[0] || null;
  const activeReservation = vehiculo.senias?.find((s: any) => s.estado === 'ACTIVA') || null;
  const lastSale = vehiculo.ventas?.[0] || null;

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'resumen', label: 'Resumen', icon: Car },
    { id: 'comercial', label: 'Comercial', icon: BadgeDollarSign, count: activeProspects.length },
    { id: 'costos', label: 'Costos y tareas', icon: Wrench, count: vehiculo.tareas.length },
    { id: 'documentacion', label: 'Documentación', icon: Camera, count: vehiculo.fotos?.length || 0 },
    { id: 'historial', label: 'Historial', icon: History, count: timeline.length },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="rounded-3xl bg-slate-950 text-white p-6 md:p-8 shadow-xl overflow-hidden relative">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div>
            <Link href="/vehiculos" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white mb-5">
              <ArrowLeft className="w-4 h-4" /> Inventario
            </Link>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full border text-[10px] uppercase font-black ${estadoClass(vehiculo.estado)}`}>{String(vehiculo.estado).replace(/_/g, ' ')}</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase font-black text-slate-300">{vehiculo.tipo_ingreso || 'Propio'}</span>
              {vehiculo.location?.name && <span className="text-xs text-slate-400">{vehiculo.location.name}</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{vehiculo.marca} {vehiculo.modelo}</h1>
            <p className="text-slate-400 mt-2 font-medium">{vehiculo.version || 'Sin versión'} · {vehiculo.anio || 'S/A'} · {vehiculo.patente || 'Sin patente'} · {Number(vehiculo.km || 0).toLocaleString('es-AR')} km</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Link href={`/documentos/ficha/${vehiculo.id_vehiculo}`} target="_blank" className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-black flex items-center gap-2"><Printer className="w-4 h-4 text-blue-400" /> Ficha de salón</Link>
              {vehiculo.estado !== 'VENDIDO' && <Link href={`/ventas/nueva?v=${vehiculo.id_vehiculo}`} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black flex items-center gap-2"><CircleDollarSign className="w-4 h-4" /> Cotizar / vender</Link>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 min-w-0 xl:min-w-[560px]">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><p className="text-[10px] uppercase font-black text-slate-500">Costo real</p><p className="text-lg font-black mt-1">USD {costoTotalUsd.toLocaleString('es-AR')}</p></div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><p className="text-[10px] uppercase font-black text-slate-500">Precio venta</p><p className="text-lg font-black mt-1 text-blue-300">USD {precioVenta.toLocaleString('es-AR')}</p></div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><p className="text-[10px] uppercase font-black text-slate-500">Margen</p><p className={`text-lg font-black mt-1 ${margenPotencial >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>USD {margenPotencial.toLocaleString('es-AR')}</p></div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4"><p className="text-[10px] uppercase font-black text-slate-500">Margen %</p><p className={`text-lg font-black mt-1 ${margenPct >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{margenPct.toFixed(1)}%</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-colors ${active ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon className="w-4 h-4" /> {tab.label}{typeof tab.count === 'number' && <span className={`px-1.5 py-0.5 rounded-md ${active ? 'bg-white/10' : 'bg-slate-100'}`}>{tab.count}</span>}</button>;
          })}
        </div>
      </div>

      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4"><div><h2 className="font-black text-slate-900">Datos de la unidad</h2><p className="text-xs text-slate-500">Información comercial, técnica y de stock.</p></div><FileText className="w-5 h-5 text-slate-400" /></div>
            <VehiculoForm vehiculo={vehiculo} />
          </div>

          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="font-black text-slate-900">Pulso comercial</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3"><UserRound className="w-4 h-4 text-blue-600" /><p className="text-[10px] uppercase font-black text-blue-600 mt-2">Prospectos activos</p><p className="text-2xl font-black text-blue-950">{activeProspects.length}</p></div>
                <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-3"><BadgeDollarSign className="w-4 h-4 text-cyan-600" /><p className="text-[10px] uppercase font-black text-cyan-600 mt-2">Cotizaciones</p><p className="text-2xl font-black text-cyan-950">{vehiculo.cotizaciones.length}</p></div>
              </div>
              {activeReservation && <div className="rounded-xl bg-orange-50 border border-orange-200 p-3"><p className="text-[10px] uppercase font-black text-orange-600">Reserva activa</p><p className="text-sm font-black text-orange-950 mt-1">{activeReservation.cliente.nombre_completo}</p><p className="text-xs text-orange-700">USD {Number(activeReservation.monto_usd).toLocaleString('es-AR')} · {activeReservation.recibo_nro}</p></div>}
              {lastSale && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3"><p className="text-[10px] uppercase font-black text-emerald-600">Venta</p><p className="text-sm font-black text-emerald-950 mt-1">{lastSale.numero_boleto || `#${lastSale.id_venta}`}</p><p className="text-xs text-emerald-700">{lastSale.cliente.nombre_completo}</p></div>}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-black text-slate-900 mb-3">Costeo rápido</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Compra</span><strong>USD {Number(vehiculo.precio_compra_usd || 0).toLocaleString('es-AR')}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Tareas/gastos</span><strong>USD {gastosTareas.toLocaleString('es-AR')}</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Preparación + gestoría</span><strong>USD {(Number(vehiculo.gastos_preparacion_usd || 0) + Number(vehiculo.gastos_gestoria_usd || 0)).toLocaleString('es-AR')}</strong></div>
                <div className="flex justify-between pt-2 border-t border-slate-100"><span className="font-black text-slate-700">Total</span><strong className="text-slate-950">USD {costoTotalUsd.toLocaleString('es-AR')}</strong></div>
                <p className="text-[10px] text-slate-400 pt-2">Referencia ARS: ${(costoTotalUsd * dolarBlue).toLocaleString('es-AR')} · TC ${dolarBlue.toLocaleString('es-AR')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comercial' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><p className="text-[10px] uppercase font-black text-slate-400">Última cotización</p>{latestQuote ? <><p className="text-2xl font-black text-slate-900 mt-2">USD {Number(latestQuote.precio_final_usd).toLocaleString('es-AR')}</p><p className="text-xs text-slate-500">{latestQuote.estado} · {new Date(latestQuote.createdAt).toLocaleDateString('es-AR')}</p></> : <p className="text-sm text-slate-500 mt-3">Sin cotizaciones.</p>}</div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><p className="text-[10px] uppercase font-black text-slate-400">Reserva</p>{activeReservation ? <><p className="text-lg font-black text-orange-700 mt-2">{activeReservation.recibo_nro}</p><p className="text-xs text-slate-500">{activeReservation.cliente.nombre_completo} · USD {Number(activeReservation.monto_usd).toLocaleString('es-AR')}</p></> : <p className="text-sm text-slate-500 mt-3">Sin reserva activa.</p>}</div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><p className="text-[10px] uppercase font-black text-slate-400">Venta / Entrega</p>{lastSale ? <><p className="text-lg font-black text-emerald-700 mt-2">{lastSale.numero_boleto || `Venta #${lastSale.id_venta}`}</p><p className="text-xs text-slate-500">{lastSale.entrega?.estado || 'Entrega pendiente'}</p></> : <p className="text-sm text-slate-500 mt-3">Unidad aún no vendida.</p>}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4"><div><h2 className="font-black text-slate-900">Oportunidades vinculadas</h2><p className="text-xs text-slate-500">Toda consulta, cotización y cierre asociado a esta unidad.</p></div><Link href={`/prospectos`} className="text-xs font-black text-blue-700">Abrir CRM</Link></div>
            <div className="space-y-3">
              {vehiculo.prospectos.map((p: any) => (
                <Link key={p.id_prospecto} href={`/prospectos/${p.id_prospecto}`} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                  <div><p className="font-black text-slate-900">{p.nombre}</p><p className="text-xs text-slate-500">{p.origen} · {p.telefono || 'Sin teléfono'}</p></div>
                  <div className="flex items-center gap-2"><span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black">{p.estado.replace(/_/g, ' ')}</span>{p.cotizaciones?.[0] && <span className="text-xs font-black text-cyan-700">USD {Number(p.cotizaciones[0].precio_final_usd).toLocaleString('es-AR')}</span>}</div>
                </Link>
              ))}
              {vehiculo.prospectos.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Esta unidad todavía no tiene oportunidades comerciales registradas.</div>}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><h2 className="font-black text-slate-900 mb-4">Reservas / señas</h2><SeniasManager vehiculo={vehiculo} clientes={clientes} /></div>
        </div>
      )}

      {activeTab === 'costos' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><TareasManager tareas={vehiculo.tareas} idVehiculo={vehiculo.id_vehiculo} /></div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit"><h2 className="font-black text-slate-900 mb-4">Resumen de inversión</h2><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Compra</span><strong>USD {Number(vehiculo.precio_compra_usd || 0).toLocaleString('es-AR')}</strong></div><div className="flex justify-between"><span className="text-slate-500">Gastos operativos</span><strong>USD {gastosTareas.toLocaleString('es-AR')}</strong></div><div className="flex justify-between pt-3 border-t"><span className="font-black">Costo real</span><strong>USD {costoTotalUsd.toLocaleString('es-AR')}</strong></div></div></div>
        </div>
      )}

      {activeTab === 'documentacion' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex items-center gap-2 mb-4"><Camera className="w-5 h-5 text-blue-600" /><h2 className="font-black text-slate-900">Fotos y archivos</h2></div><GaleriaFotos fotos={vehiculo.fotos || []} idVehiculo={vehiculo.id_vehiculo} /></div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"><div className="flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5 text-slate-600" /><h2 className="font-black text-slate-900">Notas internas</h2></div><AnotacionesManager anotaciones={vehiculo.anotaciones || []} idVehiculo={vehiculo.id_vehiculo} /></div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5"><History className="w-5 h-5 text-slate-600" /><div><h2 className="font-black text-slate-900">Timeline 360°</h2><p className="text-xs text-slate-500">Ingreso, tareas, notas, interesados, cotizaciones, reservas, venta y entrega.</p></div></div>
          <div className="space-y-3">
            {timeline.map((event: any) => (
              <div key={event.id} className="flex gap-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-slate-100 flex items-center justify-center">{event.type === 'VENTA' ? <CircleDollarSign className="w-4 h-4 text-emerald-600" /> : event.type === 'RESERVA' ? <Tag className="w-4 h-4 text-orange-600" /> : event.type === 'COTIZACION' ? <BadgeDollarSign className="w-4 h-4 text-cyan-600" /> : event.type === 'ENTREGA' ? <Truck className="w-4 h-4 text-indigo-600" /> : event.type === 'TAREA' ? <Wrench className="w-4 h-4 text-amber-600" /> : event.type === 'PROSPECTO' ? <UserRound className="w-4 h-4 text-blue-600" /> : event.type === 'NOTA' ? <MessageSquare className="w-4 h-4 text-slate-600" /> : <Car className="w-4 h-4 text-slate-600" />}</div>
                <div className="flex-1 border-b border-slate-100 pb-3"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1"><p className="text-sm font-black text-slate-900">{event.title}</p><span className="text-[10px] text-slate-400">{new Date(event.date).toLocaleString('es-AR')}</span></div><p className="text-xs text-slate-500 mt-1">{event.detail}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
