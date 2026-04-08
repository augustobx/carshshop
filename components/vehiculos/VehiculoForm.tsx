'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { vehiculoSchema, VehiculoFormData } from '@/schemas/vehiculoSchema';
import { guardarVehiculo, actualizarVehiculo } from '@/actions/vehiculos';
import { Save, ArrowLeft, Loader2, DollarSign, Banknote } from 'lucide-react';
import Link from 'next/link';

interface VehiculoFormProps {
    vehiculo?: VehiculoFormData & { id_vehiculo: number };
}

export default function VehiculoForm({ vehiculo }: VehiculoFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorGlobal, setErrorGlobal] = useState('');

    const { register, handleSubmit, watch, formState: { errors } } = useForm<VehiculoFormData>({
        resolver: zodResolver(vehiculoSchema),
        defaultValues: vehiculo || {
            estado: 'EN_PREPARACION',
            tipo_ingreso: 'Propio',
            precio_compra_usd: 0, precio_compra_ars: 0,
            precio_venta_usd: 0, precio_venta_ars: 0,
            comision_consignacion_pct: 0,
        },
    });

    const tipoIngreso = watch('tipo_ingreso');

    const onSubmit = async (data: VehiculoFormData) => {
        setIsSubmitting(true);
        setErrorGlobal('');

        const res = vehiculo
            ? await actualizarVehiculo(vehiculo.id_vehiculo, data)
            : await guardarVehiculo(data);

        if (res.success) {
            router.push('/vehiculos');
            router.refresh();
        } else {
            setErrorGlobal(res.error || 'Ocurrió un error inesperado');
            setIsSubmitting(false);
        }
    };

    const inputClass = "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
    const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{vehiculo ? 'Editar Vehículo' : 'Ingresar Vehículo'}</h2>
                <div className="flex gap-3">
                    <Link href="/vehiculos" className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Volver</Link>
                    <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-70">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
                    </button>
                </div>
            </div>

            {errorGlobal && <div className="bg-red-50 text-red-700 p-4 rounded-lg font-medium">{errorGlobal}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold border-b pb-3 mb-5">Datos Principales</h3>
                        <div className="grid grid-cols-2 gap-5">
                            <div><label className={labelClass}>Marca *</label><input {...register('marca')} className={inputClass} /></div>
                            <div><label className={labelClass}>Modelo *</label><input {...register('modelo')} className={inputClass} /></div>
                            <div><label className={labelClass}>Año *</label><input type="number" {...register('anio')} className={inputClass} /></div>
                            <div><label className={labelClass}>KM</label><input type="number" {...register('km')} className={inputClass} /></div>
                            <div><label className={labelClass}>Patente</label><input {...register('patente')} className={`${inputClass} uppercase`} /></div>
                            <div><label className={labelClass}>VIN</label><input {...register('vin')} className={`${inputClass} uppercase`} /></div>
                            <div>
                                <label className={labelClass}>Transmisión</label>
                                <select {...register('transmision')} className={inputClass}>
                                    <option value="">Seleccionar...</option><option value="Manual">Manual</option><option value="Automatica">Automática</option>
                                </select>
                            </div>
                            <div><label className={labelClass}>Motor</label><input {...register('motor')} className={inputClass} /></div>
                            <div><label className={labelClass}>Color</label><input {...register('color')} className={inputClass} /></div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold border-b pb-3 mb-5">Estado Comercial</h3>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Estado</label>
                                <select {...register('estado')} className={inputClass}>
                                    <option value="EN_PREPARACION">En Preparación</option>
                                    <option value="LISTO_PARA_VENTA">Listo para Venta</option>
                                    <option value="EN_CONSIGNACION">En Consignación</option>
                                    <option value="SENADO">Señado</option>
                                    <option value="VENDIDO">Vendido</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Tipo Ingreso</label>
                                <select {...register('tipo_ingreso')} className={inputClass}>
                                    <option value="Propio">Propio (Agencia)</option>
                                    <option value="Consignacion">Consignación</option>
                                </select>
                            </div>
                            {tipoIngreso === 'Consignacion' && (
                                <div><label className={labelClass}>Comisión (%)</label><input type="number" step="0.01" {...register('comision_consignacion_pct')} className={inputClass} /></div>
                            )}
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 shadow-sm">
                        <h3 className="text-lg font-bold text-emerald-900 border-b border-emerald-200 pb-3 mb-5">Valores (ARS Prioridad)</h3>
                        <div className="space-y-5">
                            {tipoIngreso === 'Propio' && (
                                <div className="bg-white p-3 rounded border border-emerald-100 space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Costo (Compra)</label>
                                    <div className="relative"><Banknote className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input type="number" step="0.01" {...register('precio_compra_ars')} className={`${inputClass} pl-9`} placeholder="ARS" /></div>
                                    <div className="relative"><DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input type="number" step="0.01" {...register('precio_compra_usd')} className={`${inputClass} pl-9`} placeholder="USD" /></div>
                                </div>
                            )}
                            <div className="bg-white p-3 rounded border border-emerald-100 space-y-2">
                                <label className="text-sm font-bold text-slate-700">Precio Venta</label>
                                <div className="relative"><Banknote className="absolute left-3 top-2.5 w-4 h-4 text-emerald-500" /><input type="number" step="0.01" {...register('precio_venta_ars')} className={`${inputClass} pl-9`} placeholder="ARS" /></div>
                                <div className="relative"><DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-emerald-500" /><input type="number" step="0.01" {...register('precio_venta_usd')} className={`${inputClass} pl-9`} placeholder="USD" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}