import { obtenerDatosReciboSenia } from '@/actions/documentos';
import { notFound } from 'next/navigation';
import { Printer, FileCheck } from 'lucide-react';

export default async function ReciboSeniaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idSenia = parseInt(id);
  if (isNaN(idSenia)) notFound();

  let data;
  try {
    data = await obtenerDatosReciboSenia(idSenia);
  } catch {
    notFound();
  }

  const { senia, concesionaria } = data;
  const auto = senia.vehiculo;
  const cliente = senia.cliente;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4 sm:p-8 text-slate-900 font-sans">
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          Comprobante Oficial de Reserva
        </span>
        <button
          onClick={() => {}}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Imprimir Recibo
        </button>
      </div>

      <div className="max-w-2xl mx-auto bg-white border border-slate-300 print:border-none p-8 sm:p-10 rounded-2xl shadow-xl print:shadow-none space-y-6 text-sm leading-relaxed">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
              {concesionaria.nombre}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              CUIT: {concesionaria.cuit} | {concesionaria.direccion}
            </p>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded">
              Recibo de Reserva
            </span>
            <p className="text-xs font-mono font-bold text-slate-900 mt-2">
              {senia.recibo_nro || `RES-${senia.id_senia}`}
            </p>
            <p className="text-[11px] text-slate-500">
              {new Date(senia.fecha_senia).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-900">
            Recibimos de:{' '}
            <span className="font-normal text-slate-800">{cliente.nombre_completo}</span>
          </p>
          <p className="font-bold text-slate-900">
            DNI / CUIT:{' '}
            <span className="font-normal text-slate-800">{cliente.dni || cliente.cuit_cuil || 'S/D'}</span>
          </p>
          <p className="font-bold text-slate-900">
            Teléfono:{' '}
            <span className="font-normal text-slate-800">{cliente.telefono || 'S/D'}</span>
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-700">
            En concepto de <strong className="text-slate-900">SEÑA Y RESERVA DE UNIDAD AUTOMOTOR</strong>, por el
            vehículo que se individualiza a continuación:
          </p>

          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div><span className="text-slate-500">Marca y Modelo:</span> <strong>{auto.marca} {auto.modelo}</strong></div>
            <div><span className="text-slate-500">Año:</span> <strong>{auto.anio || 'S/D'}</strong></div>
            <div><span className="text-slate-500">Dominio / Patente:</span> <strong className="font-mono">{auto.patente || 'S/D'}</strong></div>
            <div><span className="text-slate-500">Color:</span> <strong>{auto.color || 'S/D'}</strong></div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Monto Recibido</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Cotización referencial: $ {Number(senia.cotizacion).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-emerald-950">
              USD {Number(senia.monto_usd).toLocaleString('es-AR')}
            </p>
            <p className="text-xs font-bold text-emerald-800">
              ($ {Number(senia.monto_ars).toLocaleString('es-AR')})
            </p>
          </div>
        </div>

        {senia.fecha_limite && (
          <p className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <strong>Plazo de Reserva:</strong> La presente reserva tiene vigencia improrrogable hasta el día{' '}
            <strong>{new Date(senia.fecha_limite).toLocaleDateString('es-AR')}</strong> para la formalización del boleto
            de compra-venta o integración del saldo.
          </p>
        )}

        <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="border-t border-slate-900 pt-2">
            <p className="font-black uppercase text-slate-900">{concesionaria.nombre}</p>
            <p className="text-slate-500">Firma y Sello Concesionaria</p>
          </div>
          <div className="border-t border-slate-900 pt-2">
            <p className="font-black uppercase text-slate-900">{cliente.nombre_completo}</p>
            <p className="text-slate-500">Firma del Adquirente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
