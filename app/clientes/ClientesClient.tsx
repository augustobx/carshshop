'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Plus, Users, UserRound, Phone, Mail, MapPin, Edit, Loader2, Save, X } from 'lucide-react';
import { guardarCliente, actualizarCliente } from '@/actions/clientes';

export default function ClientesClient({ clientes }: { clientes: any[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Estado del formulario
    const [formData, setFormData] = useState({ id_cliente: 0, nombre_completo: '', dni: '', telefono: '', email: '', domicilio: '' });

    // Buscador en vivo
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (searchTerm) params.set('q', searchTerm);
            else params.delete('q');
            router.push(`${pathname}?${params.toString()}`);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, pathname, router, searchParams]);

    const openModal = (cliente: any = null) => {
        setErrorMsg('');
        if (cliente) {
            setFormData({
                id_cliente: cliente.id_cliente,
                nombre_completo: cliente.nombre_completo || '',
                dni: cliente.dni || '',
                telefono: cliente.telefono || '',
                email: cliente.email || '',
                domicilio: cliente.domicilio || ''
            });
        } else {
            setFormData({ id_cliente: 0, nombre_completo: '', dni: '', telefono: '', email: '', domicilio: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        const res = formData.id_cliente === 0
            ? await guardarCliente(formData)
            : await actualizarCliente(formData.id_cliente, formData);

        if (res.success) {
            setIsModalOpen(false);
            router.refresh();
        } else {
            setErrorMsg(res.error || 'Error al guardar');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                    <Users className="w-8 h-8 text-indigo-600" /> Directorio de Clientes
                </h1>
                <button onClick={() => openModal()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-colors">
                    <Plus className="w-5 h-5" /> Nuevo Cliente
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, DNI o correo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                    </div>
                    <div className="text-sm font-bold text-slate-500 hidden md:block">
                        Total: {clientes.length} registrados
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">DNI</th>
                                <th className="px-6 py-4">Contacto</th>
                                <th className="px-6 py-4 text-center">Historial</th>
                                <th className="px-6 py-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No se encontraron clientes con esos parámetros.
                                    </td>
                                </tr>
                            ) : (
                                clientes.map((c) => (
                                    <tr key={c.id_cliente} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black">
                                                    {c.nombre_completo.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-base">{c.nombre_completo}</p>
                                                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                        <MapPin className="w-3 h-3" /> {c.domicilio || 'Sin domicilio registrado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600">{c.dni || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {c.telefono && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" /> {c.telefono}</div>}
                                                {c.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}</div>}
                                                {!c.telefono && !c.email && <span className="text-slate-400 italic">Sin datos</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-100" title="Ventas">
                                                    {c._count.ventas} V
                                                </span>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100" title="Préstamos">
                                                    {c._count.prestamos} P
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openModal(c)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 rounded-md transition-colors">
                                                <Edit className="w-3.5 h-3.5" /> Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE FORMULARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <UserRound className="w-5 h-5 text-indigo-600" />
                                {formData.id_cliente === 0 ? 'Registrar Nuevo Cliente' : 'Editar Cliente'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 bg-slate-200/50 hover:bg-slate-200 rounded-md transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border border-red-100">{errorMsg}</div>}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo *</label>
                                <input required type="text" value={formData.nombre_completo} onChange={e => setFormData({ ...formData, nombre_completo: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DNI</label>
                                    <input type="text" value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                                    <input type="text" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Domicilio Completo</label>
                                <input type="text" value={formData.domicilio} onChange={e => setFormData({ ...formData, domicilio: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}