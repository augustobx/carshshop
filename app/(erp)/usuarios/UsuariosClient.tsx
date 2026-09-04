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
  const [rol, setRol] = useState<'OWNER' | 'MANAGER' | 'VENDEDOR' | 'ADMINISTRATIVO' | 'TALLER'>('VENDEDOR');

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await crearUsuario({
      nombre,
      email,
      password_plana: password,
      rol,
    });

    if (res.success) {
      setIsModalOpen(false);
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('VENDEDOR');
      window.location.reload();
    } else {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  const handleEliminar = async (id: string, nombreUser: string) => {
    if (!confirm(`¿Estás seguro que deseas remover el acceso de ${nombreUser}?`)) return;

    const res = await eliminarUsuario(id);
    if (!res.success) alert(res.error);
    else window.location.reload();
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Equipo y Roles de Concesionaria</h1>
            <p className="text-slate-500 font-medium mt-1">Gestioná los colaboradores y sus privilegios operativos.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-brand,#2563eb)] hover:bg-[var(--color-brand-hover,#1d4ed8)] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Colaborador
        </button>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="py-4 px-6">Colaborador</th>
              <th className="py-4 px-6">Email de Acceso</th>
              <th className="py-4 px-6">Rol Asignado</th>
              <th className="py-4 px-6">Sucursal</th>
              <th className="py-4 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {usuarios.map((u) => (
              <tr key={u.id_usuario} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-900">{u.nombre}</td>
                <td className="py-4 px-6 text-slate-600">{u.email}</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                    {u.rol}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-600">{u.sucursal}</td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => handleEliminar(u.id_usuario, u.nombre)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Remover acceso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL NUEVO USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">Alta de Colaborador</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrear} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Nombre Completo</label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Ej: Laura Martínez"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Email de Acceso</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="laura@concesionaria.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Contraseña Inicial</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Rol y Nivel de Acceso</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  <option value="VENDEDOR">Vendedor / Asesor Comercial</option>
                  <option value="MANAGER">Gerente de Ventas / Sucursal</option>
                  <option value="OWNER">Director / Dueño (Control Total)</option>
                  <option value="ADMINISTRATIVO">Administrativo / Gestoría y Caja</option>
                  <option value="TALLER">Taller / Preparación Mecánica</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[var(--color-brand,#2563eb)] text-white font-black rounded-xl hover:bg-blue-600 transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}