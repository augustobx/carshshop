'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { guardarVehiculo, actualizarVehiculo } from '@/actions/vehiculos';
import { Save, ArrowLeft, Loader2, DollarSign, Banknote, Car, Settings } from 'lucide-react';
import Link from 'next/link';
import { useConfigStore } from '@/store/useConfigStore';

export default function VehiculoForm({ vehiculo }: { vehiculo?: any }) {
    const router = useRouter();
    const { dolarBlue } = useConfigStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorGlobal, setErrorGlobal] = useState('');

    // FORMULARIO PRINCIPAL (Para datos de texto)
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: vehiculo || {
            estado: 'EN_PREPARACION',
            tipo_ingreso: 'Propio',
            comision_consignacion_pct: 0,
            km: 0, anio: new Date().getFullYear(),
        },
    });

    const tipoIngreso = watch('tipo_ingreso');

    // ESTADOS DE PRECIOS 100% AISLADOS (Aquí está la magia que soluciona el bug)
    // Inicializamos con el valor exacto de la base de datos, sin recalcular nada.
    const [compraArs, setCompraArs] = useState<string>(vehiculo?.precio_compra_ars?.toString() || '');
    const [compraUsd, setCompraUsd] = useState<string>(vehiculo?.precio_compra_usd?.toString() || '');
    const [ventaArs, setVentaArs] = useState<string>(vehiculo?.precio_venta_ars?.toString() || '');
    const [ventaUsd, setVentaUsd] = useState<string>(vehiculo?.precio_venta_usd?.toString() || '');

    // MOTOR BIMONETARIO PURO (El ARS manda)
    const handleCompraArs = (val: string) => {
        setCompraArs(val);
        const num = parseFloat(val) || 0;
        setCompraUsd(num > 0 ? (num / dolarBlue).toFixed(2) : '');
    };

    const handleCompraUsd = (val: string) => {
        setCompraUsd(val);
        const num = parseFloat(val) || 0;
        setCompraArs(num > 0 ? (num * dolarBlue).toFixed(2) : '');
    };

    const handleVentaArs = (val: string) => {
        setVentaArs(val);
        const num = parseFloat(val) || 0;
        setVentaUsd(num > 0 ? (num / dolarBlue).toFixed(2) : '');
    };

    const handleVentaUsd = (val: string) => {
        setVentaUsd(val);
        const num = parseFloat(val) || 0;
        setVentaArs(num > 0 ? (num * dolarBlue).toFixed(2) : '');
    };

    // ENVÍO AL SERVIDOR
    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setErrorGlobal('');

        // Inyectamos manualmente los precios matemáticamente puros
        data.precio_compra_ars = parseFloat(compraArs) || 0;
        data.precio_compra_usd = parseFloat(compraUsd) || 0;
        data.precio_venta_ars = parseFloat(ventaArs) || 0;
        data.precio_venta_usd = parseFloat(ventaUsd) || 0;

        const res = vehiculo
            ? await actualizarVehiculo(vehiculo.id_vehiculo, data)
            : await guardarVehiculo(data);

        if (res.success) {
            router.push('/vehiculos');
            router.refresh();
        } else {
            setErrorGlobal(res.error || 'Ocurrió un error inesperado al guardar.');
            setIsSubmitting(false);
        }
    };

    const inputClass = "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm";
    const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

    // Cálculos para la vista en vivo
    const currentCompraUsd = parseFloat(compraUsd) || 0;
    const currentVentaUsd = parseFloat(ventaUsd) || 0;
    const margenBrutoUsd = currentVentaUsd - currentCompraUsd;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-6xl mx-auto pb-10">
            {!vehiculo && (
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Car className="w-6 h-6 text-indigo-600" /> Ingresar Nuevo Vehículo
                    </h2>
                    <div className="flex gap-3">
                        <Link href="/vehiculos" className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center gap-2 transition-colors"><ArrowLeft className="w-4 h-4" /> Volver</Link>
                    </div>
                </div>
            )}

            {errorGlobal && <div className="bg-red-50 text-red-700 p-4 rounded-lg font-medium border border-red-200">{errorGlobal}</div>}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* BLOQUE IZQUIERDO: DATOS TÉCNICOS */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                            <Car className="w-5 h-5 text-indigo-500" /> Datos Principales
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClass}>Marca *</label>
                                <input {...register('marca')} required className={inputClass} placeholder="Ej: Volkswagen" />
                            </div>
                            <div>
                                <label className={labelClass}>Modelo *</label>
                                <input {...register('modelo')} required className={inputClass} placeholder="Ej: Amarok V6" />
                            </div>
                            <div>
                                <label className={labelClass}>Año *</label>
                                <input type="number" {...register('anio', { valueAsNumber: true })} required className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Kilometraje</label>
                                <input type="number" {...register('km', { valueAsNumber: true })} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Patente</label>
                                <input {...register('patente')} className={`${inputClass} uppercase font-mono`} placeholder="AB123CD" />
                            </div>
                            <div>
                                <label className={labelClass}>VIN (Chasis)</label>
                                <input {...register('vin')} className={`${inputClass} uppercase font-mono text-xs`} placeholder="8AW..." />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-slate-400" /> Especificaciones Técnicas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                            <div>
                                <label className={labelClass}>Motor</label>
                                <input {...register('motor')} className={inputClass} placeholder="Ej: 2.0 TDI" />
                            </div>
                            <div>
                                <label className={labelClass}>Transmisión</label>
                                <select {...register('transmision')} className={inputClass}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Manual">Manual</option>
                                    <option value="Automática">Automática</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Tracción</label>
                                <input {...register('traccion')} className={inputClass} placeholder="Ej: 4x4" />
                            </div>
                            <div>
                                <label className={labelClass}>Color</label>
                                <input {...register('color')} className={inputClass} placeholder="Ej: Blanco" />
                            </div>
                            <div>
                                <label className={labelClass}>Puertas</label>
                                <input type="number" {...register('puertas', { valueAsNumber: true })} className={inputClass} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BLOQUE DERECHO: COMERCIAL Y FINANZAS */}
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5">Estado Comercial</h3>
                        <div className="space-y-5">
                            <div>
                                <label className={labelClass}>Estado del Inventario</label>
                                <select {...register('estado')} className={inputClass}>
                                    <option value="EN_PREPARACION">En Preparación</option>
                                    <option value="LISTO_PARA_VENTA">Listo para Venta</option>
                                    <option value="EN_CONSIGNACION">En Consignación</option>
                                    <option value="SENADO">Señado</option>
                                    <option value="VENDIDO">Vendido</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Tipo de Ingreso</label>
                                <select {...register('tipo_ingreso')} className={inputClass}>
                                    <option value="Propio">Vehículo Propio (Agencia)</option>
                                    <option value="Consignacion">Consignación de Tercero</option>
                                </select>
                            </div>
                            {tipoIngreso === 'Consignacion' && (
                                <div className="p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-xl">
                                    <label className="block text-xs font-bold text-fuchsia-800 uppercase tracking-wider mb-2">Comisión Pactada (%)</label>
                                    <input type="number" step="0.01" {...register('comision_consignacion_pct', { valueAsNumber: true })} className={inputClass} placeholder="Ej: 5.00" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 shadow-sm flex flex-col h-auto">
                        <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-200 pb-3 mb-5">Valores (ARS / USD)</h3>

                        <div className="space-y-5 flex-1">
                            {/* PRECIO COMPRA */}
                            {tipoIngreso === 'Propio' && (
                                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm space-y-3">
                                    <label className="block text-xs font-black text-slate-500 uppercase">Costo de Compra Base</label>
                                    <div className="relative">
                                        <Banknote className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <input
                                            type="number" step="any"
                                            value={compraArs}
                                            onChange={(e) => handleCompraArs(e.target.value)}
                                            className="w-full pl-9 p-2 border border-slate-300 rounded-lg font-bold text-slate-700 focus:ring-emerald-500"
                                            placeholder="ARS"
                                        />
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
                                        <input
                                            type="number" step="any"
                                            value={compraUsd}
                                            onChange={(e) => handleCompraUsd(e.target.value)}
                                            className="w-full pl-9 p-2 border border-emerald-200 rounded-lg font-bold text-emerald-700 focus:ring-emerald-500 bg-emerald-50/50"
                                            placeholder="USD"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* PRECIO VENTA */}
                            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm space-y-3">
                                <label className="block text-xs font-black text-slate-500 uppercase">Precio Venta Sugerido</label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number" step="any"
                                        value={ventaArs}
                                        onChange={(e) => handleVentaArs(e.target.value)}
                                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg font-bold text-slate-700 focus:ring-emerald-500"
                                        placeholder="ARS"
                                    />
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
                                    <input
                                        type="number" step="any"
                                        value={ventaUsd}
                                        onChange={(e) => handleVentaUsd(e.target.value)}
                                        className="w-full pl-9 p-2 border border-emerald-200 rounded-lg font-bold text-emerald-700 focus:ring-emerald-500 bg-emerald-50/50"
                                        placeholder="USD"
                                    />
                                </div>
                            </div>

                            {/* CÁLCULO DE MARGEN BRUTO */}
                            {tipoIngreso === 'Propio' && currentVentaUsd > 0 && currentCompraUsd > 0 && (
                                <div className="pt-3 border-t border-emerald-200/50">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-emerald-800">Margen Bruto (Est.)</span>
                                        <span className="font-black text-emerald-600">
                                            U$S {margenBrutoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-emerald-200">
                            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {vehiculo ? 'Guardar Cambios' : 'Registrar Vehículo'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}