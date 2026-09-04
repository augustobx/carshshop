'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePlanAction } from '@/actions/superadmin';
import { Layers3, Loader2, Users, Building2, Car, CheckCircle2 } from 'lucide-react';

export default function PlansClient({ plans }: { plans: any[] }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-400 font-black">Catálogo SaaS</p>
        <h1 className="text-2xl md:text-3xl font-black text-white mt-1">Planes OnlyCars</h1>
        <p className="text-sm text-slate-500 mt-2">El código técnico es estable. Nombre, precio, límites, capacidades y disponibilidad son editables.</p>
      </header>

      <div className="grid xl:grid-cols-3 gap-5 items-start">
        {plans.map((plan) => <PlanEditor key={plan.id} plan={plan} />)}
      </div>
    </div>
  );
}

function PlanEditor({ plan }: { plan: any }) {
  const router = useRouter();
  const featuresArray: string[] = Array.isArray(plan.features)
    ? plan.features.filter((item: unknown): item is string => typeof item === 'string')
    : [];
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: plan.name || '', description: plan.description || '', priceMonthly: String(plan.priceMonthly ?? 0),
    maxVehicles: String(plan.maxVehicles ?? 50), maxLocations: String(plan.maxLocations ?? 1), maxUsers: String(plan.maxUsers ?? 5),
    features: featuresArray.join(', '), isActive: Boolean(plan.isActive),
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    const result = await updatePlanAction(plan.id, {
      name: form.name,
      description: form.description,
      priceMonthly: Number(form.priceMonthly),
      maxVehicles: Number(form.maxVehicles),
      maxLocations: Number(form.maxLocations),
      maxUsers: Number(form.maxUsers),
      features: form.features.split(',').map((item: string) => item.trim()).filter(Boolean),
      isActive: form.isActive,
    });
    if (!result.success) setError(result.error || 'No se pudo guardar el plan.');
    else { setMessage('Plan actualizado.'); router.refresh(); }
    setSaving(false);
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3">
        <div><div className="flex items-center gap-2"><Layers3 className="w-4 h-4 text-emerald-400" /><span className="text-[10px] uppercase tracking-widest font-black text-slate-500">Plan</span></div><p className="text-sm font-mono font-black text-emerald-400 mt-2">{plan.code}</p></div>
        <span className={`text-[10px] px-2 py-1 rounded-full border font-black ${form.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-700'}`}>{form.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
      </div>

      <div className="p-5 space-y-4">
        {(message || error) && <div className={`rounded-lg border px-3 py-2 text-xs ${error ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>{error || message}</div>}
        <Field label="Nombre"><input required className="input-saas" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Descripción"><textarea className="input-saas min-h-20 resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Para qué tipo de concesionaria está pensado..." /></Field>
        <Field label="Precio mensual (USD)"><input min="0" step="0.01" type="number" className="input-saas" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })} /></Field>

        <div className="grid grid-cols-3 gap-2">
          <MiniField icon={Users} label="Usuarios"><input min="1" type="number" className="input-saas" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: e.target.value })} /></MiniField>
          <MiniField icon={Building2} label="Sucursales"><input min="1" type="number" className="input-saas" value={form.maxLocations} onChange={(e) => setForm({ ...form, maxLocations: e.target.value })} /></MiniField>
          <MiniField icon={Car} label="Vehículos"><input min="1" type="number" className="input-saas" value={form.maxVehicles} onChange={(e) => setForm({ ...form, maxVehicles: e.target.value })} /></MiniField>
        </div>

        <Field label="Módulos / capacidades"><textarea className="input-saas min-h-24 resize-y font-mono" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="crm, inventario, ventas, caja" /><p className="text-[10px] text-slate-600 mt-1.5">Separados por coma. Se almacenan como capacidades del plan.</p></Field>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 cursor-pointer"><div><p className="text-sm font-bold text-slate-200">Plan disponible</p><p className="text-[11px] text-slate-500">Permite seleccionarlo en nuevas altas y cambios de plan.</p></div><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-emerald-500" /></label>

        <div className="flex items-center justify-between pt-2"><span className="text-[11px] text-slate-500 inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> {plan._count?.subscriptions || 0} suscripciones</span><button disabled={saving} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black inline-flex items-center gap-2">{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar</button></div>
      </div>

      <style jsx global>{`.input-saas{width:100%;border-radius:.75rem;border:1px solid rgb(30 41 59);background:rgb(2 6 23);padding:.65rem .8rem;font-size:.875rem;color:white;outline:none}.input-saas:focus{border-color:rgb(99 102 241)}.input-saas::placeholder{color:rgb(71 85 105)}`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[10px] uppercase tracking-wider font-black text-slate-500 mb-1.5">{label}</span>{children}</label>;
}

function MiniField({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return <label className="block"><span className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-black text-slate-600 mb-1.5"><Icon className="w-3 h-3" />{label}</span>{children}</label>;
}
