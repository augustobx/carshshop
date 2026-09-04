'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bike, Car, Loader2, Save } from 'lucide-react';
import { guardarVehiculo } from '@/actions/vehiculos';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';

export default function NuevoVehiculoClient({
  tipoInicial,
  returnHref,
  dolarActual,
}: {
  tipoInicial: 'Auto' | 'Moto';
  returnHref: string;
  dolarActual: number;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo_vehiculo: tipoInicial,
    marca: '', modelo: '', version: '', anio: String(new Date().getFullYear()), km: '', patente: '', vin: '',
    motor: '', transmision: '', traccion: '', combustible: '', cilindrada: '', color: '', puertas: '',
    estado: 'EN_PREPARACION', tipo_ingreso: 'Propio', comision_consignacion_pct: '', notas_internas: '',
  });
  const [compra, setCompra] = useState({ ars: '', usd: '' });
  const [venta, setVenta] = useState({ ars: '', usd: '' });

  const field = 'w-full mt-1.5 px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const label = 'text-xs font-black text-slate-600 uppercase tracking-wider';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.marca.trim() || !form.modelo.trim() || Number(form.anio) <= 0) return alert('Completá marca, modelo y año.');
    setSaving(true);
    const res = await guardarVehiculo({
      ...form,
      anio: Number(form.anio),
      km: Number(form.km || 0),
      puertas: form.puertas ? Number(form.puertas) : undefined,
      comision_consignacion_pct: Number(form.comision_consignacion_pct || 0),
      precio_compra_ars: Number(compra.ars || 0),
      precio_compra_usd: Number(compra.usd || 0),
      precio_venta_ars: Number(venta.ars || 0),
      precio_venta_usd: Number(venta.usd || 0),
    });
    setSaving(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar la unidad.');
    router.push(returnHref);
    router.refresh();
  };

  const Icon = tipoInicial === 'Moto' ? Bike : Car;

  return (
    <form onSubmit={submit} className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><Icon className="w-8 h-8 text-indigo-600" /> Ingresar {tipoInicial === 'Moto' ? 'Moto' : 'Vehículo'}</h1><p className="text-sm text-slate-500 mt-1">Alta de inventario con datos técnicos y valores en ambas monedas.</p></div>
        <button type="button" onClick={() => router.push(returnHref)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Volver</button>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
        <h2 className="font-black text-slate-900">Datos principales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label><span className={label}>Tipo *</span><select value={form.tipo_vehiculo} onChange={(e) => setForm({ ...form, tipo_vehiculo: e.target.value as 'Auto' | 'Moto' })} className={field}><option value="Auto">Auto / Camioneta</option><option value="Moto">Moto</option></select></label>
          <label><span className={label}>Marca *</span><input required value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Ej: Toyota" className={field} /></label>
          <label><span className={label}>Modelo *</span><input required value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Ej: Corolla" className={field} /></label>
          <label><span className={label}>Versión</span><input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="Ej: XEI CVT" className={field} /></label>
          <label><span className={label}>Año *</span><input required type="number" value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} className={field} /></label>
          <label><span className={label}>Kilometraje</span><input type="number" min="0" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} className={field} /></label>
          <label><span className={label}>Patente</span><input value={form.patente} onChange={(e) => setForm({ ...form, patente: e.target.value.toUpperCase() })} placeholder="AB123CD" className={`${field} uppercase font-mono`} /></label>
          <label><span className={label}>VIN / Chasis</span><input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value.toUpperCase() })} className={`${field} uppercase font-mono`} /></label>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
        <h2 className="font-black text-slate-900">Especificaciones técnicas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label><span className={label}>Motor</span><input value={form.motor} onChange={(e) => setForm({ ...form, motor: e.target.value })} placeholder="Ej: 2.0" className={field} /></label>
          <label><span className={label}>Transmisión</span><select value={form.transmision} onChange={(e) => setForm({ ...form, transmision: e.target.value })} className={field}><option value="">Sin especificar</option><option value="Manual">Manual</option><option value="Automática">Automática</option></select></label>
          <label><span className={label}>Tracción</span><input value={form.traccion} onChange={(e) => setForm({ ...form, traccion: e.target.value })} placeholder="4x2 / 4x4" className={field} /></label>
          <label><span className={label}>Combustible</span><input value={form.combustible} onChange={(e) => setForm({ ...form, combustible: e.target.value })} placeholder="Nafta / Diesel" className={field} /></label>
          <label><span className={label}>Cilindrada</span><input value={form.cilindrada} onChange={(e) => setForm({ ...form, cilindrada: e.target.value })} placeholder={form.tipo_vehiculo === 'Moto' ? 'Ej: 300 cc' : 'Ej: 2.0'} className={field} /></label>
          <label><span className={label}>Color</span><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={field} /></label>
          {form.tipo_vehiculo !== 'Moto' && <label><span className={label}>Puertas</span><input type="number" min="0" value={form.puertas} onChange={(e) => setForm({ ...form, puertas: e.target.value })} className={field} /></label>}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
        <h2 className="font-black text-slate-900">Estado comercial y valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label><span className={label}>Estado del inventario *</span><select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className={field}><option value="EN_PREPARACION">En preparación</option><option value="LISTO_PARA_VENTA">Listo para venta</option><option value="EN_CONSIGNACION">En consignación</option><option value="SENADO">Señado</option></select></label>
          <label><span className={label}>Tipo de ingreso *</span><select value={form.tipo_ingreso} onChange={(e) => setForm({ ...form, tipo_ingreso: e.target.value })} className={field}><option value="Propio">Propio</option><option value="Consignacion">Consignación</option><option value="Permuta">Permuta</option></select></label>
        </div>
        {form.tipo_ingreso === 'Consignacion' && <label className="block max-w-xs"><span className={label}>Comisión pactada (%)</span><input type="number" min="0" step="0.01" value={form.comision_consignacion_pct} onChange={(e) => setForm({ ...form, comision_consignacion_pct: e.target.value })} className={field} /></label>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <DualCurrencyInput label={form.tipo_ingreso === 'Consignacion' ? 'Valor del propietario / costo base' : 'Costo de compra'} ars={compra.ars} usd={compra.usd} rate={dolarActual} onChange={setCompra} />
          <DualCurrencyInput label="Precio de venta" required ars={venta.ars} usd={venta.usd} rate={dolarActual} onChange={setVenta} />
        </div>
        {Number(compra.ars || 0) > 0 && Number(venta.ars || 0) > 0 && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4"><p className="text-xs font-black text-emerald-700 uppercase">Margen bruto estimado</p><p className="text-xl font-black text-emerald-950 mt-1">$ {(Number(venta.ars) - Number(compra.ars)).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS</p><p className="text-xs font-bold text-emerald-700">U$S {((Number(venta.ars) - Number(compra.ars)) / dolarActual).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p></div>}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"><label><span className={label}>Notas internas</span><textarea value={form.notas_internas} onChange={(e) => setForm({ ...form, notas_internas: e.target.value })} placeholder="Observaciones sobre ingreso, documentación o estado de la unidad..." className={`${field} min-h-24`} /></label></section>

      <div className="flex justify-end"><button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black flex items-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Registrar {form.tipo_vehiculo === 'Moto' ? 'Moto' : 'Vehículo'}</button></div>
    </form>
  );
}
