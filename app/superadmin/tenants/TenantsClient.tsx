'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createTenantAction } from '@/actions/superadmin';
import {
  Building2,
  Plus,
  Search,
  Globe2,
  ArrowUpRight,
  Loader2,
  X,
  CalendarDays,
} from 'lucide-react';

function dateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function plusMonthInput() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return dateInputValue(date);
}

function statusLabel(status: string) {
  return ({ ACTIVE: 'Activo', TRIAL: 'Prueba', PAST_DUE: 'Vencido', SUSPENDED: 'Suspendido', CANCELED: 'Cancelado', CANCELLED: 'Cancelado' } as Record<string, string>)[status] || status;
}

function statusClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'TRIAL') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (status === 'CANCELED' || status === 'CANCELLED') return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

export default function TenantsClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', slug: '', planCode: initialData.plans?.[0]?.code || 'PRO', status: 'ACTIVE',
    periodStart: dateInputValue(), periodEnd: plusMonthInput(), trialEndsAt: plusMonthInput(),
    email: '', phone: '', address: '', city: '', cuit: '', adminName: '', adminEmail: '', adminPassword: '',
  });

  const tenants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (initialData.tenants || []).filter((tenant: any) => {
      const matchesSearch = !q || tenant.name.toLowerCase().includes(q) || tenant.slug.toLowerCase().includes(q) || tenant.email?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || tenant.status === statusFilter || (statusFilter === 'CANCELED' && tenant.status === 'CANCELLED');
      return matchesSearch && matchesStatus;
    });
  }, [initialData.tenants, search, statusFilter]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const result = await createTenantAction({ ...form, status: form.status as 'ACTIVE' | 'TRIAL' });
    if (!result.success) {
      setError(result.error || 'No se pudo crear la concesionaria.');
      setSaving(false);
      return;
    }
    setOpen(false);
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-400 font-black">Control de tenants</p>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">Concesionarias</h1>
          <p className="text-sm text-slate-500 mt-2">Alta, plan, membresía, vencimientos y acceso de cada tenant OnlyCars.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black">
          <Plus className="w-4 h-4" /> Nueva concesionaria
        </button>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, slug o email..." className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-indigo-500">
          <option value="ALL">Todos los estados</option><option value="ACTIVE">Activos</option><option value="TRIAL">Prueba</option><option value="SUSPENDED">Suspendidos</option><option value="PAST_DUE">Vencidos</option><option value="CANCELED">Cancelados</option>
        </select>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr><th className="text-left px-5 py-3">Concesionaria</th><th className="text-left px-5 py-3">Dominio</th><th className="text-left px-5 py-3">Plan</th><th className="text-left px-5 py-3">Membresía</th><th className="text-left px-5 py-3">Uso</th><th className="text-left px-5 py-3">Estado</th><th className="px-5 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {tenants.map((tenant: any) => {
                const domain = tenant.domains?.find((item: any) => item.isPrimary)?.hostname || `${tenant.slug}.${initialData.tenantBaseDomain}`;
                const subscription = tenant.subscription;
                const expiry = subscription?.status === 'TRIAL' && subscription?.trialEndsAt ? subscription.trialEndsAt : subscription?.currentPeriodEnd;
                return (
                  <tr key={tenant.id} className="hover:bg-slate-800/25">
                    <td className="px-5 py-4"><p className="font-bold text-white">{tenant.name}</p><p className="text-[11px] font-mono text-indigo-400 mt-0.5">{tenant.slug}</p></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Globe2 className="w-3.5 h-3.5" />{domain}</div></td>
                    <td className="px-5 py-4"><p className="font-bold text-slate-200">{subscription?.plan?.name || 'Sin plan'}</p><p className="text-[10px] text-slate-500 font-mono">{subscription?.plan?.code}</p></td>
                    <td className="px-5 py-4 text-xs text-slate-400"><div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{expiry ? new Date(expiry).toLocaleDateString('es-AR') : '—'}</div></td>
                    <td className="px-5 py-4 text-xs text-slate-400">{tenant._count?.vehiculos || 0} vehículos · {tenant._count?.memberships || 0} usuarios</td>
                    <td className="px-5 py-4"><span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-black ${statusClass(tenant.status)}`}>{statusLabel(tenant.status)}</span></td>
                    <td className="px-5 py-4 text-right"><Link href={`/superadmin/tenants/${tenant.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300">Configurar <ArrowUpRight className="w-3.5 h-3.5" /></Link></td>
                  </tr>
                );
              })}
              {!tenants.length && <tr><td colSpan={7} className="px-5 py-14 text-center text-slate-500">No hay concesionarias que coincidan con el filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto flex items-start justify-center" onMouseDown={() => !saving && setOpen(false)}>
          <div className="w-full max-w-3xl mt-4 md:mt-10 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider font-black text-indigo-400">Provisionamiento SaaS</p><h2 className="text-lg font-black text-white mt-1">Nueva concesionaria</h2></div><button onClick={() => setOpen(false)} disabled={saving} className="p-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleCreate} className="p-5 space-y-6">
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Nombre comercial"><input required value={form.name} onChange={(e) => { const name = e.target.value; const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); setForm((prev) => ({ ...prev, name, slug: prev.slug || slug })); }} className="input-saas" placeholder="Carsshop Automotores" /></Field>
                <Field label="Slug global"><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="input-saas font-mono" placeholder="carsshop" /><p className="text-[10px] text-slate-500 mt-1.5 font-mono">https://{form.slug || 'slug'}.{initialData.tenantBaseDomain}</p></Field>
                <Field label="Plan"><select value={form.planCode} onChange={(e) => setForm({ ...form, planCode: e.target.value })} className="input-saas">{initialData.plans.map((plan: any) => <option key={plan.id} value={plan.code}>{plan.name} · US$ {Number(plan.priceMonthly).toLocaleString('es-AR')}</option>)}</select></Field>
                <Field label="Estado inicial"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-saas"><option value="ACTIVE">Activo</option><option value="TRIAL">Prueba</option></select></Field>
                <Field label="Fecha de alta"><input type="date" required value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} className="input-saas" /></Field>
                <Field label="Vencimiento"><input type="date" required value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value, trialEndsAt: form.status === 'TRIAL' ? e.target.value : form.trialEndsAt })} className="input-saas" /></Field>
                {form.status === 'TRIAL' && <Field label="Fin de prueba"><input type="date" value={form.trialEndsAt} onChange={(e) => setForm({ ...form, trialEndsAt: e.target.value })} className="input-saas" /></Field>}
              </div>

              <div className="border-t border-slate-800 pt-5"><p className="text-xs uppercase tracking-wider font-black text-slate-400 mb-4">Datos de contacto</p><div className="grid md:grid-cols-2 gap-4"><Field label="Email comercial"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-saas" /></Field><Field label="Teléfono"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-saas" /></Field><Field label="Dirección"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-saas" /></Field><Field label="Ciudad"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-saas" /></Field><Field label="CUIT"><input value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} className="input-saas" /></Field></div></div>

              <div className="border-t border-slate-800 pt-5"><p className="text-xs uppercase tracking-wider font-black text-slate-400 mb-4">Usuario OWNER inicial</p><div className="grid md:grid-cols-2 gap-4"><Field label="Nombre"><input required value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} className="input-saas" /></Field><Field label="Email de acceso"><input required type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} className="input-saas" /></Field><Field label="Contraseña inicial"><input required type="password" minLength={8} value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} className="input-saas" placeholder="Mínimo 8 caracteres" /></Field></div></div>

              <div className="border-t border-slate-800 pt-5 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800">Cancelar</button><button disabled={saving} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-black inline-flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Crear tenant</button></div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`.input-saas{width:100%;border-radius:.75rem;border:1px solid rgb(30 41 59);background:rgb(2 6 23);padding:.65rem .8rem;font-size:.875rem;color:white;outline:none}.input-saas:focus{border-color:rgb(99 102 241)}.input-saas::placeholder{color:rgb(71 85 105)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[11px] uppercase tracking-wider font-black text-slate-500 mb-1.5">{label}</span>{children}</label>;
}
