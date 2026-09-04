'use client';

import { useState } from 'react';
import { guardarProspecto, actualizarEstadoProspecto } from '@/actions/prospectos';
import {
  UserCheck,
  Plus,
  Phone,
  Mail,
  Car,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { EstadoProspecto } from '@prisma/client';

export default function ProspectosClient({
  initialProspectos,
  vehiculos,
}: {
  initialProspectos: any[];
  vehiculos: any[];
}) {
  const [prospectos, setProspectos] = useState(initialProspectos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await guardarProspecto({
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
      id_vehiculo_interes: form.id_vehiculo_interes ? parseInt(form.id_vehiculo_interes) : undefined,
      origen: form.origen,
      presupuesto_estimado_usd: form.presupuesto_estimado_usd ? parseFloat(form.presupuesto_estimado_usd) : undefined,
      tiene_permuta: form.tiene_permuta,
      detalle_permuta: form.detalle_permuta,
      notas: form.notas,
    });

    if (res.success) {
      setIsModalOpen(false);
      window.location.reload();
    } else {
      alert(res.error || 'Error al guardar el prospecto.');
    }
    setIsSubmitting(false);
  };

  const handleCambiarEstado = async (id_prospecto: number, nuevoEstado: EstadoProspecto) => {
    const res = await actualizarEstadoProspecto(id_prospecto, nuevoEstado);
    if (res.success) {
      setProspectos((prev) =>
        prev.map((p) => (p.id_prospecto === id_prospecto ? { ...p, estado: nuevoEstado } : p))
      );
    }
  };

  const prospectosFiltrados =
    filtroEstado === 'TODOS'
      ? prospectos
      : prospectos.filter((p) => p.estado === filtroEstado);

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'NUEVO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTADO':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'VISITA_AGENDADA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NEGOCIACION':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PERMUTANDO':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'GANADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PERDIDO':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Acciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          {['TODOS', 'NUEVO', 'CONTACTADO', 'VISITA_AGENDADA', 'NEGOCIACION', 'GANADO'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroEstado === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo Prospecto
        </button>
      </div>

      {/* Tarjetas de Prospectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prospectosFiltrados.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
            No hay prospectos en este estado.
          </div>
        ) : (
          prospectosFiltrados.map((p) => (
            <div
              key={p.id_prospecto}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{p.nombre}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(p.fecha_contacto).toLocaleDateString('es-AR')} • Origen: {p.origen}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${getBadgeColor(
                    p.estado
                  )}`}
                >
                  {p.estado}
                </span>
              </div>

              {/* Datos de contacto */}
              <div className="space-y-1 text-xs text-slate-600">
                {p.telefono && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.telefono}</span>
                  </p>
                )}
                {p.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.email}</span>
                  </p>
                )}
              </div>

              {/* Vehículo de Interés */}
              {p.vehiculo_interes && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-blue-600" />
                    <div>
                      <strong className="text-slate-900">
                        {p.vehiculo_interes.marca} {p.vehiculo_interes.modelo}
                      </strong>
                      <span className="text-slate-500 block">Año {p.vehiculo_interes.anio}</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900">
                    USD {Number(p.vehiculo_interes.precio_venta_usd).toLocaleString('es-AR')}
                  </span>
                </div>
              )}

              {/* Permuta si tiene */}
              {p.tiene_permuta && (
                <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-amber-900">
                  <strong className="block font-bold">Ofrece Permuta:</strong>
                  <span>{p.detalle_permuta || 'Vehículo usado a peritar'}</span>
                </div>
              )}

              {/* Notas */}
              {p.notas && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 line-clamp-2">
                  {p.notas}
                </p>
              )}

              {/* Selector de estado rápido */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Avanzar a:</span>
                <div className="flex items-center gap-1">
                  {p.estado !== 'NEGOCIACION' && (
                    <button
                      onClick={() => handleCambiarEstado(p.id_prospecto, EstadoProspecto.NEGOCIACION)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    >
                      Negociación
                    </button>
                  )}
                  {p.estado !== 'GANADO' && (
                    <button
                      onClick={() => handleCambiarEstado(p.id_prospecto, EstadoProspecto.GANADO)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      Ganado (Venta)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Prospecto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-lg text-slate-900">Registrar Nuevo Prospecto</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: Juan Ignacio Pérez"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="ej: 11 5544 3322"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Origen
                  </label>
                  <select
                    value={form.origen}
                    onChange={(e) => setForm({ ...form, origen: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="SHOWROOM">Showroom / Salón</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="WEB">Portal Web</option>
                    <option value="MERCADOLIBRE">Mercado Libre</option>
                    <option value="INSTAGRAM">Instagram / Redes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Vehículo de Interés
                </label>
                <select
                  value={form.id_vehiculo_interes}
                  onChange={(e) => setForm({ ...form, id_vehiculo_interes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccionar vehículo (Opcional)</option>
                  {vehiculos.map((v) => (
                    <option key={v.id_vehiculo} value={v.id_vehiculo}>
                      {v.marca} {v.modelo} ({v.anio}) - USD {Number(v.precio_venta_usd).toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tiene_permuta}
                    onChange={(e) => setForm({ ...form, tiene_permuta: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800">Ofrece vehículo usado en permuta</span>
                </label>

                {form.tiene_permuta && (
                  <input
                    type="text"
                    placeholder="ej: Ford Fiesta 2017 Titanium 85.000km"
                    value={form.detalle_permuta}
                    onChange={(e) => setForm({ ...form, detalle_permuta: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Observaciones / Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la conversación o requerimientos del cliente..."
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Prospecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
