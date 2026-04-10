'use client';

import { useState, useRef } from 'react';
import { useConfigStore } from '@/store/useConfigStore';
import { updateConfig } from '@/actions/config';
import { Settings, Save, Loader2, DollarSign, Image as ImageIcon, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConfiguracionPage() {
    const { dolarBlue, setDolar, tipoDolar, setTipoDolar, logo, setLogo, tema, setTema } = useConfigStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Estados Locales
    const [localDolar, setLocalDolar] = useState(dolarBlue.toString());
    const [localTipo, setLocalTipo] = useState(tipoDolar);
    const [localLogo, setLocalLogo] = useState<string | null>(logo);
    const [paletas, setPaletas] = useState<any[]>([]);
    const [selectedPaleta, setSelectedPaleta] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // EXTRACTOR DE COLOR DE LA IMAGEN
    const extractColor = (base64Img: string) => {
        const img = new Image();
        img.src = base64Img;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.width; canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let r = 0, g = 0, b = 0, count = 0;

            // Muestreo de píxeles (saltamos de a 4 para RGB y alfa)
            for (let i = 0; i < data.length; i += 16) {
                if (data[i + 3] > 128) { // Solo si no es transparente
                    r += data[i]; g += data[i + 1]; b += data[i + 2];
                    count++;
                }
            }

            if (count > 0) {
                r = Math.floor(r / count); g = Math.floor(g / count); b = Math.floor(b / count);
                generarTemas(r, g, b);
            }
        };
    };

    const generarTemas = (r: number, g: number, b: number) => {
        const toHex = (c: number) => c.toString(16).padStart(2, '0');
        const mainHex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

        // Oscurecer para el hover
        const darken = (c: number, amt: number) => Math.max(0, c - amt);
        const hoverHex = `#${toHex(darken(r, 40))}${toHex(darken(g, 40))}${toHex(darken(b, 40))}`;

        // Aclarar para el ring
        const lighten = (c: number, amt: number) => Math.min(255, c + amt);
        const ringHex = `#${toHex(lighten(r, 60))}${toHex(lighten(g, 60))}${toHex(lighten(b, 60))}`;

        const temasGenerados = [
            { nombre: 'Tema 1 (Original)', primary: mainHex, hover: hoverHex, ring: ringHex },
            { nombre: 'Tema 2 (Oscuro)', primary: hoverHex, hover: '#1e293b', ring: mainHex }, // Variante oscura
            { nombre: 'Tema 3 (Pastel)', primary: ringHex, hover: mainHex, ring: hoverHex }    // Variante clara
        ];

        setPaletas(temasGenerados);
        setSelectedPaleta(0);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setLocalLogo(base64);
            extractColor(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Guardamos Configuración Financiera
        await updateConfig('dolar_actual', localDolar);
        await updateConfig('tipo_dolar', localTipo);

        // Guardamos Logo y Tema
        if (localLogo) await updateConfig('empresa_logo', localLogo);
        if (paletas.length > 0) {
            const temaElegido = paletas[selectedPaleta];
            await updateConfig('empresa_tema', JSON.stringify(temaElegido));
            setTema(temaElegido);
        }

        setDolar(parseFloat(localDolar));
        setTipoDolar(localTipo);
        setLogo(localLogo);

        router.refresh();
        setIsSubmitting(false);
        alert('Configuración y Branding guardados.');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 pb-24">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
                <div className="p-3 bg-indigo-100 rounded-xl"><Settings className="w-8 h-8 text-indigo-700" /></div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configuración Global</h1>
                    <p className="text-slate-500 font-medium mt-1">Ajustes financieros y personalización de marca.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* 1. BRANDING: LOGO Y COLORES */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-slate-800">Identidad Visual</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Subir Logo */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider block">Logo de la Empresa</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all h-40 relative overflow-hidden"
                            >
                                {localLogo ? (
                                    <img src={localLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <>
                                        <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Click para subir logo</p>
                                    </>
                                )}
                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
                            </div>
                            <p className="text-xs text-slate-400 text-center">Recomendado: PNG con fondo transparente.</p>
                        </div>

                        {/* Selector de Temas */}
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider block">Temas Generados</label>
                            {paletas.length === 0 ? (
                                <div className="h-40 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center">
                                    <p className="text-sm text-slate-400 font-medium px-8 text-center">Subí un logo para que el sistema extraiga tus colores.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paletas.map((p, idx) => (
                                        <label key={idx} className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedPaleta === idx ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <input type="radio" name="tema" checked={selectedPaleta === idx} onChange={() => setSelectedPaleta(idx)} className="hidden" />
                                            <div className="flex gap-2">
                                                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: p.primary }}></div>
                                                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: p.hover }}></div>
                                            </div>
                                            <span className="font-bold text-sm text-slate-700">{p.nombre}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. MOTOR BIMONETARIO (El que ya tenías) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-emerald-900">Motor Bimonetario (Dólar)</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                        {/* Tus select e inputs de dólar quedan exactamente igual que antes */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Referencia DolarAPI</label>
                            <select value={localTipo} onChange={(e) => setLocalTipo(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium">
                                <option value="blue">Dólar Blue</option>
                                <option value="oficial">Dólar Oficial</option>
                                <option value="mep">Dólar MEP</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Fijar Dólar Manual</label>
                            <input type="number" step="0.01" value={localDolar} onChange={(e) => setLocalDolar(e.target.value)} className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-xl focus:ring-2 focus:ring-emerald-500 font-black text-emerald-800 text-lg" />
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 px-6 flex justify-end z-50">
                    <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-black flex items-center gap-2 shadow-lg transition-all disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Guardar Toda la Configuración
                    </button>
                </div>
            </form>
        </div>
    );
}