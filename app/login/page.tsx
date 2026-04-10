'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CarFront, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError('Credenciales incorrectas. Verificá tu email y contraseña.');
            setLoading(false);
        } else {
            // El middleware se encargará de mandar a los vendedores a /pwa y a los admins a /
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Luces de fondo estilo marca */}
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-[var(--color-brand,#4f46e5)] rounded-full blur-[150px] opacity-30"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-600 rounded-full blur-[150px] opacity-20"></div>

            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-[var(--color-brand,#4f46e5)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--color-brand)]/30">
                        <CarFront className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bienvenido</h1>
                    <p className="text-slate-500 font-medium mt-1">Ingresá tus credenciales para continuar.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center mb-6 border border-red-100 animate-in shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                type="email" required
                                value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[var(--color-brand,#4f46e5)] outline-none transition-all"
                                placeholder="usuario@carshop.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                            <input
                                type="password" required
                                value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-[var(--color-brand,#4f46e5)] outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-[var(--color-brand,#4f46e5)] hover:bg-[var(--color-brand-hover,#4338ca)] text-white py-4 rounded-xl font-black flex justify-center items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Ingresar al Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
}