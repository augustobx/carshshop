'use client';

import { useState } from 'react';
import { crearUsuario, eliminarUsuario } from '@/actions/usuarios';
import { ShieldCheck, UserPlus, Trash2, Users, X, Loader2, Mail, Lock, UserCircle } from 'lucide-react';

export default function UsuariosClient({ usuarios }: { usuarios: any[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState<'Admin' | 'Vendedor' | 'RRHH'>('Vendedor');

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const res = await crearUsuario({ nombre, email, password_plana: password, rol });

        if (res.success) {
            setIsModalOpen(false);
            setNombre(''); setEmail(''); setPassword(''); setRol('Vendedor');
            alert('¡Usuario creado correctamente!');
        } else {
            alert(res.error);
        }
        setIsSubmitting(false);
    };

    const handleEliminar = async (id: number, nombreUser: string) => {
        if (!confirm(`¿Estás seguro que deseas eliminar permanentemente a ${nombreUser}?`)) return;

        const res = await eliminarUsuario(id);
        if (!res.success) alert(res.error);
    };

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-2xl">
                        <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Accesos</h1>
                        <p className="text-slate-500 font-medium mt-1">Crea cuentas para tu equipo y define sus permisos.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[var(--color-brand,#4f46e5)] hover:bg-[var(--color-brand-hover,#4338ca)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[var(--color-brand,#4f46e5)]/30 transition-all active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Nuevo Usuario
                </button>
            </div>

            {/* TABLA DE USUARIOS */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest font-black">
                                <th className="p-5 pl-6">Usuario</th>
                                <th className="p-5">Email / Acceso</th>
                                <th className="p-5">Rol en el Sistema</th>
                                <th className="p-5 text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {usuarios.map(u => (
                                <tr key={u.id_usuario} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-5 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600">
                                                {u.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-800">{u.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 font-medium text-slate-600">{u.email}</td>
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${u.rol === 'Admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {u.rol === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCircle className="w-3.5 h-3.5" />}
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right pr-6">
                                        <button
                                            onClick={() => handleEliminar(u.id_usuario, u.nombre)}
                                            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR USUARIO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-black text-slate-800">Registrar Empleado</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCrear} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Nombre Completo</label>
                                <div className="relative">
                                    <UserCircle className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[var(--color-brand)] outline-none" placeholder="Ej: Juan Pérez" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Correo de Acceso (Email)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[var(--color-brand)] outline-none" placeholder="juan@carshop.com" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Contraseña Inicial</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                    <input type="text" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-[var(--color-brand)] outline-none" placeholder="Mínimo 6 caracteres" />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Nivel de Privilegios</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${rol === 'Vendedor' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="rol" value="Vendedor" checked={rol === 'Vendedor'} onChange={() => setRol('Vendedor')} className="hidden" />
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800">Vendedor</p>
                                            <p className="text-[10px] font-bold text-slate-500 leading-tight mt-0.5">Acceso solo a la PWA.</p>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${rol === 'Admin' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                        <input type="radio" name="rol" value="Admin" checked={rol === 'Admin'} onChange={() => setRol('Admin')} className="hidden" />
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800">Admin</p>
                                            <p className="text-[10px] font-bold text-slate-500 leading-tight mt-0.5">Control total del ERP.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-[var(--color-brand,#4f46e5)] text-white font-black rounded-xl hover:bg-[var(--color-brand-hover)] transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}