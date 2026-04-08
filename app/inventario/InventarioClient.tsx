"use client";

import { useState } from "react";
import { useConfigStore } from "@/store/useConfigStore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Car, Plus, Wrench, DollarSign } from "lucide-react";
import { createTarea, addGasto, updateEstadoTarea } from "@/actions/tareas";
import { createVehiculo } from "@/actions/vehiculos";

export function InventarioClient({ vehiculos }: { vehiculos: any[] }) {
  const { dolarBlue } = useConfigStore();
  const [selectedVehiculo, setSelectedVehiculo] = useState<any>(null);
  
  // States for new Vehicle form
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [patente, setPatente] = useState("");
  const [precio, setPrecio] = useState("");

  // States for Tareas Form
  const [nuevaTarea, setNuevaTarea] = useState("");
  
  // State for Gastos form (associated to a Tarea ID)
  const [tareaActivaParaGasto, setTareaActivaParaGasto] = useState<number | null>(null);
  const [nuevoGastoDesc, setNuevoGastoDesc] = useState("");
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState("");

  const formatARS = (usd: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(usd * dolarBlue);
  };

  const handleCrearVehiculo = async () => {
    try {
      await createVehiculo({
        marca,
        modelo,
        patente,
        precio_compra_usd: parseFloat(precio || "0"),
        estado: 'EN_PREPARACION'
      });
      setMarca(""); setModelo(""); setPatente(""); setPrecio("");
    } catch (e) {
      console.error(e);
      alert("Error al crear vehículo. Revisa que la patente no exista.");
    }
  };

  const handleCreateTarea = async (id_vehiculo: number) => {
    if (!nuevaTarea) return;
    await createTarea(id_vehiculo, nuevaTarea);
    setNuevaTarea("");
    // We should ideally reload the selectedVehiculo from the updated vehicles list to show the new tarea.
    // For simplicity without a full router refresh prop drilling, Next.js server actions revalidate the page.
    // The dialog contents will be slightly outdated until reopened or using Optimistic UI, but this is a V1.
  };

  const handleToggleEstadoTarea = async (id_tarea: number, actual: string) => {
    const nuevo = actual === 'PENDIENTE' ? 'FINALIZADA' : 'PENDIENTE';
    await updateEstadoTarea(id_tarea, nuevo);
  };

  const handleAddGasto = async (id_tarea: number) => {
    if (!nuevoGastoDesc || !nuevoGastoMonto) return;
    await addGasto(id_tarea, nuevoGastoDesc, parseFloat(nuevoGastoMonto));
    setNuevoGastoDesc("");
    setNuevoGastoMonto("");
    setTareaActivaParaGasto(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventario de Vehículos</h1>
        <Dialog>
          <DialogTrigger render={<Button><Plus className="w-4 h-4 mr-2" /> Agregar Vehículo</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Vehículo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Marca (ej. Toyota)" value={marca} onChange={e => setMarca(e.target.value)} />
              <Input placeholder="Modelo (ej. Corolla 2021)" value={modelo} onChange={e => setModelo(e.target.value)} />
              <Input placeholder="Patente" value={patente} onChange={e => setPatente(e.target.value)} />
              <Input placeholder="Precio Compra (USD)" type="number" value={precio} onChange={e => setPrecio(e.target.value)} />
              <Button onClick={handleCrearVehiculo} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehículo</TableHead>
              <TableHead>Patente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Costo USD</TableHead>
              <TableHead>Costo Total Aprox (ARS)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehiculos.map((v) => {
              // Calcular gastos asociados
              const gastosTotalesUSD = v.tareas.reduce((sum: number, t: any) => 
                sum + t.gastos.reduce((gsum: number, g: any) => gsum + Number(g.monto_usd), 0)
              , 0);
              const costoTotal = Number(v.precio_compra_usd || 0) + gastosTotalesUSD;

              return (
                <TableRow key={v.id_vehiculo}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-muted-foreground mr-2" />
                      {v.marca} {v.modelo}
                    </div>
                  </TableCell>
                  <TableCell>{v.patente}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      v.estado === 'EN_PREPARACION' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                      v.estado === 'LISTO_PARA_VENTA' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {v.estado.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>${costoTotal}</TableCell>
                  <TableCell className="text-muted-foreground">{formatARS(costoTotal)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger render={
                        <Button variant="outline" size="sm" onClick={() => setSelectedVehiculo(v)}>
                          <Wrench className="w-4 h-4 mr-2" /> Tareas ({v.tareas.length})
                        </Button>
                      } />
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Acondicionamiento: {v.marca} {v.modelo} ({v.patente})</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-6">
                            
                          <div className="flex space-x-2">
                             <Input placeholder="Describir nueva tarea..." value={nuevaTarea} onChange={e => setNuevaTarea(e.target.value)} />
                             <Button onClick={() => handleCreateTarea(v.id_vehiculo)}>Agregar Tarea</Button>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold border-b pb-2">Tareas Asignadas</h4>
                            {v.tareas.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No hay tareas creadas.</p>
                            ) : v.tareas.map((t: any) => (
                              <div key={t.id_tarea} className="p-4 border rounded-xl bg-muted/30">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{t.descripcion}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Estado: {t.estado_tarea}</p>
                                  </div>
                                  <div className="space-x-2">
                                     <Button size="sm" variant={t.estado_tarea === 'PENDIENTE' ? 'default' : 'outline'} onClick={() => handleToggleEstadoTarea(t.id_tarea, t.estado_tarea)}>
                                        {t.estado_tarea === 'PENDIENTE' ? 'Finalizar' : 'Reabrir'}
                                     </Button>
                                     <Button size="sm" variant="secondary" onClick={() => setTareaActivaParaGasto(t.id_tarea)}>
                                        <DollarSign className="w-4 h-4 mr-1"/> Añadir Gasto
                                     </Button>
                                  </div>
                                </div>
                                
                                {tareaActivaParaGasto === t.id_tarea && (
                                    <div className="mt-4 p-3 bg-background border rounded-lg flex space-x-2">
                                        <Input placeholder="Repuesto/Mano de obra" value={nuevoGastoDesc} onChange={e => setNuevoGastoDesc(e.target.value)} />
                                        <Input type="number" placeholder="Monto USD" value={nuevoGastoMonto} onChange={e => setNuevoGastoMonto(e.target.value)} className="w-32" />
                                        <Button variant="default" onClick={() => handleAddGasto(t.id_tarea)}>Guardar</Button>
                                    </div>
                                )}

                                {t.gastos.length > 0 && (
                                    <div className="mt-3 text-sm">
                                        <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-2">Gastos registrados:</p>
                                        <ul className="space-y-1">
                                            {t.gastos.map((g: any) => (
                                                <li key={g.id_gasto} className="flex justify-between border-b border-border/50 pb-1">
                                                    <span>{g.descripcion || 'Sin descripción'}</span>
                                                    <span className="font-medium">${Number(g.monto_usd)} USD</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                              </div>
                            ))}
                          </div>

                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {vehiculos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay vehículos registrados en inventario.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
