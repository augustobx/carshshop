import { obtenerFichaParabrisas } from '@/actions/documentos';
import { notFound } from 'next/navigation';
import { Check, Phone } from 'lucide-react';
import PrintButton from '@/components/common/PrintButton';

export default async function FichaParabrisasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idVehiculo = Number(id);
  if (!Number.isInteger(idVehiculo)) notFound();

  let data;
  try { data = await obtenerFichaParabrisas(idVehiculo); } catch { notFound(); }

  const { vehiculo, concesionaria } = data;
  const precioUsd = Number(vehiculo.precio_venta_usd || 0);
  const precioArs = Number(vehiculo.precio_venta_ars || (precioUsd * concesionaria.dolar));

  return (
    <div className="min-h-screen bg-slate-900 print:bg-white p-4 sm:p-8 text-slate-900 font-sans">
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden"><span className="text-sm font-bold text-slate-400">Ficha de salón / parabrisas</span><PrintButton label="Imprimir cartel" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2" /></div>

      <div className="max-w-3xl mx-auto bg-white border-4 border-slate-900 print:border-black p-8 sm:p-12 rounded-3xl shadow-2xl print:shadow-none space-y-8">
        <div className="text-center border-b-4 border-slate-900 pb-6">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">{concesionaria.nombre}</p>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight mt-1">{vehiculo.marca} {vehiculo.modelo}</h1>
          <p className="text-lg font-bold text-slate-600 mt-1">{vehiculo.version || ''} · Año {vehiculo.anio || 'S/D'}</p>
        </div>

        <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 text-center space-y-1 shadow-inner">
          <p className="text-xs font-black uppercase tracking-widest text-blue-400">Precio de venta</p>
          <p className="text-5xl sm:text-6xl font-black tracking-tight text-emerald-400">$ {precioArs.toLocaleString('es-AR')} ARS</p>
          <p className="text-base sm:text-lg font-bold text-slate-300">USD {precioUsd.toLocaleString('es-AR')} · TC $ {Number(concesionaria.dolar).toLocaleString('es-AR')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-y-2 border-slate-200 py-6">
          <Info label="Kilometraje" value={`${Number(vehiculo.km || 0).toLocaleString('es-AR')} km`} />
          <Info label="Transmisión" value={vehiculo.transmision || 'S/D'} />
          <Info label="Combustible" value={vehiculo.combustible || 'S/D'} />
          <Info label={vehiculo.tipo_vehiculo === 'Moto' ? 'Cilindrada' : 'Motor'} value={(vehiculo.tipo_vehiculo === 'Moto' ? vehiculo.cilindrada : vehiculo.motor) || 'S/D'} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-700">
          <Benefit text="Consultá documentación disponible" />
          <Benefit text="Consultá toma de usado / permuta" />
          <Benefit text="Consultá opciones de financiación" />
        </div>

        <div className="border-t-4 border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div><p className="font-black text-xl uppercase">{concesionaria.nombre}</p><p className="text-xs text-slate-500">Solicitá asesoramiento comercial</p></div>
          {concesionaria.telefono && <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-sm font-black border"><Phone className="w-4 h-4 text-blue-600" /><span>{concesionaria.telefono}</span></div>}
        </div>
        {concesionaria.pieImpresion && <p className="text-[10px] text-slate-500 text-center">{concesionaria.pieImpresion}</p>}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="p-3 bg-slate-50 rounded-xl"><span className="text-xs text-slate-500 font-bold uppercase block">{label}</span><strong className="text-lg font-black block mt-0.5">{value}</strong></div>;
}

function Benefit({ text }: { text: string }) {
  return <div className="flex items-center gap-2 p-2.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-200"><Check className="w-4 h-4 text-blue-600 shrink-0" /><span>{text}</span></div>;
}
