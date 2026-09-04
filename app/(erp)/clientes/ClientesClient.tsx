'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Users, UserRound, Phone, Mail, MapPin, Edit, Loader2, Save, X } from 'lucide-react';
import { guardarCliente, actualizarCliente } from '@/actions/clientes';

const EMPTY = { id_cliente: 0, nombre_completo: '', dni: '', cuit_cuil: '', telefono: '', email: '', domicilio: '', localidad: '', provincia: '', notas: '' };

export default function ClientesClient({ clientes }: { clientes: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState<any>(EMPTY);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm.trim()) params.set('q', searchTerm.trim()); else params.delete('q');
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router, searchParams]);

  const openModal = (cliente?: any) => {
    setErrorMsg('');
    setFormData(cliente ? {
      id_cliente: cliente.id_cliente,
      nombre_completo: cliente.nombre_completo || '',
      dni: cliente.dni || '', cuit_cuil: cliente.cuit_cuil || '', telefono: cliente.telefono || '', email: cliente.email || '',
      domicilio: cliente.domicilio || '', localidad: cliente.localidad || '', provincia: cliente.provincia || '', notas: cliente.notas || '',
    } : EMPTY);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setErrorMsg('');
    const res = formData.id_cliente ? await actualizarCliente(formData.id_cliente, formData) : await guardarCliente(formData);
    setIsSubmitting(false);
    if (!res.success) return setErrorMsg(res.error || 'No se pudo guardar.');
    setIsModalOpen(false); router.refresh();
  };

  const input = 'w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const label = 'block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5';

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Comercial</p><h1 className="text-3xl font-black text-slate-900 mt-1 flex items-center gap-3"><Users className="w-8 h-8 text-blue-600" />Clientes</h1><p className="text-sm text-slate-500 mt-1">Directorio único con historial comercial, reservas y financiación.</p></div><button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700"><Plus className="w-5 h-5" /> Nuevo cliente</button></div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3"><div className="relative w-full md:w-[460px]"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar nombre, DNI/CUIT, teléfono o email..." className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><span className="text-sm font-bold text-slate-500">{clientes.length} clientes</span></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm min-w-[900px]"><thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b"><tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Identificación</th><th className="px-6 py-4">Contacto</th><th className="px-6 py-4 text-center">Actividad</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{clientes.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No se encontraron clientes.</td></tr> : clientes.map((c) => <tr key={c.id_cliente} className="hover:bg-slate-50"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black">{c.nombre_completo?.charAt(0)?.toUpperCase()}</div><div><p className="font-black text-slate-900">{c.nombre_completo}</p><p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{[c.domicilio, c.localidad, c.provincia].filter(Boolean).join(' · ') || 'Sin domicilio'}</p></div></div></td><td className="px-6 py-4"><p className="font-mono text-slate-700">DNI {c.dni || 'S/D'}</p><p className="text-xs text-slate-400 mt-1">CUIT/CUIL {c.cuit_cuil || 'S/D'}</p></td><td className="px-6 py-4 space-y-1">{c.telefono && <p className="flex items-center gap-2 text-slate-700"><Phone className="w-3.5 h-3.5 text-slate-400" />{c.telefono}</p>}{c.email && <p className="flex items-center gap-2 text-slate-700"><Mail className="w-3.5 h-3.5 text-slate-400" />{c.email}</p>}{!c.telefono && !c.email && <span className="text-slate-400">Sin contacto</span>}</td><td className="px-6 py-4 text-center"><div className="flex justify-center gap-2"><span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{c._count.ventas} ventas</span><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">{c._count.prestamos} préstamos</span><span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold">{c._count.senias} señas</span></div></td><td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => openModal(c)} className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"><Edit className="w-3.5 h-3.5" />Editar</button><Link href={`/clientes/${c.id_cliente}`} className="px-3 py-2 text-xs font-black rounded-lg bg-slate-900 text-white">Abrir carpeta</Link></div></td></tr>)}</tbody></table></div>
      </div>

      {isModalOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"><div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-6 overflow-hidden"><div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center"><div><h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><UserRound className="w-5 h-5 text-blue-600" />{formData.id_cliente ? 'Editar cliente' : 'Nuevo cliente'}</h3><p className="text-xs text-slate-500 mt-1">Completá identificación y contacto para evitar registros ambiguos.</p></div><button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-500"><X className="w-5 h-5" /></button></div><form onSubmit={handleSubmit} className="p-6 space-y-5">{errorMsg && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-bold">{errorMsg}</div>}<div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><label className={label}>Nombre completo *</label><input required className={input} value={formData.nombre_completo} onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })} /></div><div><label className={label}>DNI</label><input className={input} value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} /></div><div><label className={label}>CUIT / CUIL</label><input className={input} value={formData.cuit_cuil} onChange={(e) => setFormData({ ...formData, cuit_cuil: e.target.value })} /></div><div><label className={label}>Teléfono</label><input className={input} value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} /></div><div><label className={label}>Email</label><input type="email" className={input} value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div><div className="md:col-span-2"><label className={label}>Domicilio</label><input className={input} value={formData.domicilio} onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })} /></div><div><label className={label}>Localidad</label><input className={input} value={formData.localidad} onChange={(e) => setFormData({ ...formData, localidad: e.target.value })} /></div><div><label className={label}>Provincia</label><input className={input} value={formData.provincia} onChange={(e) => setFormData({ ...formData, provincia: e.target.value })} /></div><div className="md:col-span-2"><label className={label}>Notas internas</label><textarea className={`${input} min-h-24`} value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} /></div></div><div className="pt-4 border-t flex justify-end gap-3"><button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold">Cancelar</button><button type="submit" disabled={isSubmitting} className="px-5 py-3 bg-blue-600 text-white rounded-xl font-black flex items-center gap-2 disabled:opacity-50">{isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar cliente</button></div></form></div></div>}
    </div>
  );
}
