'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { guardarProspecto, actualizarEstadoProspecto } from '@/actions/prospectos';
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarClock,
  Car,
  CheckCircle2,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Tag,
  UserRound,
} from 'lucide-react';

const estados = ['TODOS', 'NUEVO', 'CONTACTADO', 'COTIZADO', 'NEGOCIACION', 'RESERVADO', 'GANADO', 'PERDIDO'];

function badgeEstado(estado: string) {
  const styles: Record<string, string> = {
    NUEVO: 'bg-blue-50 text-blue-700 border-blue-200',
    CONTACTADO: 'bg-amber-50 text-amber-700 border-amber-200',
    VISITA_AGENDADA: 'bg-violet-50 text-violet-700 border-violet-200',
    COTIZADO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    NEGOCIACION: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PERMUTANDO: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    RESERVADO: 'bg-orange-50 text-orange-700 border-orange-200',
    GANADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PERDIDO: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return styles[estado] || styles.NUEVO;
}

export default function ProspectosClient({
  initialProspectos,
  vehiculos,
}: {
  initialProspectos: any[];
  vehiculos: any[];
}) {
  const [prospectos, setProspectos] = useState(initialProspectos);
  const [filtro, setFiltro] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    id_vehiculo_interes: '',
    origen: 'SHOWROOM',
    presupuesto_estimado_usd: '',
    tiene_permuta: false,
    detalle_permuta: '',
    notas: '',
  });

  const filtrados = useMemo(() => {
    return prospectos.filter((p) => {
      const matchesEstado = filtro === 'TODOS' || p.estado === filtro;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || `${p.nombre} ${p.telefono || ''} ${p.email || ''}`.toLowerCase().includes(q);
      return matchesEstado && matchesSearch;
    });
  }, [prospectos, filtro, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await guardarProspecto({
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
      id_vehiculo_interes: form.id_vehiculo_interes ? Number(form.id_vehiculo_interes) : undefined,
      origen: form.origen,
      presupuesto_estimado_usd: form.presupuesto_estimado_usd ? Number(form.presupuesto_estimado_usd) : undefined,
      tiene_permuta: form.tiene_permuta,
      detalle_permuta: form.detalle_permuta,
      notas: form.notas,
    });
    setSaving(false);

    if (!res.success) return alert(res.error || 'No se pudo crear el prospecto.');
    window.location.href = `/prospectos/${res.id_prospecto}`;
  };

  const marcar = async (id: number, estado: any) => {
    const res = await actualizarEstadoProspecto(id, estado);
    if (res.success) setProspectos((prev) => prev.map((p) => p.id_prospecto === id ? { ...p, estado } : p));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar prospecto..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {estados.map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltro(estado)}
                className={`px-3 py-2 rounded-lg text-[11px] font-black whitespace-nowrap transition-colors ${filtro === estado ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                {estado.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo prospecto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {filtrados.map((p) => {
          const quote = p.cotizaciones?.[0];
          const reservation = p.senias?.[0];
          const sale = p.ventas?.[0];

          return (
            <div key={p.id_prospecto} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UserRound className="w-4 h-4 text-blue-600" />
                    <h3 className="font-black text-slate-900 truncate">{p.nombre}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">#{p.id_prospecto} · {p.origen || 'SHOWROOM'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black ${badgeEstado(p.estado)}`}>{p.estado.replace(/_/g, ' ')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <span className="text-slate-400 block mb-1">Contacto</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate"><Phone className="w-3 h-3" /> {p.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <span className="text-slate-400 block mb-1">Próxima acción</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1.5"><CalendarClock className="w-3 h-3" /> {p.proxima_accion ? new Date(p.proxima_accion).toLocaleDateString('es-AR') : 'Sin agenda'}</span>
                </div>
              </div>

              {p.vehiculo_interes ? (
                <div className="rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Car className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{p.vehiculo_interes.marca} {p.vehiculo_interes.modelo}</p>
                      <p className="text-xs text-slate-500">{p.vehiculo_interes.anio || 'S/A'} · {p.vehiculo_interes.patente || 'S/P'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">USD {Number(p.vehiculo_interes.precio_venta_usd || 0).toLocaleString('es-AR')}</span>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">Sin vehículo asignado todavía.</div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className={`rounded-xl p-2.5 border ${quote ? 'bg-cyan-50 border-cyan-200' : 'bg-slate-50 border-slate-100'}`}>
                  <BadgeDollarSign className={`w-4 h-4 ${quote ? 'text-cyan-700' : 'text-slate-400'}`} />
                  <p className="text-[10px] uppercase font-black mt-1 text-slate-500">Cotización</p>
                  <p className="text-xs font-bold text-slate-800">{quote ? `USD ${Number(quote.precio_final_usd).toLocaleString('es-AR')}` : 'Pendiente'}</p>
                </div>
                <div className={`rounded-xl p-2.5 border ${reservation ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                  <Tag className={`w-4 h-4 ${reservation ? 'text-orange-700' : 'text-slate-400'}`} />
                  <p className="text-[10px] uppercase font-black mt-1 text-slate-500">Reserva</p>
                  <p className="text-xs font-bold text-slate-800">{reservation ? `USD ${Number(reservation.monto_usd).toLocaleString('es-AR')}` : 'Pendiente'}</p>
                </div>
                <div className={`rounded-xl p-2.5 border ${sale ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${sale ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <p className="text-[10px] uppercase font-black mt-1 text-slate-500">Venta</p>
                  <p className="text-xs font-bold text-slate-800">{sale ? sale.numero_boleto || `#${sale.id_venta}` : 'Pendiente'}</p>
                </div>
              </div>

              {p.tiene_permuta && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <strong>Permuta:</strong> {p.detalle_permuta || 'A tasar'}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {p.estado === 'NUEVO' && <button onClick={() => marcar(p.id_prospecto, 'CONTACTADO')} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700">Contactado</button>}
                  {!['GANADO', 'PERDIDO'].includes(p.estado) && <button onClick={() => marcar(p.id_prospecto, 'PERDIDO')} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600">Perdido</button>}
                </div>
                <Link href={`/prospectos/${p.id_prospecto}`} className="text-xs font-black text-blue-700 hover:text-blue-900 flex items-center gap-1">
                  Abrir operación <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 text-sm">
            No hay prospectos para este filtro.
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Nuevo prospecto</h3>
                <p className="text-xs text-slate-500">Alta rápida para iniciar la operación comercial.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre y apellido" className="sm:col-span-2 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
              <div className="relative"><Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm" /></div>
              <div className="relative"><Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm" /></div>
              <select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                <option value="SHOWROOM">Showroom</option><option value="WHATSAPP">WhatsApp</option><option value="WEB">Web</option><option value="MERCADOLIBRE">Mercado Libre</option><option value="INSTAGRAM">Instagram</option>
              </select>
              <input type="number" value={form.presupuesto_estimado_usd} onChange={(e) => setForm({ ...form, presupuesto_estimado_usd: e.target.value })} placeholder="Presupuesto USD" className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            </div>

            <select value={form.id_vehiculo_interes} onChange={(e) => setForm({ ...form, id_vehiculo_interes: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
              <option value="">Vehículo de interés (opcional)</option>
              {vehiculos.map((v) => <option key={v.id_vehiculo} value={v.id_vehiculo}>{v.marca} {v.modelo} · {v.anio} · USD {Number(v.precio_venta_usd || 0).toLocaleString('es-AR')}</option>)}
            </select>

            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.tiene_permuta} onChange={(e) => setForm({ ...form, tiene_permuta: e.target.checked })} /> Tiene permuta
            </label>
            {form.tiene_permuta && <input value={form.detalle_permuta} onChange={(e) => setForm({ ...form, detalle_permuta: e.target.value })} placeholder="Ej: Ford Focus 2018, 90.000 km" className="w-full border border-amber-200 bg-amber-50 rounded-xl px-3 py-2.5 text-sm" />}

            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Notas comerciales" className="w-full min-h-20 border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm font-bold text-slate-500">Cancelar</button>
              <button disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Crear y abrir
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
