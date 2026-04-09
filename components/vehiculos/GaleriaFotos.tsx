'use client';

import { useState } from 'react';
import { Camera, Trash2, UploadCloud, Loader2 } from 'lucide-react';
import { subirFotoVehiculo, eliminarFotoVehiculo } from '@/actions/fotos'; // Action a crear

export default function GaleriaFotos({ fotos, idVehiculo }: { fotos: any[], idVehiculo: number }) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('idVehiculo', idVehiculo.toString());

        await subirFotoVehiculo(formData);
        setIsUploading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-600" /> Galería de Documentos e Imágenes
                </h3>
                <div>
                    <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer flex items-center gap-2 transition-colors">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                </div>
            </div>

            {fotos.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                    <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay imágenes cargadas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {fotos.map((foto) => (
                        <div key={foto.id_foto} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                            <img src={foto.url_foto} alt="Vehículo" className="w-full h-full object-cover" />
                            <button
                                onClick={() => eliminarFotoVehiculo(foto.id_foto, idVehiculo)}
                                className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}