"use client";

import { useConfigStore } from "@/store/useConfigStore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Percent, Car, Wrench } from "lucide-react";

export function DashboardClient({ data }: { data: any }) {
  const { dolarBlue, tna } = useConfigStore();

  const usdToPesos = (usd: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(usd * dolarBlue);
  };

  const formattedUsd = (usd: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard General</h1>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2 bg-muted px-4 py-2 rounded-xl text-sm font-medium">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span>Dólar Blue: {formattedUsd(dolarBlue).replace('$', '$ ')} ARS</span>
          </div>
          <div className="flex items-center space-x-2 bg-muted px-4 py-2 rounded-xl text-sm font-medium">
            <Percent className="w-4 h-4 text-blue-500" />
            <span>TNA: {(tna * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="p-6 border rounded-2xl bg-card text-card-foreground shadow-sm">
          <div className="flex items-center flex-row justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium">Ingresos Est. (Pendientes)</h3>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formattedUsd(data.totalIngresosEsperados)}</div>
          <p className="text-xs text-muted-foreground mt-1">{usdToPesos(data.totalIngresosEsperados)} ARS</p>
        </div>

        {/* Card 2 */}
        <div className="p-6 border rounded-2xl bg-card text-card-foreground shadow-sm">
          <div className="flex items-center flex-row justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium">Gastos Registrados</h3>
            <Wrench className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold">{formattedUsd(data.totalGastos)}</div>
          <p className="text-xs text-muted-foreground mt-1">{usdToPesos(data.totalGastos)} ARS</p>
        </div>

        {/* Card 3 */}
        <div className="p-6 border rounded-2xl bg-card text-card-foreground shadow-sm">
          <div className="flex items-center flex-row justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium">Listos para Venta</h3>
            <Car className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{data.vehiculosListos}</div>
          <p className="text-xs text-muted-foreground mt-1">Vehículos en stock</p>
        </div>

        {/* Card 4 */}
        <div className="p-6 border rounded-2xl bg-card text-card-foreground shadow-sm">
          <div className="flex items-center flex-row justify-between pb-2 space-y-0">
            <h3 className="tracking-tight text-sm font-medium">En Preparación</h3>
            <Car className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold">{data.vehiculosProceso}</div>
          <p className="text-xs text-muted-foreground mt-1">Requieren tareas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-[400px]">
        <div className="p-6 border rounded-2xl bg-card col-span-4 flex flex-col justify-between">
          <h3 className="font-semibold text-lg mb-4">Balance USD</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '10px', backgroundColor: '#222', border: 'none', color: '#fff' }} />
              <Bar dataKey="value" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 border rounded-2xl bg-card col-span-3">
            <h3 className="font-semibold text-lg mb-4">Ventas Recientes</h3>
            <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No hay transacciones recientes para mostrar.
            </div>
        </div>
      </div>
    </div>
  );
}
