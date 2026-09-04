import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getLoggedUser } from '@/lib/user-auth';
import { getSuperAdminDashboardAction } from '@/actions/superadmin';
import {
  Building2,
  CheckCircle2,
  Clock3,
  DollarSign,
  AlertTriangle,
  Car,
  BadgeDollarSign,
  ArrowUpRight,
  Layers3,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-AR');
}

function tenantStatusLabel(status: string) {
  if (status === 'ACTIVE') return 'Activo';
  if (status === 'TRIAL') return 'Prueba';
  if (status === 'PAST_DUE') return 'Vencido';
  if (status === 'SUSPENDED') return 'Suspendido';
  if (status === 'CANCELED' || status === 'CANCELLED') return 'Cancelado';
  return status;
}

function tenantStatusClass(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (status === 'TRIAL') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (status === 'CANCELED' || status === 'CANCELLED') return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
}

export default async function SuperAdminPage() {
  const user = await getLoggedUser();
  if (!user?.isSuperAdmin) redirect('/superadmin/login');

  const data = await getSuperAdminDashboardAction();
  const stats = data.stats;

  const cards = [
    { label: 'Total Tenants', value: stats.totalTenants, detail: `${stats.activeTenants} activos · ${stats.trialTenants} prueba`, icon: Building2, accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'MRR proyectado', value: `US$ ${stats.mrrProjected.toLocaleString('es-AR')}`, detail: `Cobrado 30 días: US$ ${stats.paidLast30Days.toLocaleString('es-AR')}`, icon: DollarSign, accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Suspendidos / vencidos', value: stats.suspendedTenants, detail: `${stats.canceledTenants} cancelados`, icon: AlertTriangle, accent: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { label: 'Operación global', value: stats.totalVehicles, detail: `${stats.totalSales} ventas registradas`, icon: Car, accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 to-indigo-950/40 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs uppercase tracking-[0.18em] font-black"><ShieldCheck className="w-4 h-4" /> NanoLabs SaaS</div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2">Plano de Control OnlyCars</h1>
          <p className="text-sm text-slate-400 mt-2">Tenants, membresías, vencimientos, planes y métricas globales de la plataforma.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/superadmin/tenants" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black shadow-lg shadow-indigo-950/30">
            <Plus className="w-4 h-4" /> Nueva concesionaria
          </Link>
          <Link href="/superadmin/planes" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-sm font-bold">
            <Layers3 className="w-4 h-4" /> Planes SaaS
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] uppercase tracking-[0.16em] font-black text-slate-500">{card.label}</p>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.accent}`}><Icon className="w-5 h-5" /></div>
              </div>
              <p className="text-3xl font-black text-white mt-4">{card.value}</p>
              <p className="text-xs text-slate-500 mt-1.5">{card.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)] gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-black text-white">Últimas concesionarias</h2>
              <p className="text-xs text-slate-500 mt-1">Altas recientes y estado de su membresía.</p>
            </div>
            <Link href="/superadmin/tenants" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">Ver todas <ArrowUpRight className="w-3.5 h-3.5" /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr><th className="text-left px-5 py-3">Concesionaria</th><th className="text-left px-5 py-3">Plan</th><th className="text-left px-5 py-3">Vence</th><th className="text-left px-5 py-3">Estado</th><th className="px-5 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {data.recentTenants.map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/25">
                    <td className="px-5 py-4"><p className="font-bold text-white">{tenant.name}</p><p className="text-[11px] text-indigo-400 font-mono mt-0.5">{tenant.slug}.{data.tenantBaseDomain}</p></td>
                    <td className="px-5 py-4 text-slate-300">{tenant.subscription?.plan?.name || 'Sin plan'}</td>
                    <td className="px-5 py-4 text-slate-400">{formatDate(tenant.subscription?.status === 'TRIAL' && tenant.subscription?.trialEndsAt ? tenant.subscription.trialEndsAt : tenant.subscription?.currentPeriodEnd)}</td>
                    <td className="px-5 py-4"><span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-black ${tenantStatusClass(tenant.status)}`}>{tenantStatusLabel(tenant.status)}</span></td>
                    <td className="px-5 py-4 text-right"><Link href={`/superadmin/tenants/${tenant.id}`} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Configurar</Link></td>
                  </tr>
                ))}
                {!data.recentTenants.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No hay tenants registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center gap-2"><Clock3 className="w-4 h-4 text-amber-400" /><h2 className="font-black text-white">Próximos vencimientos</h2></div>
            <p className="text-xs text-slate-500 mt-1">Membresías que vencen en los próximos 14 días.</p>
            <div className="mt-4 space-y-2">
              {(data.upcomingExpirations as any[]).slice(0, 6).map((item) => (
                <Link key={item.id} href={`/superadmin/tenants/${item.id}`} className="block rounded-xl border border-slate-800 bg-slate-950/50 p-3 hover:border-amber-500/30">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-white truncate">{item.name}</p><span className="text-xs font-black text-amber-400">{formatDate(item.expiresAt)}</span></div>
                  <p className="text-[11px] text-slate-500 mt-1">{item.planName} · {item.subscriptionStatus === 'TRIAL' ? 'Prueba' : 'Activo'}</p>
                </Link>
              ))}
              {!data.upcomingExpirations.length && <div className="py-6 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" /><p className="text-xs text-slate-500 mt-2">Sin vencimientos inmediatos.</p></div>}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between"><div className="flex items-center gap-2"><BadgeDollarSign className="w-4 h-4 text-emerald-400" /><h2 className="font-black text-white">Planes</h2></div><Link href="/superadmin/planes" className="text-xs text-indigo-400 font-bold">Editar</Link></div>
            <div className="mt-4 space-y-3">
              {data.plans.map((plan: any) => (
                <div key={plan.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-white">{plan.name}</p><p className="text-[10px] font-mono text-slate-500 mt-0.5">{plan.code}</p></div><p className="text-sm font-black text-emerald-400">US$ {Number(plan.priceMonthly).toLocaleString('es-AR')}</p></div>
                  <p className="text-[11px] text-slate-500 mt-2">{plan._count.subscriptions} suscripciones · {plan.isActive ? 'Activo' : 'Inactivo'}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
