import { z } from 'zod';

export const vehiculoSchema = z.object({
    marca: z.string().min(1, 'La marca es requerida'),
    modelo: z.string().min(1, 'El modelo es requerido'),
    anio: z.coerce.number().min(1950, 'Año inválido').max(new Date().getFullYear() + 1),
    transmision: z.string().optional(),
    traccion: z.string().optional(),
    puertas: z.coerce.number().optional(),
    motor: z.string().optional(),
    color: z.string().optional(),
    km: z.coerce.number().min(0).optional(),
    patente: z.string().optional(),
    vin: z.string().optional(),

    // Precios - Permite que lleguen vacíos y los fuerza a 0
    precio_compra_usd: z.coerce.number().optional().default(0),
    precio_compra_ars: z.coerce.number().optional().default(0),
    precio_venta_usd: z.coerce.number().optional().default(0),
    precio_venta_ars: z.coerce.number().optional().default(0),

    // Enums mapeados a Prisma
    estado: z.enum(['EN_PREPARACION', 'LISTO_PARA_VENTA', 'EN_CONSIGNACION', 'SENADO', 'VENDIDO']).default('EN_PREPARACION'),
    tipo_ingreso: z.string().default('Propio'),
    comision_consignacion_pct: z.coerce.number().optional().default(0),
});

export type VehiculoFormData = z.infer<typeof vehiculoSchema>;