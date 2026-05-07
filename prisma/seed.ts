import { PrismaClient, RolUsuario, EstadoVehiculo, FormaPago, EstadoTarea } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Busca el archivo database.json en la carpeta actual
  const rutaJson = path.join(process.cwd(), 'prisma', 'database.json');
  console.log('--- 🚀 Iniciando siembra masiva ---');
  console.log('Buscando archivo de datos en:', rutaJson);

  if (!fs.existsSync(rutaJson)) {
    console.error('❌ ERROR FATAL: No se encontró el archivo database.json');
    process.exit(1);
  }

  const rawData = fs.readFileSync(rutaJson, 'utf-8');
  const db = JSON.parse(rawData);

  console.log('--- 🗑️ Limpiando tablas ---');
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

  console.log('Cargando Configuración y Usuarios...');
  await prisma.configuracion.createMany({
    data: [
      { clave: 'bg_image', valor: 'assets/img/backgrounds/bg_1772030559_233.png' },
      { clave: 'dolar', valor: '1430' },
      { clave: 'theme_mode', valor: 'thematic' },
      { clave: 'tna', valor: '48.00' },
      { clave: 'tna_anual', valor: '60.00' }
    ]
  });

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

  const clientes = db.clientes || [];
  console.log(`Cargando ${clientes.length} Clientes...`);
  if (clientes.length > 0) {
    await prisma.cliente.createMany({ data: clientes });
  }

  const vehiculos = db.vehiculos || [];
  console.log(`Cargando ${vehiculos.length} Vehículos...`);
  for (const v of vehiculos) {
    let estadoMapped = EstadoVehiculo.EN_PREPARACION;
    if (v.estado === 'Listo para Venta') estadoMapped = EstadoVehiculo.LISTO_PARA_VENTA;
    if (v.estado === 'En Consignación') estadoMapped = EstadoVehiculo.EN_CONSIGNACION;
    if (v.estado === 'Señado') estadoMapped = EstadoVehiculo.SENADO;
    if (v.estado === 'Vendido') estadoMapped = EstadoVehiculo.VENDIDO;

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
        estado: estadoMapped,
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

  const ventas = db.ventas || [];
  const ventasCuotas = db.venta_cuotas || [];
  console.log(`Cargando ${ventas.length} Ventas con sus cuotas...`);

  for (const v of ventas) {
    const cuotasDeEstaVenta = ventasCuotas.filter((c: any) => c.id_venta === v.id_venta);

    await prisma.venta.create({
      data: {
        id_venta: v.id_venta,
        id_vehiculo: v.id_vehiculo,
        id_cliente: v.id_cliente,
        id_vendedor_interno: v.id_vendedor_interno || null,
        precio_final_usd: v.precio_final_usd || 0,
        forma_pago: v.forma_pago === 'Contado' ? FormaPago.Contado : FormaPago.Cuotas,
        cotizacion_dolar_venta: v.cotizacion_dolar_venta,
        fecha_venta: v.fecha_venta ? new Date(v.fecha_venta) : new Date(),
        cuotas: {
          create: cuotasDeEstaVenta.map((c: any) => ({
            id_cuota: c.id_cuota,
            numero_cuota: c.numero_cuota,
            monto_usd: c.monto_usd || 0,
            fecha_vencimiento: c.fecha_vencimiento ? new Date(c.fecha_vencimiento) : new Date(),
            estado: c.estado === 'Pagada' ? 'PAGADA' : 'PENDIENTE',
            fecha_pago: c.fecha_pago ? new Date(c.fecha_pago) : null
          }))
        }
      }
    });
  }

  const prestamos = db.prestamos || [];
  const prestamosCuotas = db.prestamo_cuotas || [];
  console.log(`Cargando ${prestamos.length} Préstamos con sus cuotas...`);

  for (const p of prestamos) {
    const cuotasDeEstePrestamo = prestamosCuotas.filter((c: any) => c.id_prestamo === p.id_prestamo);

    await prisma.prestamo.create({
      data: {
        id_prestamo: p.id_prestamo,
        id_cliente: p.id_cliente,
        capital_entregado_usd: p.monto_capital_usd || 0,
        total_devolver_usd: p.monto_capital_usd || 0,
        cotizacion_dolar_prestamo: p.tna || 1430,
        fecha_prestamo: p.fecha_creacion ? new Date(p.fecha_creacion) : new Date(),
        estado: p.estado === 'Finalizado' ? 'FINALIZADO' : 'ACTIVO',
        cuotas: {
          create: cuotasDeEstePrestamo.map((c: any) => ({
            id_cuota: c.id_cuota,
            numero_cuota: c.numero_cuota,
            monto_usd: c.monto_usd || 0,
            fecha_vencimiento: c.fecha_vencimiento ? new Date(c.fecha_vencimiento) : new Date(),
            estado: c.estado === 'Pagada' ? 'PAGADA' : 'PENDIENTE',
            fecha_pago: c.fecha_pago ? new Date(c.fecha_pago) : null
          }))
        }
      }
    });
  }

  const tareas = db.tareas || [];
  const gastos = db.gastos || [];
  console.log(`Cargando ${tareas.length} Tareas y ${gastos.length} Gastos...`);

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
            monto_usd: g.monto_usd || 0,
            monto_ars: g.monto_ars || 0,
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