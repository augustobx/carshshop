import { PrismaClient, RolUsuario, EstadoVehiculo, FormaPago, EstadoTarea, EstadoSenia } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Función auxiliar para leer los JSON
const leerDatos = (archivo: string) => {
  const ruta = path.join(__dirname, 'seed_data', archivo);
  if (!fs.existsSync(ruta)) return [];
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
};

async function main() {
  console.log('--- 🗑️ Limpiando tablas para evitar duplicados ---');
  await prisma.ventaCuota.deleteMany();
  await prisma.prestamoCuota.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.prestamo.deleteMany();
  await prisma.senia.deleteMany();
  await prisma.gasto.deleteMany();
  await prisma.tarea.deleteMany();
  await prisma.anotacion.deleteMany();
  await prisma.vehiculoFoto.deleteMany();
  await prisma.vehiculo.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.configuracion.deleteMany();

  console.log('--- 🚀 Iniciando siembra masiva ---');

  // 1. CONFIGURACIÓN
  console.log('Cargando Configuración...');
  await prisma.configuracion.createMany({
    data: [
      { clave: 'bg_image', valor: 'assets/img/backgrounds/bg_1772030559_233.png' },
      { clave: 'dolar', valor: '1430' },
      { clave: 'theme_mode', valor: 'thematic' },
      { clave: 'tna', valor: '48.00' },
      { clave: 'tna_anual', valor: '60.00' }
    ]
  });

  // 2. USUARIOS
  console.log('Cargando Usuarios...');
  await prisma.usuario.createMany({
    data: [
      { id_usuario: 8, nombre: 'Juan Manuel', email: 'sendonjuanma@gmail.com', password: '...', rol: RolUsuario.Admin },
      { id_usuario: 9, nombre: 'Sebastian', email: 'Sebiitaas666@gmail.com', password: '...', rol: RolUsuario.Admin },
      { id_usuario: 10, nombre: 'SANTINO AYALA', email: 'SANTINOAYALA514@GMAIL.COM', password: '...', rol: RolUsuario.Vendedor },
      { id_usuario: 11, nombre: 'Desarrollador', email: 'desa@nanolabs.com.ar', password: '...', rol: RolUsuario.Admin },
      { id_usuario: 12, nombre: 'oriana machado', email: 'oriananairmachado@gmail.com', password: '...', rol: RolUsuario.RRHH },
      { id_usuario: 13, nombre: 'lucila batle', email: 'batllelucila@gmail.com', password: '...', rol: RolUsuario.RRHH }
    ]
  });

  // 3. CLIENTES
  console.log('Cargando Clientes...');
  const clientes = leerDatos('clientes.json');
  if (clientes.length > 0) {
    await prisma.cliente.createMany({ data: clientes });
  }

  // 4. VEHÍCULOS
  console.log('Cargando Vehículos...');
  const vehiculos = leerDatos('vehiculos.json');
  if (vehiculos.length > 0) {
    for (const v of vehiculos) {
      await prisma.vehiculo.create({
        data: {
          id_vehiculo: v.id_vehiculo,
          marca: v.marca,
          modelo: v.modelo,
          anio: v.anio,
          patente: v.patente,
          km: v.km,
          color: v.color,
          transmision: v.transmision,
          motor: v.motor,
          estado: v.estado as EstadoVehiculo,
          precio_compra_usd: v.precio_compra_usd,
          precio_compra_ars: v.precio_compra_ars,
          precio_venta_usd: v.precio_venta_usd,
          precio_venta_ars: v.precio_venta_ars,
          id_cliente: v.id_cliente_consignacion || null,
          comision_consignacion_pct: v.comision_consignacion_pct || null,
          fecha_ingreso: v.fecha_ingreso ? new Date(v.fecha_ingreso) : new Date()
        }
      });
    }
  }

  // 5. VENTAS Y CUOTAS DE VENTAS
  console.log('Cargando Ventas y Cuotas...');
  const ventas = leerDatos('ventas.json');
  const ventasCuotas = leerDatos('venta_cuotas.json');

  for (const v of ventas) {
    // Filtramos las cuotas que le pertenecen a esta venta
    const cuotasDeEstaVenta = ventasCuotas.filter((c: any) => c.id_venta === v.id_venta);

    await prisma.venta.create({
      data: {
        id_venta: v.id_venta,
        id_vehiculo: v.id_vehiculo,
        id_cliente: v.id_cliente,
        id_vendedor_interno: v.id_vendedor_interno || null,
        precio_final_usd: v.precio_final_usd,
        forma_pago: v.forma_pago as FormaPago,
        cotizacion_dolar_venta: v.cotizacion_dolar_venta,
        fecha_venta: new Date(v.fecha_venta),
        cuotas: {
          create: cuotasDeEstaVenta.map((c: any) => ({
            id_cuota: c.id_cuota,
            numero_cuota: c.numero_cuota,
            monto_usd: c.monto_usd,
            fecha_vencimiento: new Date(c.fecha_vencimiento),
            estado: c.estado === 'Pagada' ? 'PAGADA' : 'PENDIENTE',
            fecha_pago: c.fecha_pago ? new Date(c.fecha_pago) : null
          }))
        }
      }
    });
  }

  // 6. PRÉSTAMOS Y CUOTAS DE PRÉSTAMOS
  console.log('Cargando Préstamos y Cuotas...');
  const prestamos = leerDatos('prestamos.json');
  const prestamosCuotas = leerDatos('prestamo_cuotas.json');

  for (const p of prestamos) {
    const cuotasDeEstePrestamo = prestamosCuotas.filter((c: any) => c.id_prestamo === p.id_prestamo);

    await prisma.prestamo.create({
      data: {
        id_prestamo: p.id_prestamo,
        id_cliente: p.id_cliente,
        capital_entregado_usd: p.monto_capital_usd,
        total_devolver_usd: p.monto_capital_usd, // Base, ajustar si aplicabas interés directo al total
        cotizacion_dolar_prestamo: 1430, // Default fallback
        fecha_prestamo: new Date(p.fecha_creacion),
        estado: p.estado === 'Finalizado' ? 'FINALIZADO' : 'ACTIVO',
        cuotas: {
          create: cuotasDeEstePrestamo.map((c: any) => ({
            id_cuota: c.id_cuota,
            numero_cuota: c.numero_cuota,
            monto_usd: c.monto_usd,
            fecha_vencimiento: new Date(c.fecha_vencimiento),
            estado: c.estado === 'Pagada' ? 'PAGADA' : 'PENDIENTE',
            fecha_pago: c.fecha_pago ? new Date(c.fecha_pago) : null
          }))
        }
      }
    });
  }

  // 7. TAREAS Y GASTOS
  console.log('Cargando Tareas y Gastos...');
  const tareas = leerDatos('tareas.json');
  const gastos = leerDatos('gastos.json');

  for (const t of tareas) {
    const gastosDeEstaTarea = gastos.filter((g: any) => g.id_tarea === t.id_tarea);

    await prisma.tarea.create({
      data: {
        id_tarea: t.id_tarea,
        id_vehiculo: t.id_vehiculo,
        descripcion: t.descripcion,
        estado_tarea: t.estado_tarea === 'Finalizada' ? EstadoTarea.FINALIZADA : EstadoTarea.PENDIENTE,
        gastos: {
          create: gastosDeEstaTarea.map((g: any) => ({
            id_gasto: g.id_gasto,
            descripcion: g.descripcion || 'Gasto de tarea',
            monto_usd: g.monto_usd,
            monto_ars: g.monto_ars,
            fecha: g.fecha_gasto ? new Date(g.fecha_gasto) : new Date()
          }))
        }
      }
    });
  }

  console.log('--- ✅ MIGRACIÓN MASIVA COMPLETA ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });