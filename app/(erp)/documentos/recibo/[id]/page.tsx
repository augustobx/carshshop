import { obtenerDatosReciboSenia } from '@/actions/documentos';
import { notFound } from 'next/navigation';
import { FileCheck } from 'lucide-react';
import PrintButton from '@/components/common/PrintButton';

const money = (value: number) => Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function ReciboSeniaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idSenia = Number(id);
  if (!Number.isInteger(idSenia)) notFound();

  let data;
  try { data = await obtenerDatosReciboSenia(idSenia); } catch { notFound(); }

  const { senia, concesionaria } = data;
  const auto = senia.vehiculo;
  const cliente = senia.cliente;
  const ars = Number(senia.monto_ars || 0);
  const usd = Number(senia.monto_usd || 0);
  const rate = Number(senia.cotizacion || 0);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4 sm:p-8 text-slate-900 font-sans">
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><FileCheck className="w-4 h-4 text-emerald-600" />Comprobante de reserva</span>
        <PrintButton label="Imprimir recibo" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2" />
      </div>

      <div className="max-w-2xl mx-auto bg-white border border-slate-300 print:border-none p-8 sm:p-10 rounded-2xl shadow-xl print:shadow-none space-y-6 text-sm leading-relaxed">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div><h1 className="text-xl font-black uppercase tracking-tight">{concesionaria.nombre}</h1><p className="text-xs text-slate-600 mt-0.5">CUIT: {concesionaria.cuit} · {concesionaria.direccion}</p></div>
          <div className="text-right"><span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded">Recibo de Reserva</span><p className="text-xs font-mono font-bold mt-2">{senia.recibo_nro || `RES-${senia.id_senia}`}</p><p className="text-[11px] text-slate-500">{new Date(senia.fecha_senia).toLocaleDateString('es-AR')}</p></div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border text-xs space-y-1"><p><strong>Recibimos de:</strong> {cliente.nombre_completo}</p><p><strong>DNI / CUIT:</strong> {cliente.dni || cliente.cuit_cuil || 'S/D'}</p><p><strong>Teléfono:</strong> {cliente.telefono || 'S/D'}</p></div>

        <div className="space-y-2"><p className="text-xs text-slate-700">En concepto de <strong>SEÑA Y RESERVA DE UNIDAD</strong>, por el vehículo:</p><div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border text-xs"><div><span className="text-slate-500">Marca y modelo</span><strong className="block">{auto.marca} {auto.modelo}</strong></div><div><span className="text-slate-500">Año</span><strong className="block">{auto.anio || 'S/D'}</strong></div><div><span className="text-slate-500">Patente</span><strong className="block font-mono">{auto.patente || 'S/D'}</strong></div><div><span className="text-slate-500">Color</span><strong className="block">{auto.color || 'S/D'}</strong></div></div></div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Monto recibido</p><p className="text-3xl font-black text-emerald-950 mt-1">$ {money(ars)} ARS</p><p className="text-sm font-bold text-emerald-800">USD {money(usd)} · TC $ {money(rate)}</p></div>

        {senia.fecha_limite && <p className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200"><strong>Plazo de reserva:</strong> vigente hasta <strong>{new Date(senia.fecha_limite).toLocaleDateString('es-AR')}</strong>, según las condiciones comerciales acordadas.</p>}
        {concesionaria.pieImpresion && <p className="text-[10px] text-slate-500 border-t pt-3">{concesionaria.pieImpresion}</p>}

        <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs"><div className="border-t border-slate-900 pt-2"><p className="font-black uppercase">{concesionaria.nombre}</p><p className="text-slate-500">Firma y sello</p></div><div className="border-t border-slate-900 pt-2"><p className="font-black uppercase">{cliente.nombre_completo}</p><p className="text-slate-500">Firma del cliente</p></div></div>
      </div>
    </div>
  );
}
