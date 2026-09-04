'use client';

import { useState } from 'react';
import {
  createTenantAction,
  updateTenantStatusAction,
  addTenantDomainAction,
} from '@/actions/superadmin';
import {
  Building2,
  Plus,
  Car,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Globe,
  Shield,
  Search,
} from 'lucide-react';

export default function TenantsManagerClient({
  initialData,
}: {
  initialData: {
    stats: {
      tenantsCount: number;
      activeTenantsCount: number;
      totalVehiclesCount: number;
      totalUsersCount: number;
    };
    tenants: any[];
    plans: any[];
  };
}) {
  const [tenants, setTenants] = useState(initialData.tenants);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    planCode: initialData.plans[0]?.code || 'PRO',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    subdomain: '',
  });

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createTenantAction(form);
    if (res.success && res.tenant) {
      setIsCreateOpen(false);
      window.location.reload();
    } else {
      setErrorMessage(res.error || 'Error al crear concesionaria.');
    }
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirm = window.confirm(
      `¿Estás seguro de cambiar el estado de la concesionaria a ${newStatus}?`
    );
    if (!confirm) return;

    const res = await updateTenantStatusAction(tenantId, newStatus);
    if (res.success) {
      setTenants((prev) =>
        prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t))
      );
    }
  };

  return (
    <div className="space-y-8">
      {/* Tarjetas de Métricas de Plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Concesionarias</p>
            <p className="text-2xl font-black text-white mt-0.5">{initialData.stats.tenantsCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenants Activos</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{initialData.stats.activeTenantsCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Vehículos en Stock</p>
            <p className="text-2xl font-black text-white mt-0.5">{initialData.stats.totalVehiclesCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Usuarios Registrados</p>
            <p className="text-2xl font-black text-white mt-0.5">{initialData.stats.totalUsersCount}</p>
          </div>
        </div>
      </div>

      {/* Barra de Acciones y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Nueva Concesionaria
        </button>
      </div>

      {/* Tabla de Concesionarias */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6">Concesionaria</th>
                <th className="py-4 px-6">Dominio / Host</th>
                <th className="py-4 px-6">Plan</th>
                <th className="py-4 px-6 text-center">Vehículos</th>
                <th className="py-4 px-6 text-center">Ventas</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No se encontraron concesionarias registradas.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const primaryDomain = t.domains.find((d: any) => d.isPrimary)?.hostname || `${t.slug}.onlycars.nanoapps.ar`;
                  const planName = t.subscription?.plan?.name || 'Starter';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-white text-base">{t.name}</p>
                          <p className="text-xs text-blue-400 font-mono mt-0.5">slug: {t.slug}</p>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>{primaryDomain}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {planName}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center font-bold text-slate-200">
                        {t._count?.vehiculos || 0}
                      </td>

                      <td className="py-4 px-6 text-center font-bold text-slate-200">
                        {t._count?.ventas || 0}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {t.status === 'ACTIVE' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Activo
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Suspendido
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleToggleStatus(t.id, t.status)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                            t.status === 'ACTIVE'
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          {t.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Concesionaria */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Alta de Concesionaria</h3>
                  <p className="text-xs text-slate-400">Provisionar nuevo tenant SaaS en NanoLabs</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white p-2"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: AutoNorte Automotores"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    setForm({ ...form, name, slug: form.slug ? form.slug : slug });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Identificador (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="autonorte"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Plan
                  </label>
                  <select
                    value={form.planCode}
                    onChange={(e) => setForm({ ...form, planCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {initialData.plans.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Dueño / Administrador de la Agencia
                </p>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nombre y Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Roberto Carlos"
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email de Acceso</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@autonorte.com"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Contraseña Inicial</label>
                  <input
                    type="text"
                    placeholder="Por defecto: Concesionaria2026!"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Provisionando...
                    </>
                  ) : (
                    'Crear Concesionaria'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
