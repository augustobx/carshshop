'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, HandCoins, Loader2 } from 'lucide-react';
import { registrarPrestamo } from '@/actions/prestamos';
import SearchCombobox from '@/components/common/SearchCombobox';
import DualCurrencyInput from '@/components/common/DualCurrencyInput';
import DualMoney from '@/components/common/DualMoney';

export default function NuevoPrestamoClient({ clientes, dolarActual }: { clientes: any[]; dolarActual: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [capital, setCapital] = useState({ ars: '', usd: '' });
  const [recargoPct, setRecargoPct] = useState('30');
  const [cantidadCuotas, setCantidadCuotas] = useState('12');
  const [primerVencimiento, setPrimerVencimiento] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0, 10);
  });

  const clientOptions = useMemo(() => clientes.map(c => ({
    value: String(c.id_cliente), label: c.nombre_completo,
    description: `DNI ${c.dni || 'S/N'}${c.telefono ? ` · ${c.telefono}` : ''}`,
    searchText: `${c.nombre_completo} ${c.dni || ''} ${c.cuit_cuil || ''} ${c.telefono || ''} ${c.email || ''}`,
  })), [clientes]);

  const capitalArs = Number(capital.ars || 0);
  const capitalUsd = Number(capital.usd || 0);
  const recargo = Math.max(0, Number(recargoPct || 0)) / 100;
  const totalArs = capitalArs * (1 + recargo);
  const totalUsd = dolarActual > 0 ? totalArs / dolarActual : 0;
  const count = Math.max(1, Number(cantidadCuotas || 1));
  const cuotaArs = totalArs / count;
  const cuotaUsd = dolarActual > 0 ? cuotaArs / dolarActual : 0;

  const submit = async () => {
    if (!clienteId || capitalArs <= 0 || capitalUsd <= 0) return alert('Seleccioná cliente y capital del préstamo.');
    if (!primerVencimiento) return alert('Indicá el primer vencimiento.');
    setSaving(true);
    const [y, m, d] = primerVencimiento.split('-').map(Number);
    const cuotas = Array.from({ length: count }).map((_, index) => {
      const date = new Date(Date.UTC(y, m - 1 + index, d, 12));
      return { numero_cuota: index + 1, monto_usd: Number(cuotaUsd.toFixed(2)), fecha_vencimiento: date.toISOString() };
    });
    const res = await registrarPrestamo({
      id_cliente: Number(clienteId), capital_entregado_usd: Number(capitalUsd.toFixed(2)), total_devolver_usd: Number(totalUsd.toFixed(2)), cotizacion_dolar: dolarActual, cuotas,
    });
    setSaving(false);
    if (!res.success) return alert(res.error || 'No se pudo registrar el préstamo.');
    router.push('/prestamos'); router.refresh();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-black text-slate-900 flex items-center gap-3"><HandCoins className="w-8 h-8 text-blue-600" /> Nuevo préstamo</h1><p className="text-sm text-slate-500 mt-1">Definí capital, recargo y plan de pagos con valores claros en ARS y USD.</p></div><button onClick={() => router.push('/prestamos')} className="px-4 py-2.5 bg-slate-100 rounded-xl font-bold text-sm flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Volver</button></div>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
        <SearchCombobox label="Cliente" required value={clienteId} onChange={setClienteId} options={clientOptions} placeholder="Buscar por nombre, DNI, CUIT o teléfono..." />
        <DualCurrencyInput label="Capital entregado" required ars={capital.ars} usd={capital.usd} rate={dolarActual} onChange={setCapital} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Recargo total (%) *</span><input type="number" min="0" step="any" value={recargoPct} onChange={(e) => setRecargoPct(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl" /></label>
          <label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Cantidad de cuotas *</span><input type="number" min="1" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl" /></label>
          <label><span className="text-xs font-black text-slate-600 uppercase tracking-wider">Primer vencimiento *</span><input type="date" value={primerVencimiento} onChange={(e) => setPrimerVencimiento(e.target.value)} className="mt-1.5 w-full px-3 py-2.5 border border-slate-300 rounded-xl" /></label>
        </div>
      </section>

      <section className="bg-slate-950 text-white rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div><p className="text-[10px] uppercase font-black text-slate-500">Capital</p><DualMoney ars={capitalArs} usd={capitalUsd} rate={dolarActual} primaryClassName="text-xl font-black text-white" secondaryClassName="text-xs text-slate-400" /></div>
        <div><p className="text-[10px] uppercase font-black text-slate-500">Total a devolver</p><DualMoney ars={totalArs} usd={totalUsd} rate={dolarActual} primaryClassName="text-xl font-black text-white" secondaryClassName="text-xs text-slate-400" /></div>
        <div><p className="text-[10px] uppercase font-black text-slate-500">Plan de pago</p><p className="text-xl font-black">{count} × $ {cuotaArs.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-slate-400">U$S {cuotaUsd.toLocaleString('es-AR', { maximumFractionDigits: 2 })} por cuota</p></div>
      </section>

      <div className="flex justify-end"><button disabled={saving || !clienteId || capitalArs <= 0} onClick={submit} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black flex items-center gap-2 disabled:opacity-50">{saving && <Loader2 className="w-5 h-5 animate-spin" />} Registrar préstamo</button></div>
    </div>
  );
}
