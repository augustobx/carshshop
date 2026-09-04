'use client';

import Link from 'next/link';
import { Plus, Car, Bike, Wrench, Search, Tag, LayoutGrid, List, FolderOpen, BookmarkCheck } from 'lucide-react';
import EstadoSelect from '@/components/vehiculos/EstadoSelect';
import DualMoney from '@/components/common/DualMoney';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function VehiculosClient({ vehiculos, currentTab, currentDolar, isMotos = false }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeBase = isMotos ? '/motos' : '/vehiculos';
  const entityLabel = isMotos ? 'Moto' : 'Vehículo';
  const EntityIcon = isMotos ? Bike : Car;

  const [view, setView] = useState<'cards' | 'lista'>('lista');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [orden, setOrden] = useState('recientes');
  const [page, setPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    const saved = localStorage.getItem(`inventory_view_${isMotos ? 'motos' : 'autos'}`);
    if (saved === 'cards' || saved === 'lista') setView(saved);
  }, [isMotos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) params.set('q', searchTerm.trim());
      else params.delete('q');
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router, searchParams]);

  const sorted = useMemo(() => {
    return [...vehiculos].sort((a: any, b: any) => {
      if (orden === 'az') return `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`);
      if (orden === 'za') return `${b.marca} ${b.modelo}`.localeCompare(`${a.marca} ${a.modelo}`);
      if (orden === 'mayor_precio') return Number(b.venta_ars || 0) - Number(a.venta_ars || 0);
      if (orden === 'menor_precio') return Number(a.venta_ars || 0) - Number(b.venta_ars || 0);
      return Number(b.id_vehiculo) - Number(a.id_vehiculo);
    });
  }, [vehiculos, orden]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const setViewPersisted = (next: 'cards' | 'lista') => {
    setView(next);
    localStorage.setItem(`inventory_view_${isMotos ? 'motos' : 'autos'}`, next);
  };

  const tabs = [
    ['en_preparacion', 'En preparación'],
    ['listos', 'Listos para venta'],
    ['consignacion', 'En consignación'],
    ['reservados', 'Con reserva'],
    ['vendidos', 'Vendidos'],
  ];

  const ReservationBadge = ({ v }: { v: any }) => v.reservado ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black" title={v.reserva_cliente ? `Reservado por ${v.reserva_cliente}` : 'Reserva activa'}>
      <BookmarkCheck className="w-3 h-3" /> RESERVADO
    </span>
  ) : null;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-slate-900">
            <EntityIcon className="w-8 h-8 text-indigo-600" /> Inventario de {isMotos ? 'Motos' : 'Vehículos'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Estado operativo, reserva comercial, costos y precio de venta en ARS y USD.</p>
        </div>
        <Link
          href={`/vehiculos/agregar?tipo=${isMotos ? 'Moto' : 'Auto'}&returnTo=${encodeURIComponent(routeBase)}`}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Agregar {entityLabel}
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map(([id, label]) => (
                <Link
                  key={id}
                  href={`${routeBase}?tab=${id}`}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${currentTab === id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="relative w-full xl:w-96">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Buscar ${isMotos ? 'moto' : 'vehículo'} por marca, modelo o patente...`}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
              Ordenar
              <select value={orden} onChange={(e) => setOrden(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold">
                <option value="recientes">Más recientes</option>
                <option value="az">Marca A → Z</option>
                <option value="za">Marca Z → A</option>
                <option value="mayor_precio">Mayor precio ARS</option>
                <option value="menor_precio">Menor precio ARS</option>
              </select>
            </label>
            <div className="flex bg-white rounded-lg border border-slate-300 p-1">
              <button onClick={() => setViewPersisted('lista')} className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${view === 'lista' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}><List className="w-4 h-4" /> Lista</button>
              <button onClick={() => setViewPersisted('cards')} className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 ${view === 'cards' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /> Tarjetas</button>
            </div>
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No hay {isMotos ? 'motos' : 'vehículos'} para los filtros actuales.</div>
        ) : view === 'lista' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[1150px]">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-black border-b">
                <tr>
                  <th className="px-5 py-4">Unidad</th>
                  <th className="px-5 py-4">Datos</th>
                  <th className="px-5 py-4 text-right">Costo</th>
                  <th className="px-5 py-4 text-right">Venta</th>
                  <th className="px-5 py-4">Estado operativo</th>
                  <th className="px-5 py-4">Reserva</th>
                  <th className="px-5 py-4 text-center">Tareas</th>
                  <th className="px-5 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((v: any) => (
                  <tr key={v.id_vehiculo} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900">{v.marca} {v.modelo}</p>
                      <div className="flex gap-1.5 mt-1">
                        {v.tipo_ingreso === 'Consignacion' && <span className="px-2 py-0.5 rounded bg-fuchsia-50 text-fuchsia-700 text-[10px] font-black"><Tag className="inline w-3 h-3 mr-1" />CONSIGNACIÓN</span>}
                        <span className="text-[10px] font-mono text-slate-400">#{v.id_vehiculo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <p>{v.anio || 'S/A'} · {Number(v.km || 0).toLocaleString('es-AR')} km {v.cilindrada ? `· ${v.cilindrada}` : ''}</p>
                      <p className="font-mono uppercase text-xs mt-1">{v.patente || 'S/P'}</p>
                    </td>
                    <td className="px-5 py-4 text-right"><DualMoney ars={v.compra_ars} usd={v.compra_usd} rate={currentDolar} compact /></td>
                    <td className="px-5 py-4 text-right"><DualMoney ars={v.venta_ars} usd={v.venta_usd} rate={currentDolar} compact primaryClassName="font-black text-emerald-700" /></td>
                    <td className="px-5 py-4"><EstadoSelect idVehiculo={v.id_vehiculo} estadoActual={v.estado} /></td>
                    <td className="px-5 py-4"><ReservationBadge v={v} />{!v.reservado && <span className="text-xs text-slate-300">—</span>}</td>
                    <td className="px-5 py-4 text-center">
                      {v.tareas_pendientes > 0 ? <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full text-xs font-black">{v.tareas_pendientes}</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/vehiculos/${v.id_vehiculo}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-black hover:bg-indigo-100"><FolderOpen className="w-3.5 h-3.5" /> Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {paginated.map((v: any) => (
              <div key={v.id_vehiculo} className="border border-slate-200 rounded-2xl p-5 bg-white hover:shadow-md transition-shadow space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2"><p className="font-black text-lg text-slate-900">{v.marca} {v.modelo}</p><ReservationBadge v={v} /></div>
                  <p className="text-xs text-slate-500 mt-1">{v.anio || 'S/A'} · {Number(v.km || 0).toLocaleString('es-AR')} km · <span className="uppercase">{v.patente || 'S/P'}</span></p>
                </div>
                <div><p className="text-[10px] uppercase font-black text-slate-400 mb-1">Estado operativo</p><EstadoSelect idVehiculo={v.id_vehiculo} estadoActual={v.estado} /></div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[10px] uppercase font-black text-emerald-700 mb-1">Precio de venta</p>
                  <DualMoney ars={v.venta_ars} usd={v.venta_usd} rate={currentDolar} primaryClassName="text-xl font-black text-emerald-900" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> {v.tareas_pendientes} tareas</span><DualMoney ars={v.compra_ars} usd={v.compra_usd} rate={currentDolar} compact showLabels={false} primaryClassName="font-bold text-slate-600" secondaryClassName="text-[10px] text-slate-400" /></div>
                <Link href={`/vehiculos/${v.id_vehiculo}`} className="block text-center w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-black">Abrir carpeta</Link>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500">Página {page} de {totalPages} · {sorted.length} resultados</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-2 rounded-lg border text-xs font-bold disabled:opacity-40">Anterior</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-2 rounded-lg border text-xs font-bold disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
