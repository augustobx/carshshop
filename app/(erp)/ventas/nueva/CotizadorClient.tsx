'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Calculator,
  CarFront,
  CircleDollarSign,
  Loader2,
  Search,
  Shuffle,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { registrarVenta } from '@/actions/ventas';
import { useConfigStore } from '@/store/useConfigStore';

const money = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 2 });

export default function CotizadorClient({ vehiculos, clientes }: { vehiculos: any[]; clientes: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dolarBlue } = useConfigStore();
  const [submitting, setSubmitting] = useState(false);

  const [vSearch, setVSearch] = useState('');
  const [cSearch, setCSearch] = useState('');
  const [vehiculo, setVehiculo] = useState<any>(null);
  const [cliente, setCliente] = useState<any>(null);

  const [precioArs, setPrecioArs] = useState('');
  const [formaPago, setFormaPago] = useState<'Contado' | 'Cuotas'>('Contado');
  const [anticipoArs, setAnticipoArs] = useState('');
  const [cantidadCuotas, setCantidadCuotas] = useState('12');
  const [recargoPct, setRecargoPct] = useState('36');
  const [fechaPrimerCuota, setFechaPrimerCuota] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [tienePermuta, setTienePermuta] = useState(false);
  const [permuta, setPermuta] = useState({
    marca: '',
    modelo: '',
    version: '',
    anio: '',
    km: '',
    patente: '',
    color: '',
    motor: '',
    valor_toma_usd: '',
  });

  useEffect(() => {
    const v = Number(searchParams.get('v'));
    const c = Number(searchParams.get('c'));
    if (v) {
      const found = vehiculos.find((item) => item.id_vehiculo === v);
      if (found) setVehiculo(found);
    }
    if (c) {
      const found = clientes.find((item) => item.id_cliente === c);
      if (found) setCliente(found);
    }
  }, [searchParams, vehiculos, clientes]);

  useEffect(() => {
    if (vehiculo?.precio_sugerido_ars) setPrecioArs(String(vehiculo.precio_sugerido_ars));
  }, [vehiculo]);

  const vehiculosFiltrados = useMemo(() => {
    const q = vSearch.trim().toLowerCase();
    return vehiculos.filter((v) => !q || `${v.nombre} ${v.patente || ''}`.toLowerCase().includes(q)).slice(0, 12);
  }, [vehiculos, vSearch]);

  const clientesFiltrados = useMemo(() => {
    const q = cSearch.trim().toLowerCase();
    return clientes.filter((c) => !q || `${c.nombre_completo} ${c.dni || ''}`.toLowerCase().includes(q)).slice(0, 12);
  }, [clientes, cSearch]);

  const finalArs = Number(precioArs || 0);
  const finalUsd = dolarBlue > 0 ? finalArs / dolarBlue : 0;
  const anticipo = formaPago === 'Cuotas' ? Number(anticipoArs || 0) : finalArs;
  const anticipoUsd = dolarBlue > 0 ? anticipo / dolarBlue : 0;
  const permutaUsd = tienePermuta ? Number(permuta.valor_toma_usd || 0) : 0;
  const permutaArs = permutaUsd * dolarBlue;
  const capitalFinanciarArs = formaPago === 'Cuotas' ? Math.max(0, finalArs - anticipo - permutaArs) : 0;
  const recargo = formaPago === 'Cuotas' ? Math.max(0, Number(recargoPct || 0)) / 100 : 0;
  const totalFinanciadoArs = capitalFinanciarArs * (1 + recargo);
  const cuotas = Math.max(1, Number(cantidadCuotas || 1));
  const cuotaArs = formaPago === 'Cuotas' ? totalFinanciadoArs / cuotas : 0;
  const costoArs = Number(vehiculo?.precio_costo_ars || 0);
  const margenComercialArs = finalArs - costoArs - permutaArs;
  const ingresoFinancieroArs = totalFinanciadoArs - capitalFinanciarArs;

  const planPagos = () => {
    if (formaPago !== 'Cuotas') return undefined;
    const base = new Date(`${fechaPrimerCuota}T12:00:00`);
    return Array.from({ length: cuotas }).map((_, index) => {
      const fecha = new Date(base);
      fecha.setMonth(fecha.getMonth() + index);
      return {
        numero_cuota: index + 1,
        monto_usd: dolarBlue > 0 ? cuotaArs / dolarBlue : 0,
        fecha_vencimiento: fecha.toISOString(),
      };
    });
  };

  const procesar = async () => {
    if (!vehiculo || !cliente || finalArs <= 0) return alert('Seleccioná vehículo, cliente y precio final.');
    if (formaPago === 'Cuotas' && anticipo + permutaArs >= finalArs) return alert('Anticipo + permuta deben ser menores al precio final para financiar saldo.');
    if (tienePermuta && (!permuta.marca || !permuta.modelo || !permuta.anio || !permuta.km || permutaUsd <= 0)) return alert('Completá marca, modelo, año, km y valor de toma de la permuta.');

    setSubmitting(true);
    const res = await registrarVenta({
      id_vehiculo: vehiculo.id_vehiculo,
      id_cliente: cliente.id_cliente,
      precio_final_usd: Number(finalUsd.toFixed(2)),
      cotizacion_dolar: dolarBlue,
      forma_pago: formaPago,
      anticipo_usd: formaPago === 'Cuotas' ? Number(anticipoUsd.toFixed(2)) : Number(finalUsd.toFixed(2)),
      saldo_financiado_usd: formaPago === 'Cuotas' ? Number((capitalFinanciarArs / dolarBlue).toFixed(2)) : 0,
      cuotas: planPagos(),
      permuta: tienePermuta
        ? {
            marca: permuta.marca.trim(),
            modelo: permuta.modelo.trim(),
            version: permuta.version.trim() || undefined,
            anio: Number(permuta.anio),
            km: Number(permuta.km),
            patente: permuta.patente.trim() || undefined,
            color: permuta.color.trim() || undefined,
            motor: permuta.motor.trim() || undefined,
            valor_toma_usd: permutaUsd,
          }
        : undefined,
    });
    setSubmitting(false);

    if (!res.success) return alert(res.error || 'No se pudo registrar la venta.');
    router.push(`/ventas/${res.id_venta}`);
    router.refresh();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><Calculator className="w-6 h-6" /></div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Cerrar operación</h1>
          <p className="text-sm text-slate-500">Venta, financiación y permuta en un único flujo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2"><CarFront className="w-5 h-5 text-blue-600" /><h2 className="font-black text-slate-900">1. Unidad y cliente</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase">Vehículo</label>
                {vehiculo ? (
                  <div className="mt-1.5 rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-center justify-between gap-2"><div><p className="font-black text-blue-950">{vehiculo.nombre}</p><p className="text-xs text-blue-700">{vehiculo.patente} · {vehiculo.estado}</p></div><button onClick={() => setVehiculo(null)} className="text-xs font-black text-blue-700">Cambiar</button></div>
                ) : (
                  <div className="relative mt-1.5"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={vSearch} onChange={(e) => setVSearch(e.target.value)} placeholder="Modelo o patente" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm" /><div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">{vehiculosFiltrados.map((v) => <button key={v.id_vehiculo} onClick={() => setVehiculo(v)} className="w-full text-left p-3 border-b border-slate-100 hover:bg-blue-50"><p className="text-sm font-bold text-slate-900">{v.nombre}</p><p className="text-xs text-slate-500">{v.patente} · {v.estado}</p></button>)}</div></div>
                )}
              </div>

              <div>
                <div className="flex justify-between"><label className="text-xs font-black text-slate-500 uppercase">Cliente</label><Link href="/clientes" className="text-xs font-bold text-blue-700">Nuevo cliente</Link></div>
                {cliente ? (
                  <div className="mt-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between gap-2"><div><p className="font-black text-emerald-950">{cliente.nombre_completo}</p><p className="text-xs text-emerald-700">DNI {cliente.dni || 'S/N'}</p></div><button onClick={() => setCliente(null)} className="text-xs font-black text-emerald-700">Cambiar</button></div>
                ) : (
                  <div className="relative mt-1.5"><UserRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={cSearch} onChange={(e) => setCSearch(e.target.value)} placeholder="Nombre o DNI" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm" /><div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">{clientesFiltrados.map((c) => <button key={c.id_cliente} onClick={() => setCliente(c)} className="w-full text-left p-3 border-b border-slate-100 hover:bg-emerald-50"><p className="text-sm font-bold text-slate-900">{c.nombre_completo}</p><p className="text-xs text-slate-500">DNI {c.dni || 'S/N'}</p></button>)}</div></div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600" /><h2 className="font-black text-slate-900">2. Precio y modalidad</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-black text-slate-500 uppercase">Precio final ARS</label><input type="number" value={precioArs} onChange={(e) => setPrecioArs(e.target.value)} className="w-full mt-1.5 px-4 py-3 border border-emerald-300 rounded-xl font-black text-lg text-emerald-900" /></div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-[10px] uppercase font-black text-slate-400">Referencia USD</p><p className="text-2xl font-black text-slate-900">USD {money(finalUsd)}</p><p className="text-xs text-slate-500">TC ${money(dolarBlue)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-xl p-1.5"><button onClick={() => setFormaPago('Contado')} className={`py-2.5 rounded-lg text-sm font-black ${formaPago === 'Contado' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Contado</button><button onClick={() => setFormaPago('Cuotas')} className={`py-2.5 rounded-lg text-sm font-black ${formaPago === 'Cuotas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>Financiado</button></div>

            {formaPago === 'Cuotas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
                <div><label className="text-xs font-bold text-slate-500">Anticipo ARS</label><input type="number" value={anticipoArs} onChange={(e) => setAnticipoArs(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-500">Cuotas</label><input type="number" min="1" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-500">Recargo total %</label><input type="number" value={recargoPct} onChange={(e) => setRecargoPct(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-500">1ra cuota</label><input type="date" value={fechaPrimerCuota} onChange={(e) => setFechaPrimerCuota(e.target.value)} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" /></div>
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Shuffle className="w-5 h-5 text-amber-600" /><div><h2 className="font-black text-slate-900">3. Permuta</h2><p className="text-xs text-slate-500">Si hay toma, la unidad entra automáticamente al inventario.</p></div></div><label className="flex items-center gap-2 text-sm font-black text-slate-700"><input type="checkbox" checked={tienePermuta} onChange={(e) => setTienePermuta(e.target.checked)} /> Incluir permuta</label></div>
            {tienePermuta && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <input required value={permuta.marca} onChange={(e) => setPermuta({ ...permuta, marca: e.target.value })} placeholder="Marca *" className="px-3 py-2.5 border border-amber-200 rounded-xl text-sm" />
                <input required value={permuta.modelo} onChange={(e) => setPermuta({ ...permuta, modelo: e.target.value })} placeholder="Modelo *" className="px-3 py-2.5 border border-amber-200 rounded-xl text-sm" />
                <input value={permuta.version} onChange={(e) => setPermuta({ ...permuta, version: e.target.value })} placeholder="Versión" className="px-3 py-2.5 border border-amber-200 rounded-xl text-sm" />
                <input type="number" value={permuta.anio} onChange={(e) => setPermuta({ ...permuta, anio: e.target.value })} placeholder="Año *" className="px-3 py-2.5 border border-amber-200 rounded-xl text-sm" />
                <input type="number" value={permuta.km} onChange={(e) => setPermuta({ ...permuta, km: e.target.value })} placeholder="Kilómetros *" className="px-3 py-2.5 border border-amber-200 rounded-xl text-sm" />
                <input value={permuta.patente} onChange={(e) => setPermuta({ ...permuta, patente: e.target.value })} placeholder="Patente" className="px-3 py-2.5 border border-amber-200 rounded-xl text-sm uppercase" />
                <input value={permuta.color} onChange={(e) => setPermuta({ ...permuta, color: e.target.value })} placeholder="Color" className="px-3 py-2.5 border border-amber-200 rounded-xl text-sm" />
                <input type="number" value={permuta.valor_toma_usd} onChange={(e) => setPermuta({ ...permuta, valor_toma_usd: e.target.value })} placeholder="Valor toma USD *" className="px-3 py-2.5 border border-amber-300 rounded-xl text-sm font-black" />
                <input value={permuta.motor} onChange={(e) => setPermuta({ ...permuta, motor: e.target.value })} placeholder="Motor" className="px-3 py-2.5 border border-amber-200 rounded-xl text-sm lg:col-span-2" />
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <div className="bg-slate-950 text-white rounded-2xl p-5 shadow-xl sticky top-24 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4"><CircleDollarSign className="w-5 h-5 text-emerald-400" /><h2 className="font-black">Resumen de cierre</h2></div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-400"><span>Precio final</span><strong className="text-white">${money(finalArs)}</strong></div>
              {tienePermuta && <div className="flex justify-between text-amber-300"><span>Permuta</span><strong>- ${money(permutaArs)}</strong></div>}
              {formaPago === 'Cuotas' && <><div className="flex justify-between text-slate-400"><span>Anticipo</span><strong className="text-white">${money(anticipo)}</strong></div><div className="flex justify-between text-slate-400"><span>Capital financiado</span><strong className="text-white">${money(capitalFinanciarArs)}</strong></div><div className="flex justify-between text-indigo-300"><span>Interés total</span><strong>${money(ingresoFinancieroArs)}</strong></div></>}
            </div>

            {formaPago === 'Cuotas' ? <div className="rounded-xl bg-indigo-500/10 border border-indigo-400/20 p-4 text-center"><p className="text-[10px] uppercase font-black text-indigo-300">Plan</p><p className="text-2xl font-black mt-1">{cuotas} x ${money(cuotaArs)}</p><p className="text-xs text-indigo-200 mt-1">Total financiado ${money(totalFinanciadoArs)}</p></div> : <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-4 text-center"><p className="text-[10px] uppercase font-black text-emerald-300">Cobro de contado</p><p className="text-2xl font-black mt-1">${money(finalArs - permutaArs)}</p></div>}

            <div className="rounded-xl border border-slate-800 p-3 space-y-2"><div className="flex justify-between text-xs text-slate-400"><span>Costo inventario</span><span>${money(costoArs)}</span></div><div className="flex justify-between text-xs text-slate-400"><span>Margen comercial estimado</span><strong className={margenComercialArs >= 0 ? 'text-emerald-400' : 'text-red-400'}>${money(margenComercialArs)}</strong></div><div className="flex justify-between text-xs text-slate-400"><span>Ingreso financiero</span><strong className="text-indigo-300">${money(ingresoFinancieroArs)}</strong></div></div>

            <button disabled={submitting || !vehiculo || !cliente || finalArs <= 0} onClick={procesar} className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-sm font-black flex items-center justify-center gap-2">{submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />} Confirmar venta <ArrowRight className="w-4 h-4" /></button>
          </div>
        </aside>
      </div>
    </div>
  );
}
