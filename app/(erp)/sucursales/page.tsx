import { obtenerSucursales } from '@/actions/sucursales';
import SucursalesClient from './SucursalesClient';

export const dynamic = 'force-dynamic';

export default async function SucursalesPage() {
  const sucursales = await obtenerSucursales();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sucursales y Puntos de Venta</h1>
        <p className="text-sm text-slate-500">
          Administrá las sedes comerciales, salones de exposición, talleres mecánicos y depósitos de la concesionaria.
        </p>
      </div>

      <SucursalesClient initialSucursales={sucursales} />
    </div>
  );
}
