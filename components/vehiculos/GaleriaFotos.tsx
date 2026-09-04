'use client';

import { useRef, useState } from 'react';
import { Camera, Trash2, UploadCloud, Loader2, ImagePlus } from 'lucide-react';
import { subirFotoVehiculo, eliminarFotoVehiculo } from '@/actions/fotos';

export default function GaleriaFotos({ fotos, idVehiculo }: { fotos: any[]; idVehiculo: number }) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('idVehiculo', idVehiculo.toString());
        const res = await subirFotoVehiculo(formData);
        if (!res.success) throw new Error(res.error || `No se pudo subir ${file.name}.`);
      }
    } catch (error: any) {
      alert(error?.message || 'No se pudieron subir las imágenes.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (idFoto: number) => {
    if (!confirm('¿Eliminar esta imagen del vehículo?')) return;
    setDeletingId(idFoto);
    const res = await eliminarFotoVehiculo(idFoto, idVehiculo);
    setDeletingId(null);
    if (!res.success) alert(res.error || 'No se pudo eliminar la imagen.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="flex items-center gap-2 text-lg font-black text-slate-800"><Camera className="h-5 w-5 text-indigo-600" /> Fotos de la unidad</h3><p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP o AVIF · hasta 10 MB por imagen. Se almacenan en Cloudflare.</p></div>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-indigo-700">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{isUploading ? 'Subiendo...' : 'Agregar fotos'}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
        </label>
      </div>

      {fotos.length === 0 ? <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-14 text-slate-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"><ImagePlus className="mb-3 h-12 w-12" /><span className="font-black text-slate-600">Agregar fotos del vehículo</span><span className="mt-1 text-xs">La primera imagen se usa como portada en stock y PWA.</span></button> : <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{fotos.map((foto, index) => <div key={foto.id_foto} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"><img src={foto.url_foto} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />{index === 0 && <span className="absolute bottom-2 left-2 rounded-lg bg-slate-950/80 px-2 py-1 text-[9px] font-black uppercase text-white backdrop-blur">Portada</span>}<button onClick={() => remove(foto.id_foto)} disabled={deletingId === foto.id_foto} className="absolute right-2 top-2 rounded-lg bg-red-600/90 p-2 text-white opacity-100 transition-opacity hover:bg-red-600 md:opacity-0 md:group-hover:opacity-100">{deletingId === foto.id_foto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button></div>)}</div>}
    </div>
  );
}
