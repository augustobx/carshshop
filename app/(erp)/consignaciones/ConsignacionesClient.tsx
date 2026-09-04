'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CarFront, Plus, Search, UserRound, Loader2, X } from 'lucide-react';
import { registrarConsignacion, liquidarConsignacion } from '@/actions/consignaciones';
import SearchCombobox from '@/components/common/SearchCombobox';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import DualMoney from '@/components/common/DualMoney';

export default function ConsignacionesClient({ vehiculos, clientes, dolarActual }: { vehiculos: any[]; clientes: any[]; dolarActual: number }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [precio, setPrecio] = useState({ ars: '', usd: '' });
  const [form, setForm] = useState({ tipo_vehiculo: 'Auto', marca: '', modelo: '', anio: String(new Date().getFullYear()), patente: '', km: '', comision_pct: '5' });

  const clientOptions = useMemo(() => clientes.map(c => ({ value: String(c.id_cliente), label: c.nombre_completo, description: `DNI ${c.dni || 'S/N'}${c.telefono ? ` · ${c.telefono}` : ''}`, searchText: `${c.nombre_completo} ${c.dni || ''} ${c.cuit_cuil || ''} ${c.telefono || ''}` })), [clientes]);
  const filtrados = useMemo(() => { const q = search.trim().toLowerCase(); return vehiculos.filter(v => !q || `${v.tipo_vehiculo || ''} ${v.marca || ''} ${v.modelo || ''} ${v.patente || ''} ${v.cliente?.nombre_completo || ''}`.toLowerCase().includes(q)); }, [vehiculos, search]);
  const totalVentaArs = vehiculos.reduce((s, v) => s + Number(v.precio_venta_ars || 0), 0);
  const totalVentaUsd = vehiculos.reduce((s, v) => s + Number(v.precio_venta_usd || 0), 0);
  const totalPropietariosArs = vehiculos.reduce((s, v) => s + Number(v.precio_compra_ars || 0), 0);
  const totalPropietariosUsd = vehiculos.reduce((s, v) => s + Number(v.precio_compra_usd || 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !form.marca.trim() || !form.modelo.trim() || Number(precio.ars || 0) <= 0) return alert('Completá propietario, unidad y precio de publicación.');
    setSaving(true);
    const res = await registrarConsignacion({ id_cliente: Number(clienteId), tipo_vehiculo: form.tipo_vehiculo, marca: form.marca.trim(), modelo: form.modelo.trim(), anio: Number(form.anio), patente: form.patente.trim(), km: Number(form.km || 0), precio_venta_ars: Number(precio.ars), comision_pct: Number(form.comision_pct || 0), cotizacion_dolar: dolarActual });
    setSaving(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar la consignación.');
    setOpen(false); setClienteId(''); setPrecio({ ars: '', usd: '' }); setForm({ tipo_vehiculo: 'Auto', marca: '', modelo: '', anio: String(new Date().getFullYear()), patente: '', km: '', comision_pct: '5' }); router.refresh();
  };

  const liquidar = async (v: any) => {
    const montoArs = Number(v.precio_compra_ars || 0);
    if (montoArs <= 0) return alert('La unidad no tiene monto de liquidación configurado.');
    if (!confirm(`¿Registrar pago al consignante por $ ${montoArs.toLocaleString('es-AR')} ARS?`)) return;
    const res = await liquidarConsignacion(v.id_vehiculo, { monto_ars: montoArs, cotizacion_dolar: dolarActual, descripcion: `Liquidación consignación ${v.marca} ${v.modelo} ${v.patente || ''}` });
    if (!res.success) return alert(res.error || 'No se pudo registrar la liquidación.');
    router.refresh();
  };

  const commissionPct = Math.max(0, Number(form.comision_pct || 0));
  const ownerArs = Number(precio.ars || 0) * (1 - commissionPct / 100);
  const agencyArs = Number(precio.ars || 0) - ownerArs;
  const input = 'mt-1.5 w-full border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500';
  const fieldLabel = 'text-xs font-black uppercase text-slate-600';

  return <div className="p-6 max-w-[1600px] mx-auto space-y-6">
    <div className="flex flex-col md:flex-row justify-between gap-4"><div><h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><CarFront className="w-8 h-8 text-fuchsia-600" /> Consignaciones</h1><p className="text-sm text-slate-500 mt-1">Autos, motos y utilitarios de terceros, con comisión y liquidación bimonetaria.</p></div><button onClick={() => setOpen(true)} className="px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva consignación</button></div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-white border border-slate-200 rounded-2xl p-5"><p className="text-xs font-black uppercase text-slate-500">Unidades</p><p className="text-3xl font-black text-slate-900 mt-2">{vehiculos.length}</p></div><div className="bg-fuchsia-50 border border-fuchsia-100 rounded-2xl p-5"><p className="text-xs font-black uppercase text-fuchsia-700">Valor publicado</p><DualMoney ars={totalVentaArs} usd={totalVentaUsd} rate={dolarActual} primaryClassName="text-2xl font-black text-fuchsia-950" /></div><div className="bg-amber-50 border border-amber-100 rounded-2xl p-5"><p className="text-xs font-black uppercase text-amber-700">Capital de terceros</p><DualMoney ars={totalPropietariosArs} usd={totalPropietariosUsd} rate={dolarActual} primaryClassName="text-2xl font-black text-amber-950" /></div></div>

    <div className="bg-white border border-slate-200 rounded-2xl p-4"><div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tipo, unidad, patente o propietario..." className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm" /></div></div>

    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm min-w-[1000px]"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b"><tr><th className="text-left px-5 py-4">Unidad</th><th className="text-left px-5 py-4">Propietario</th><th className="text-right px-5 py-4">Precio publicado</th><th className="text-right px-5 py-4">A liquidar</th><th className="text-right px-5 py-4">Comisión agencia</th><th className="text-right px-5 py-4">Acción</th></tr></thead><tbody className="divide-y">{filtrados.map(v => { const agencyUsd = Number(v.precio_venta_usd || 0) - Number(v.precio_compra_usd || 0); const agencyArsRow = Number(v.precio_venta_ars || 0) - Number(v.precio_compra_ars || 0); return <tr key={v.id_vehiculo} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-black text-slate-900">{v.marca} {v.modelo}</p><p className="text-xs text-slate-500">{v.tipo_vehiculo || 'Auto'} · {v.anio || 'S/A'} · {v.patente || 'S/P'} · {v.estado.replace(/_/g, ' ')}</p></td><td className="px-5 py-4"><p className="font-bold text-slate-800 flex items-center gap-2"><UserRound className="w-4 h-4 text-slate-400" />{v.cliente?.nombre_completo || 'Sin titular vinculado'}</p></td><td className="px-5 py-4 text-right"><DualMoney ars={v.precio_venta_ars} usd={v.precio_venta_usd} rate={dolarActual} compact primaryClassName="font-black text-fuchsia-800" /></td><td className="px-5 py-4 text-right"><DualMoney ars={v.precio_compra_ars} usd={v.precio_compra_usd} rate={dolarActual} compact /></td><td className="px-5 py-4 text-right"><DualMoney ars={agencyArsRow} usd={agencyUsd} rate={dolarActual} compact primaryClassName="font-black text-emerald-700" /><p className="text-[10px] text-slate-400">{Number(v.comision_consignacion_pct || 0)}%</p></td><td className="px-5 py-4 text-right"><button disabled={v.estado !== 'VENDIDO'} onClick={() => liquidar(v)} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-black disabled:opacity-30">Liquidar</button></td></tr>; })}{filtrados.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-500">No hay consignaciones para este filtro.</td></tr>}</tbody></table></div></div>

    {open && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto"><div className="flex justify-between"><div><h3 className="text-xl font-black text-slate-900">Nueva consignación</h3><p className="text-xs text-slate-500 mt-1">Seleccioná propietario, tipo de unidad y condiciones comerciales.</p></div><button type="button" onClick={() => setOpen(false)}><X className="w-5 h-5 text-slate-400" /></button></div><SearchCombobox label="Propietario / consignante" required value={clienteId} onChange={setClienteId} options={clientOptions} placeholder="Buscar por nombre, DNI, CUIT o teléfono..." /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label><span className={fieldLabel}>Tipo de vehículo *</span><select value={form.tipo_vehiculo} onChange={(e) => setForm({ ...form, tipo_vehiculo: e.target.value })} className={input}><option>Auto</option><option>Moto</option><option>Camioneta</option><option>Utilitario</option><option>Camion</option></select></label><label><span className={fieldLabel}>Marca *</span><input required value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className={input} /></label><label><span className={fieldLabel}>Modelo *</span><input required value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className={input} /></label><label><span className={fieldLabel}>Año *</span><input type="number" required value={form.anio} onChange={(e) => setForm({ ...form, anio: e.target.value })} className={input} /></label><label><span className={fieldLabel}>Patente</span><input value={form.patente} onChange={(e) => setForm({ ...form, patente: e.target.value.toUpperCase() })} className={`${input} uppercase`} /></label><label><span className={fieldLabel}>Kilometraje</span><input type="number" min="0" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} className={input} /></label><label><span className={fieldLabel}>Comisión agencia (%) *</span><input type="number" min="0" max="100" step="0.01" value={form.comision_pct} onChange={(e) => setForm({ ...form, comision_pct: e.target.value })} className={input} /></label></div><DualCurrencyInput label="Precio de publicación" required ars={precio.ars} usd={precio.usd} rate={dolarActual} onChange={setPrecio} /><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="bg-amber-50 border border-amber-100 rounded-xl p-3"><p className="text-[10px] uppercase font-black text-amber-700">Monto estimado del propietario</p><DualMoney ars={ownerArs} rate={dolarActual} /></div><div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"><p className="text-[10px] uppercase font-black text-emerald-700">Comisión estimada agencia</p><DualMoney ars={agencyArs} rate={dolarActual} /></div></div><div className="flex justify-end gap-3 border-t pt-4"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl font-bold">Cancelar</button><button disabled={saving} type="submit" className="px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Registrar</button></div></form></div>}
  </div>;
}
