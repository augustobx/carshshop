import { obtenerDatosBoleto } from '@/actions/documentos';
import { notFound } from 'next/navigation';
import { FileText } from 'lucide-react';
import PrintButton from '@/components/common/PrintButton';

const money = (value: number) => Number(value || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function BoletoCompraVentaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idVenta = Number(id);
  if (!Number.isInteger(idVenta)) notFound();

  let data;
  try { data = await obtenerDatosBoleto(idVenta); } catch { notFound(); }

  const { venta, vehiculoPermuta, concesionaria } = data;
  const auto = venta.vehiculo;
  const comprador = venta.cliente;
  const rate = Number(venta.cotizacion_dolar_venta || 0);
  const totalUsd = Number(venta.precio_final_usd || 0);
  const totalArs = totalUsd * rate;
  const anticipoUsd = Number(venta.anticipo_usd || 0);
  const saldoUsd = Number(venta.saldo_financiado_usd || 0);
  const permutaUsd = Number(venta.valor_toma_permuta_usd || 0);

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-4 sm:p-8 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />Vista previa de boleto</span>
        <PrintButton label="Imprimir documento" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2" />
      </div>

      <div className="max-w-4xl mx-auto bg-white border border-slate-300 print:border-none p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none space-y-6 text-sm leading-relaxed">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">{concesionaria.nombre}</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">CUIT: {concesionaria.cuit} · {concesionaria.direccion}{concesionaria.ciudad ? ` · ${concesionaria.ciudad}` : ''}</p>
            {concesionaria.telefono && <p className="text-xs text-slate-600 font-medium">Tel: {concesionaria.telefono}</p>}
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded">Boleto Compra-Venta</span>
            <p className="text-sm font-black text-slate-900 mt-2 font-mono">{venta.numero_boleto || `BOL-${venta.id_venta}`}</p>
            <p className="text-xs text-slate-500 mt-0.5">Fecha: {new Date(venta.fecha_venta).toLocaleDateString('es-AR')}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div><p className="font-black text-slate-900 uppercase tracking-wider mb-1">Parte vendedora</p><p><strong>Razón social:</strong> {concesionaria.nombre}</p><p><strong>CUIT:</strong> {concesionaria.cuit}</p><p><strong>Domicilio:</strong> {concesionaria.direccion}</p>{venta.vendedor && <p><strong>Asesor:</strong> {venta.vendedor.name}</p>}</div>
          <div><p className="font-black text-slate-900 uppercase tracking-wider mb-1">Parte compradora</p><p><strong>Nombre:</strong> {comprador.nombre_completo}</p><p><strong>DNI / CUIT:</strong> {comprador.dni || comprador.cuit_cuil || 'S/D'}</p><p><strong>Teléfono:</strong> {comprador.telefono || 'S/D'}</p><p><strong>Domicilio:</strong> {comprador.domicilio || 'S/D'}</p></div>
        </div>

        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider border-b border-slate-200 pb-1">Cláusula Primera: Identificación del Vehículo</h2>
          <p className="text-xs text-slate-700">La parte VENDEDORA vende a la parte COMPRADORA, y ésta adquiere, la unidad individualizada a continuación:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border text-xs">
            <div><span className="text-slate-500">Marca</span><strong className="block">{auto.marca}</strong></div><div><span className="text-slate-500">Modelo</span><strong className="block">{auto.modelo}</strong></div><div><span className="text-slate-500">Año</span><strong className="block">{auto.anio || 'S/D'}</strong></div><div><span className="text-slate-500">Patente</span><strong className="block font-mono">{auto.patente || 'S/D'}</strong></div>
            <div><span className="text-slate-500">Motor</span><strong className="block font-mono">{auto.motor || 'S/D'}</strong></div><div><span className="text-slate-500">VIN</span><strong className="block font-mono">{auto.vin || 'S/D'}</strong></div><div><span className="text-slate-500">Color</span><strong className="block">{auto.color || 'S/D'}</strong></div><div><span className="text-slate-500">Kilometraje</span><strong className="block">{Number(auto.km || 0).toLocaleString('es-AR')} km</strong></div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider border-b border-slate-200 pb-1">Cláusula Segunda: Precio y Forma de Pago</h2>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[10px] uppercase tracking-wider font-black text-emerald-700">Precio total acordado</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">$ {money(totalArs)} ARS</p>
            <p className="text-sm font-bold text-emerald-800">USD {money(totalUsd)} · TC histórico $ {money(rate)}</p>
          </div>
          <div className="space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border">
            <div className="flex justify-between py-1 border-b"><span>Forma de pago</span><strong>{venta.forma_pago}</strong></div>
            {anticipoUsd > 0 && <div className="flex justify-between py-1 border-b"><span>Anticipo</span><strong>$ {money(anticipoUsd * rate)} ARS · USD {money(anticipoUsd)}</strong></div>}
            {vehiculoPermuta && <div className="flex justify-between gap-4 py-1 border-b bg-blue-50 px-2 rounded text-blue-900"><span>Permuta: {vehiculoPermuta.marca} {vehiculoPermuta.modelo} {vehiculoPermuta.patente || ''}</span><strong className="whitespace-nowrap">$ {money(permutaUsd * rate)} · USD {money(permutaUsd)}</strong></div>}
            {venta.cuotas.length > 0 && <div className="flex justify-between py-1"><span>Saldo financiado ({venta.cuotas.length} cuotas)</span><strong>$ {money(saldoUsd * rate)} ARS · USD {money(saldoUsd)}</strong></div>}
          </div>
        </section>

        {venta.cuotas.length > 0 && <section className="space-y-2 text-xs"><p className="font-black text-slate-800">Plan de pagos</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{venta.cuotas.map((c) => { const usd = Number(c.monto_usd); return <div key={c.id_cuota} className="border p-2 rounded bg-slate-50"><span className="text-slate-500">Cuota #{c.numero_cuota}</span><strong className="block text-slate-900">$ {money(usd * rate)} ARS</strong><span className="block text-[10px] text-slate-500">USD {money(usd)} · Vto. {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR')}</span></div>; })}</div></section>}

        <div className="space-y-2 text-[11px] text-slate-600 text-justify">
          <p><strong>Cláusula Tercera (Transferencia Registral):</strong> La parte COMPRADORA se obliga a iniciar la transferencia registral de dominio a su costo dentro del plazo acordado entre las partes.</p>
          <p><strong>Cláusula Cuarta (Responsabilidad):</strong> A partir de la entrega de la posesión efectiva del rodado, la parte COMPRADORA asume las responsabilidades derivadas de su uso y circulación, sin perjuicio de las obligaciones legales aplicables.</p>
        </div>

        {concesionaria.pieImpresion && <p className="text-[10px] text-slate-500 border-t pt-3">{concesionaria.pieImpresion}</p>}
        <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs"><div className="border-t border-slate-900 pt-2"><p className="font-black uppercase">{concesionaria.nombre}</p><p className="text-slate-500">Parte Vendedora</p></div><div className="border-t border-slate-900 pt-2"><p className="font-black uppercase">{comprador.nombre_completo}</p><p className="text-slate-500">Parte Compradora · DNI {comprador.dni || '..........'}</p></div></div>
      </div>
    </div>
  );
}
