import { obtenerFichaParabrisas } from '@/actions/documentos';
import { notFound } from 'next/navigation';
import { Printer, Car, Check, Phone, MessageSquare } from 'lucide-react';

export default async function FichaParabrisasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idVehiculo = parseInt(id);
  if (isNaN(idVehiculo)) notFound();

  let data;
  try {
    data = await obtenerFichaParabrisas(idVehiculo);
  } catch {
    notFound();
  }

  const { vehiculo, concesionaria } = data;
  const precioUsd = Number(vehiculo.precio_venta_usd || 0);
  const precioArs = Number(vehiculo.precio_venta_ars || precioUsd * concesionaria.dolar);

  return (
    <div className="min-h-screen bg-slate-900 print:bg-white p-4 sm:p-8 text-slate-900 font-sans">
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold text-slate-400">Cartel de Exhibición para Parabrisas</span>
        <button
          onClick={() => {}}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Imprimir Cartel
        </button>
      </div>

      <div className="max-w-3xl mx-auto bg-white border-4 border-slate-900 print:border-4 print:border-black p-8 sm:p-12 rounded-3xl shadow-2xl print:shadow-none space-y-8">
        {/* Cabecera de Concesionaria */}
        <div className="text-center border-b-4 border-slate-900 pb-6">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">Unidad Certificada</p>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-slate-950 mt-1">
            {vehiculo.marca} {vehiculo.modelo}
          </h1>
          <p className="text-lg font-bold text-slate-600 mt-1">
            {vehiculo.version || ''} • Año {vehiculo.anio}
          </p>
        </div>

        {/* Bloque de Precio Gigante */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 text-center space-y-2 shadow-inner">
          <p className="text-xs font-black uppercase tracking-widest text-blue-400">Precio de Venta</p>
          <p className="text-5xl sm:text-6xl font-black tracking-tight text-emerald-400">
            USD {precioUsd.toLocaleString('es-AR')}
          </p>
          <p className="text-base sm:text-lg font-bold text-slate-300">
            $ {precioArs.toLocaleString('es-AR')} ARS
          </p>
        </div>

        {/* Ficha Técnica Rápida */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-y-2 border-slate-200 py-6">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Kilometraje</span>
            <strong className="text-lg text-slate-950 font-black block mt-0.5">
              {vehiculo.km?.toLocaleString('es-AR') || '0'} km
            </strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Transmisión</span>
            <strong className="text-lg text-slate-950 font-black block mt-0.5">
              {vehiculo.transmision || 'Manual'}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Combustible</span>
            <strong className="text-lg text-slate-950 font-black block mt-0.5">
              {vehiculo.combustible || 'Nafta'}
            </strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Motor</span>
            <strong className="text-lg text-slate-950 font-black block mt-0.5">
              {vehiculo.motor || '1.6'}
            </strong>
          </div>
        </div>

        {/* Beneficios de la Concesionaria */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Documentación 100% al día</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
            <Check className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Aceptamos tu usado en permuta</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-purple-50 text-purple-800 rounded-lg border border-purple-200">
            <Check className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Financiación bancaria y propia</span>
          </div>
        </div>

        {/* Pie de Contacto */}
        <div className="border-t-4 border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-black text-xl text-slate-950 uppercase">{concesionaria.nombre}</p>
            <p className="text-xs text-slate-500">Consulte a nuestros asesores comerciales en salón</p>
          </div>
          {concesionaria.telefono && (
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-sm font-black text-slate-900 border border-slate-300">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>{concesionaria.telefono}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
