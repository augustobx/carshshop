'use client';

import { useState, useEffect } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { CarFront } from 'lucide-react';

export default function PWASplash({
    children,
    logo,
    initialDolar
}: {
    children: React.ReactNode;
    logo: string | null;
    initialDolar: number;
}) {
    const [showSplash, setShowSplash] = useState(true);
    const { setLogo, setDolar } = useConfigStore();

    useEffect(() => {
        // Hidratamos el estado global con los datos que vienen del servidor
        if (logo) setLogo(logo);
        if (initialDolar) setDolar(initialDolar);

        // El splash dura 1.5 segundos y luego desaparece suavemente
        const timer = setTimeout(() => setShowSplash(false), 1500);
        return () => clearTimeout(timer);
    }, [logo, initialDolar, setLogo, setDolar]);

    return (
        <>
            {/* PANTALLA DE CARGA (SPLASH SCREEN) */}
            <div className={`absolute inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center transition-opacity duration-500 ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Luz de fondo con el color de tu marca */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand,#4f46e5)] rounded-full blur-[120px] opacity-30 -translate-y-1/2 translate-x-1/2"></div>

                <div className="w-40 h-40 flex items-center justify-center mb-6 animate-pulse z-10">
                    {logo ? (
                        <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                    ) : (
                        <div className="w-24 h-24 bg-[var(--color-brand,#4f46e5)] rounded-3xl flex items-center justify-center shadow-lg shadow-[var(--color-brand,#4f46e5)]/30">
                            <CarFront className="w-12 h-12 text-white" />
                        </div>
                    )}
                </div>

                {!logo && (
                    <h1 className="text-3xl font-black text-white tracking-tighter z-10">
                        CarShop<span className="text-[var(--color-brand,#4f46e5)]">ERP</span>
                    </h1>
                )}

                {/* Puntitos de carga animados */}
                <div className="mt-8 flex gap-2 z-10">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-brand,#4f46e5)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--color-brand,#4f46e5)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--color-brand,#4f46e5)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>

            {/* CONTENIDO REAL DE LA PWA (Atrás del Splash) */}
            {children}
        </>
    );
}