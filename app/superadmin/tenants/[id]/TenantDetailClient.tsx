'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  updateTenantAction,
  registerSaaSPaymentAction,
  resetTenantUserPasswordAction,
  type SaaSStatus,
} from '@/actions/superadmin';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  CalendarDays,
  CreditCard,
  Users,
  Car,
  BadgeDollarSign,
  Loader2,
  ShieldCheck,
  Globe2,
  KeyRound,
} from 'lucide-react';

function asDateInput(value: Date | string | null | undefined) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function plusMonthFrom(value: Date | string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
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

export default function TenantDetailClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const tenant = initialData.tenant;
  const subscription = tenant.subscription;
  const primaryDomain = tenant.domains?.find((domain: any) => domain.isPrimary)?.hostname || `${tenant.slug}.${initialData.tenantBaseDomain}`;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: tenant.name || '', email: tenant.email || '', phone: tenant.phone || '', address: tenant.address || '', city: tenant.city || '', cuit: tenant.cuit || '',
    status: (tenant.status === 'CANCELLED' ? 'CANCELED' : tenant.status) as SaaSStatus,
    planId: subscription?.planId || '',
    periodStart: asDateInput(subscription?.currentPeriodStart),
    periodEnd: asDateInput(subscription?.currentPeriodEnd),
    trialEndsAt: asDateInput(subscription?.trialEndsAt),
  });

  const [payment, setPayment] = useState({
    amount: String(subscription?.plan?.priceMonthly ?? 0), currency: 'USD', method: 'TRANSFERENCIA', reference: '', notes: '',
    periodStart: asDateInput(subscription?.currentPeriodEnd) || asDateInput(new Date()),
    periodEnd: plusMonthFrom(subscription?.currentPeriodEnd),
    planId: subscription?.planId || '',
  });

  const saveTenant = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    const result = await updateTenantAction(tenant.id, form);
    if (!result.success) setError(result.error || 'No se pudo guardar.');
    else { setMessage('Configuración actualizada.'); router.refresh(); }
    setSaving(false);
  };

  const registerPayment = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    const result = await registerSaaSPaymentAction({ ...payment, tenantId: tenant.id, amount: Number(payment.amount) });
    if (!result.success) setError(result.error || 'No se pudo registrar el cobro.');
    else { setMessage('Cobro registrado y membresía reactivada.'); router.refresh(); }
    setSaving(false);
  };

  const resetPassword = async (userId: string, userEmail: string) => {
    const value = window.prompt(`Nueva contraseña para ${userEmail} (mínimo 8 caracteres):`);
    if (!value) return;
    setSaving(true); setMessage(''); setError('');
    const result = await resetTenantUserPasswordAction(userId, value);
    if (!result.success) setError(result.error || 'No se pudo cambiar la contraseña.'); else setMessage('Contraseña actualizada.');
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <Link href="/superadmin/tenants" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /> Volver a tenants</Link>
          <div className="flex flex-wrap items-center gap-3 mt-3"><h1 className="text-2xl md:text-3xl font-black text-white">{tenant.name}</h1><span className={`px-2.5 py-1 rounded-full border text-[11px] font-black ${statusClass(tenant.status)}`}>{statusLabel(tenant.status)}</span></div>
          <a href={`https://${primaryDomain}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 hover:text-indigo-300"><Globe2 className="w-3.5 h-3.5" /> https://{primaryDomain} <ExternalLink className="w-3 h-3" /></a>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"><p className="text-[10px] uppercase tracking-wider font-black text-slate-500">Tenant ID</p><p className="text-xs font-mono text-slate-300 mt-1">{tenant.id}</p></div>
      </div>

      {(message || error) && <div className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>{error || message}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Metric icon={Car} label="Vehículos" value={tenant._count?.vehiculos || 0} />
        <Metric icon={BadgeDollarSign} label="Ventas" value={tenant._count?.ventas || 0} />
        <Metric icon={Users} label="Usuarios" value={tenant._count?.memberships || 0} />
        <Metric icon={Building2} label="Sucursales" value={tenant._count?.locations || 0} />
        <Metric icon={CreditCard} label="Plan" value={subscription?.plan?.code || '—'} />
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)] gap-6 items-start">
        <div className="space-y-6">
          <form onSubmit={saveTenant} className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800"><h2 className="font-black text-white">Tenant y membresía</h2><p className="text-xs text-slate-500 mt-1">Datos comerciales, plan, estado y fechas que gobiernan el acceso.</p></div>
            <div className="p-5 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Nombre"><input className="input-saas" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Estado"><select className="input-saas" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SaaSStatus })}><option value="ACTIVE">Activo</option><option value="TRIAL">Prueba</option><option value="PAST_DUE">Vencido</option><option value="SUSPENDED">Suspendido</option><option value="CANCELED">Cancelado</option></select></Field>
                <Field label="Plan"><select className="input-saas" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>{initialData.plans.map((plan: any) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.code}) · US$ {Number(plan.priceMonthly).toLocaleString('es-AR')}</option>)}</select></Field>
                <Field label="Inicio membresía"><input type="date" className="input-saas" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} /></Field>
                <Field label="Vencimiento"><input type="date" className="input-saas" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} /></Field>
                <Field label="Fin de prueba"><input type="date" className="input-saas" value={form.trialEndsAt} onChange={(e) => setForm({ ...form, trialEndsAt: e.target.value || null as any })} /></Field>
              </div>

              <div className="border-t border-slate-800 pt-5"><p className="text-[11px] uppercase tracking-wider font-black text-slate-500 mb-3">Contacto</p><div className="grid md:grid-cols-2 gap-4"><Field label="Email"><input type="email" className="input-saas" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field><Field label="Teléfono"><input className="input-saas" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Dirección"><input className="input-saas" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field><Field label="Ciudad"><input className="input-saas" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field><Field label="CUIT"><input className="input-saas" value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} /></Field></div></div>
            </div>
            <div className="px-5 py-4 border-t border-slate-800 flex justify-end"><button disabled={saving} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-black inline-flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Guardar cambios</button></div>
          </form>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800"><h2 className="font-black text-white">Usuarios y accesos</h2><p className="text-xs text-slate-500 mt-1">Miembros asociados al tenant. El reset no muestra ni recupera claves existentes.</p></div>
            <div className="divide-y divide-slate-800/70">
              {tenant.memberships.map((membership: any) => <div key={membership.id} className="px-5 py-4 flex items-center justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-bold text-sm text-white truncate">{membership.user.name || membership.user.email}</p>{membership.role === 'OWNER' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}</div><p className="text-xs text-slate-500 truncate mt-0.5">{membership.user.email} · {membership.role} · {membership.location?.name || 'Todas'}</p></div><button type="button" onClick={() => resetPassword(membership.user.id, membership.user.email)} disabled={saving} className="shrink-0 p-2 rounded-lg border border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-500/30" title="Cambiar contraseña"><KeyRound className="w-4 h-4" /></button></div>)}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <form onSubmit={registerPayment} className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-emerald-500/15"><h2 className="font-black text-white">Registrar cobro / Renovar</h2><p className="text-xs text-slate-500 mt-1">Registra el pago, extiende el período y reactiva automáticamente el tenant.</p></div>
            <div className="p-5 space-y-4">
              <Field label="Plan"><select className="input-saas" value={payment.planId} onChange={(e) => { const plan = initialData.plans.find((item: any) => item.id === e.target.value); setPayment({ ...payment, planId: e.target.value, amount: plan ? String(plan.priceMonthly) : payment.amount }); }}>{initialData.plans.map((plan: any) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.code})</option>)}</select></Field>
              <div className="grid grid-cols-[1fr_100px] gap-3"><Field label="Monto"><input type="number" min="0" step="0.01" className="input-saas" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} /></Field><Field label="Moneda"><select className="input-saas" value={payment.currency} onChange={(e) => setPayment({ ...payment, currency: e.target.value })}><option>USD</option><option>ARS</option></select></Field></div>
              <div className="grid grid-cols-2 gap-3"><Field label="Desde"><input required type="date" className="input-saas" value={payment.periodStart} onChange={(e) => setPayment({ ...payment, periodStart: e.target.value })} /></Field><Field label="Hasta"><input required type="date" className="input-saas" value={payment.periodEnd} onChange={(e) => setPayment({ ...payment, periodEnd: e.target.value })} /></Field></div>
              <Field label="Método"><select className="input-saas" value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option><option value="MERCADOPAGO">MercadoPago</option><option value="OTRO">Otro</option></select></Field>
              <Field label="Referencia"><input className="input-saas" value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} placeholder="Comprobante / referencia" /></Field>
              <Field label="Notas"><textarea className="input-saas min-h-20 resize-y" value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} /></Field>
              <button disabled={saving} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-black text-white inline-flex items-center justify-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Registrar y reactivar</button>
            </div>
          </form>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800"><h2 className="font-black text-white">Historial SaaS</h2></div>
            <div className="max-h-[430px] overflow-y-auto divide-y divide-slate-800/70">
              {(subscription?.payments || []).map((item: any) => <div key={item.id} className="px-5 py-4"><div className="flex items-center justify-between gap-3"><p className="font-black text-sm text-emerald-400">{item.currency} {Number(item.amount).toLocaleString('es-AR')}</p><span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black">{item.status}</span></div><p className="text-xs text-slate-500 mt-1">{new Date(item.periodStart).toLocaleDateString('es-AR')} → {new Date(item.periodEnd).toLocaleDateString('es-AR')}</p><p className="text-[11px] text-slate-600 mt-1">{item.method || '—'}{item.reference ? ` · ${item.reference}` : ''}</p></div>)}
              {!subscription?.payments?.length && <p className="px-5 py-10 text-center text-xs text-slate-500">Todavía no hay cobros registrados.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><div className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-indigo-400" /><h2 className="font-black text-white">Dominios</h2></div><div className="mt-3 space-y-2">{tenant.domains.map((domain: any) => <div key={domain.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5"><p className="text-xs font-mono text-slate-300 break-all">{domain.hostname}</p><p className="text-[10px] text-slate-600 mt-1">{domain.isPrimary ? 'Principal' : 'Secundario'} · {domain.isCustom ? 'Personalizado' : 'NanoApps'}</p></div>)}</div></section>
        </div>
      </div>

      <style jsx global>{`.input-saas{width:100%;border-radius:.75rem;border:1px solid rgb(30 41 59);background:rgb(2 6 23);padding:.65rem .8rem;font-size:.875rem;color:white;outline:none}.input-saas:focus{border-color:rgb(99 102 241)}.input-saas::placeholder{color:rgb(71 85 105)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-[10px] uppercase tracking-wider font-black text-slate-500 mb-1.5">{label}</span>{children}</label>;
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-center gap-2 text-slate-500"><Icon className="w-4 h-4" /><span className="text-[10px] uppercase tracking-wider font-black">{label}</span></div><p className="text-xl font-black text-white mt-2">{value}</p></div>;
}
