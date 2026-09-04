import { AlertTriangle, Car, Mail, ShieldCheck } from 'lucide-react';

export default function SuspendidoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden">
        <div className="p-7 md:p-9">
          <div className="flex items-center justify-between gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
            <div className="flex items-center gap-2 text-slate-500"><Car className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-wider">OnlyCars</span></div>
          </div>

          <p className="mt-7 text-[11px] uppercase tracking-[0.18em] font-black text-red-400">Membresía vencida</p>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-2">Servicio suspendido</h1>
          <p className="text-slate-400 leading-7 mt-4">
            El acceso a esta concesionaria está temporalmente suspendido. La información y la configuración del sistema se mantienen preservadas y el servicio puede reactivarse sin volver a provisionar la cuenta.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex gap-3"><ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /><div><p className="font-black text-white text-sm">¿Cómo regularizar el servicio?</p><p className="text-sm text-slate-500 mt-1 leading-6">Contactá a NanoLabs para verificar la membresía o registrar la renovación. Una vez acreditado el período, el acceso se restablece automáticamente.</p></div></div>
          </div>

          <a href="mailto:contacto@nanolabs.com.ar" className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-sm font-black text-white"><Mail className="w-4 h-4" /> Contactar a NanoLabs</a>
        </div>
        <div className="border-t border-slate-800 bg-slate-950/40 px-7 py-4 text-center"><p className="text-[10px] uppercase tracking-[0.16em] text-slate-600 font-black">NanoLabs · Plataforma SaaS</p></div>
      </div>
    </main>
  );
}
