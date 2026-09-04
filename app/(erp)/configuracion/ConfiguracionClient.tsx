'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, DollarSign, Image as ImageIcon, Loader2, Palette, Save, Settings, WalletCards } from 'lucide-react';
import { guardarConfiguracion } from '@/actions/config';
import { useConfigStore } from '@/store/useConfigStore';

export default function ConfiguracionClient({ initial }: { initial: any }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { setDolar, setTipoDolar, setLogo, setTema } = useConfigStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    appName: initial.appName || initial.tenantName || 'OnlyCars',
    dolarActual: String(initial.dolarActual || 1400),
    tipoDolar: initial.tipoDolar || 'blue',
    tnaFinanciacion: String(initial.tnaFinanciacion ?? 48),
    comisionVentaDefecto: String(initial.comisionVentaDefecto ?? 3),
    logoUrl: initial.logoUrl || '',
    primaryColor: initial.primaryColor || '#2563eb',
    secondaryColor: initial.secondaryColor || '#0f172a',
    telefonoContacto: initial.telefonoContacto || '',
    emailContacto: initial.emailContacto || '',
    whatsappLead: initial.whatsappLead || '',
    cuit: initial.cuit || '',
    razonSocial: initial.razonSocial || '',
    direccion: initial.direccion || '',
    pieImpresion: initial.pieImpresion || '',
  });

  const input = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const label = 'block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5';

  const handleLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('El archivo seleccionado no es una imagen.');
    if (file.size > 1_000_000) return setError('El logo debe pesar menos de 1 MB.');
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, logoUrl: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await guardarConfiguracion({
      ...form,
      dolarActual: Number(form.dolarActual),
      tnaFinanciacion: Number(form.tnaFinanciacion),
      comisionVentaDefecto: Number(form.comisionVentaDefecto),
      logoUrl: form.logoUrl || null,
    });
    setSaving(false);
    if (!res.success) return setError(res.error || 'No se pudo guardar.');
    setDolar(Number(form.dolarActual));
    setTipoDolar(form.tipoDolar);
    setLogo(form.logoUrl || null);
    setTema({ primary: form.primaryColor, secondary: form.secondaryColor });
    router.refresh();
  };

  return (
    <form onSubmit={save} className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 pb-28">
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Gestión</p><h1 className="text-3xl font-black text-slate-900 mt-1">Configuración de concesionaria</h1><p className="text-sm text-slate-500 mt-1">Datos fiscales, moneda, financiación, contacto e identidad visual en un único lugar.</p></div>
      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <header className="p-5 bg-slate-50 border-b border-slate-200 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /><div><h2 className="font-black text-slate-900">Empresa y documentación</h2><p className="text-xs text-slate-500">Estos datos se usan en boletos, recibos y fichas.</p></div></header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={label}>Nombre comercial</label><input className={input} value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} /></div>
          <div><label className={label}>Razón social</label><input className={input} value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} /></div>
          <div><label className={label}>CUIT</label><input className={input} value={form.cuit} onChange={(e) => setForm({ ...form, cuit: e.target.value })} placeholder="30-XXXXXXXX-X" /></div>
          <div><label className={label}>Dirección</label><input className={input} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></div>
          <div><label className={label}>Teléfono comercial</label><input className={input} value={form.telefonoContacto} onChange={(e) => setForm({ ...form, telefonoContacto: e.target.value })} /></div>
          <div><label className={label}>Email comercial</label><input type="email" className={input} value={form.emailContacto} onChange={(e) => setForm({ ...form, emailContacto: e.target.value })} /></div>
          <div className="md:col-span-2"><label className={label}>WhatsApp para leads</label><input className={input} value={form.whatsappLead} onChange={(e) => setForm({ ...form, whatsappLead: e.target.value })} placeholder="54911..." /></div>
          <div className="md:col-span-2"><label className={label}>Pie de impresión</label><textarea className={`${input} min-h-20`} value={form.pieImpresion} onChange={(e) => setForm({ ...form, pieImpresion: e.target.value })} placeholder="Leyenda opcional para documentación comercial" /></div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <header className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600" /><div><h2 className="font-black text-slate-900">Moneda y financiación</h2><p className="text-xs text-slate-500">ARS es moneda principal de visualización; USD queda como referencia contable.</p></div></header>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className={label}>Tipo de dólar</label><select className={input} value={form.tipoDolar} onChange={(e) => setForm({ ...form, tipoDolar: e.target.value })}><option value="blue">Blue</option><option value="oficial">Oficial</option><option value="mep">MEP</option></select></div>
          <div><label className={label}>Cotización ARS / USD</label><input type="number" min="1" step="0.01" className={input} value={form.dolarActual} onChange={(e) => setForm({ ...form, dolarActual: e.target.value })} /></div>
          <div><label className={label}>TNA financiación %</label><input type="number" min="0" step="0.01" className={input} value={form.tnaFinanciacion} onChange={(e) => setForm({ ...form, tnaFinanciacion: e.target.value })} /></div>
          <div><label className={label}>Comisión vendedor %</label><input type="number" min="0" step="0.01" className={input} value={form.comisionVentaDefecto} onChange={(e) => setForm({ ...form, comisionVentaDefecto: e.target.value })} /></div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <header className="p-5 bg-slate-50 border-b border-slate-200 flex items-center gap-2"><Palette className="w-5 h-5 text-violet-600" /><div><h2 className="font-black text-slate-900">Identidad visual</h2><p className="text-xs text-slate-500">Logo y colores aplicados al ERP del tenant.</p></div></header>
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div><label className={label}>Logo</label><button type="button" onClick={() => fileRef.current?.click()} className="w-full min-h-40 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center bg-slate-50 hover:border-blue-400 overflow-hidden">{form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="max-h-32 max-w-[80%] object-contain" /> : <div className="text-center text-slate-400"><ImageIcon className="w-9 h-9 mx-auto mb-2" /><p className="text-sm font-bold">Seleccionar imagen</p><p className="text-xs">PNG/JPG, máximo 1 MB</p></div>}</button><input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleLogo(e.target.files?.[0])} />{form.logoUrl && <button type="button" onClick={() => setForm({ ...form, logoUrl: '' })} className="text-xs font-bold text-red-600 mt-2">Quitar logo</button>}</div>
          <div className="space-y-4"><div><label className={label}>Color principal</label><div className="flex gap-2"><input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-14 h-11 border rounded-xl p-1" /><input className={input} value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div></div><div><label className={label}>Color secundario</label><div className="flex gap-2"><input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-14 h-11 border rounded-xl p-1" /><input className={input} value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></div></div><div className="rounded-2xl p-5 text-white" style={{ backgroundColor: form.primaryColor }}><p className="text-xs uppercase font-black opacity-70">Vista previa</p><p className="text-xl font-black mt-1">{form.appName || 'Concesionaria'}</p><p className="text-sm opacity-80 mt-1">OnlyCars Dealer Management System</p></div></div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-4 flex justify-end z-50"><button type="submit" disabled={saving} className="px-7 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black flex items-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Guardar configuración</button></div>
    </form>
  );
}
