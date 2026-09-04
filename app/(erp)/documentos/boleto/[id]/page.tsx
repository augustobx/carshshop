import { obtenerDatosBoleto } from '@/actions/documentos';
import { notFound } from 'next/navigation';
import { Printer, Car, Shield, FileText } from 'lucide-react';

export default async function BoletoCompraVentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idVenta = parseInt(id);
  if (isNaN(idVenta)) notFound();

  let data;
  try {
    data = await obtenerDatosBoleto(idVenta);
  } catch {
    notFound();
  }

  const { venta, vehiculoPermuta, concesionaria } = data;
  const auto = venta.vehiculo;
  const comprador = venta.cliente;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4 sm:p-8 text-slate-900 font-sans">
      {/* Botón flotante para imprimir en pantalla */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Vista Previa de Boleto Oficial
        </span>
        <button
          onClick={() => {}}
          className="print:hidden bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          id="btn-print"
        >
          <Printer className="w-4 h-4" />
          Imprimir Documento
        </button>
      </div>

      {/* Hoja A4 para impresión formal */}
      <div className="max-w-4xl mx-auto bg-white border border-slate-300 print:border-none p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none space-y-6 text-sm leading-relaxed">
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
              {concesionaria.nombre}
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              CUIT: {concesionaria.cuit} | {concesionaria.direccion} | {concesionaria.ciudad}
            </p>
            {concesionaria.telefono && (
              <p className="text-xs text-slate-600 font-medium">Tel: {concesionaria.telefono}</p>
            )}
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded">
              Boleto Compra-Venta
            </span>
            <p className="text-sm font-black text-slate-900 mt-2 font-mono">
              {venta.numero_boleto || `BOL-${venta.id_venta}`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Fecha: {new Date(venta.fecha_venta).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* Partes Intervinientes */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-black text-slate-900 uppercase tracking-wider mb-1">
              Parte Vendedora (Concesionaria):
            </p>
            <p><strong className="text-slate-800">Razón Social:</strong> {concesionaria.nombre}</p>
            <p><strong className="text-slate-800">CUIT:</strong> {concesionaria.cuit}</p>
            <p><strong className="text-slate-800">Domicilio:</strong> {concesionaria.direccion}</p>
            {venta.vendedor && (
              <p><strong className="text-slate-800">Asesor Comercial:</strong> {venta.vendedor.name}</p>
            )}
          </div>
          <div>
            <p className="font-black text-slate-900 uppercase tracking-wider mb-1">
              Parte Compradora (Adquirente):
            </p>
            <p><strong className="text-slate-800">Nombre Completo:</strong> {comprador.nombre_completo}</p>
            <p><strong className="text-slate-800">DNI / CUIT:</strong> {comprador.dni || comprador.cuit_cuil || 'S/D'}</p>
            <p><strong className="text-slate-800">Teléfono:</strong> {comprador.telefono || 'S/D'}</p>
            <p><strong className="text-slate-800">Domicilio:</strong> {comprador.domicilio || 'S/D'}</p>
          </div>
        </div>

        {/* Cláusula Primera: Objeto / Vehículo Adquirido */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Cláusula Primera: Identificación del Vehículo Enajenado
          </h2>
          <p className="text-xs text-slate-700">
            La parte VENDEDORA vende a la parte COMPRADORA, y ésta adquiere, un vehículo automotor usado en el estado
            mecánico, de carrocería y conservación en que se encuentra, habiendo sido probado y examinado a entera satisfacción del comprador:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div><span className="text-slate-500">Marca:</span> <strong className="block">{auto.marca}</strong></div>
            <div><span className="text-slate-500">Modelo:</span> <strong className="block">{auto.modelo}</strong></div>
            <div><span className="text-slate-500">Año:</span> <strong className="block">{auto.anio || 'S/D'}</strong></div>
            <div><span className="text-slate-500">Dominio / Patente:</span> <strong className="block font-mono">{auto.patente || 'S/D'}</strong></div>
            <div><span className="text-slate-500">Motor N°:</span> <strong className="block font-mono">{auto.motor || 'S/D'}</strong></div>
            <div><span className="text-slate-500">Chasis / VIN:</span> <strong className="block font-mono">{auto.vin || 'S/D'}</strong></div>
            <div><span className="text-slate-500">Color:</span> <strong className="block">{auto.color || 'S/D'}</strong></div>
            <div><span className="text-slate-500">Kilometraje:</span> <strong className="block">{auto.km?.toLocaleString('es-AR') || 'S/D'} km</strong></div>
          </div>
        </div>

        {/* Cláusula Segunda: Precio y Forma de Pago */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            Cláusula Segunda: Precio Convenido y Liquidación
          </h2>
          <p className="text-xs text-slate-700">
            El precio total de la presente operación se fija en la suma de:{' '}
            <strong className="text-slate-950 text-sm">
              USD {Number(venta.precio_final_usd).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </strong>{' '}
            (Dólares Estadounidenses), el cual se cancela de la siguiente forma:
          </p>

          <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Forma de Pago Acordada:</span>
              <strong className="uppercase">{venta.forma_pago}</strong>
            </div>
            {Number(venta.anticipo_usd) > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Anticipo en Efectivo / Transferencia:</span>
                <strong>USD {Number(venta.anticipo_usd).toLocaleString('es-AR')}</strong>
              </div>
            )}
            {vehiculoPermuta && (
              <div className="flex justify-between py-1 border-b border-slate-200 text-blue-900 bg-blue-50/60 px-2 rounded">
                <span>
                  Vehículo Usado en Permuta ({vehiculoPermuta.marca} {vehiculoPermuta.modelo} {vehiculoPermuta.patente}):
                </span>
                <strong>USD {Number(venta.valor_toma_permuta_usd).toLocaleString('es-AR')}</strong>
              </div>
            )}
            {venta.cuotas && venta.cuotas.length > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Saldo Financiado ({venta.cuotas.length} Cuotas Mensuales):</span>
                <strong>USD {Number(venta.saldo_financiado_usd).toLocaleString('es-AR')}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Plan de Cuotas si aplica */}
        {venta.cuotas && venta.cuotas.length > 0 && (
          <div className="space-y-1 text-xs">
            <p className="font-bold text-slate-800">Detalle del Plan de Pagos Financiado:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-[11px]">
              {venta.cuotas.map((c) => (
                <div key={c.id_cuota} className="border border-slate-200 p-1.5 rounded bg-slate-50">
                  <span className="text-slate-500">Cuota #{c.numero_cuota}:</span>
                  <strong className="block text-slate-900">USD {Number(c.monto_usd).toLocaleString('es-AR')}</strong>
                  <span className="text-[10px] text-slate-500">
                    Vto: {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cláusulas Legales Automotor */}
        <div className="space-y-2 text-[11px] text-slate-600 text-justify">
          <p>
            <strong>Cláusula Tercera (Transferencia Registral):</strong> La parte COMPRADORA se obliga expresamente a
            iniciar la transferencia registral de dominio a su exclusivo costo en un plazo no mayor a 10 (diez) días
            hábiles contados desde la firma del presente.
          </p>
          <p>
            <strong>Cláusula Cuarta (Responsabilidad Civil):</strong> A partir de este acto y con la entrega de la posesión
            efectiva del rodado, la parte COMPRADORA asume toda responsabilidad civil, contravencional y penal por el uso,
            circulación y tenencia del vehículo, deslindando expresamente a la parte VENDEDORA de todo reclamo derivado de
            siniestros, multas o infracciones posteriores.
          </p>
        </div>

        {/* Firmas */}
        <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
          <div className="border-t border-slate-900 pt-2">
            <p className="font-black uppercase text-slate-900">{concesionaria.nombre}</p>
            <p className="text-slate-500">Parte Vendedora</p>
          </div>
          <div className="border-t border-slate-900 pt-2">
            <p className="font-black uppercase text-slate-900">{comprador.nombre_completo}</p>
            <p className="text-slate-500">Parte Compradora - DNI: {comprador.dni || '..........'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
