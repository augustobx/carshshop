import { PrismaClient, RolUsuario, EstadoVehiculo, FormaPago, EstadoTarea } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// --- FUNCIONES AUXILIARES INTELIGENTES (Anti-errores de espacios) ---
const safeString = (val: any) => typeof val === 'string' ? val.trim() : '';
const parseNum = (val: any) => {
  if (val === null || val === undefined || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};
const safeDate = (val: any, defaultDate = new Date()) => {
  if (!val || val === 'NULL' || String(val).trim() === '') return defaultDate;
  const d = new Date(String(val).trim());
  return isNaN(d.getTime()) ? defaultDate : d;
};
const parseDni = (val: any) => {
  if (!val) return null;
  const s = String(val).trim();
  return (s === '' || s.toLowerCase() === 'null') ? null : s;
};

// --- MAPEADORES DE ESTADOS ---
const mapEstadoVehiculo = (val: any): EstadoVehiculo => {
  const s = safeString(val).toLowerCase();
  if (s.includes('listo')) return EstadoVehiculo.LISTO_PARA_VENTA;
  if (s.includes('consig')) return EstadoVehiculo.EN_CONSIGNACION;
  if (s.includes('seña') || s.includes('sena')) return EstadoVehiculo.SENADO;
  if (s.includes('vendid')) return EstadoVehiculo.VENDIDO;
  return EstadoVehiculo.EN_PREPARACION;
};

const mapFormaPago = (val: any): FormaPago => {
  const s = safeString(val).toLowerCase();
  return s.includes('cuota') ? FormaPago.Cuotas : FormaPago.Contado;
};

const mapEstadoCuota = (val: any) => {
  const s = safeString(val).toLowerCase();
  return s.includes('pagad') ? 'PAGADA' : 'PENDIENTE';
};

const mapEstadoPrestamo = (val: any) => {
  const s = safeString(val).toLowerCase();
  return s.includes('finaliz') ? 'FINALIZADO' : 'ACTIVO';
};

const mapEstadoTarea = (val: any): EstadoTarea => {
  const s = safeString(val).toLowerCase();
  return s.includes('finaliz') ? EstadoTarea.FINALIZADA : EstadoTarea.PENDIENTE;
};

async function main() {
  const rutaJson = path.join(process.cwd(), 'prisma', 'database.json');
  console.log('--- 🚀 Iniciando siembra masiva PERFECTA ---');

  if (!fs.existsSync(rutaJson)) {
    console.error('❌ ERROR: No se encontró el archivo database.json');
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(rutaJson, 'utf-8'));

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

  // 1. CONFIGURACIÓN Y USUARIOS
  console.log('Cargando Configuración y Usuarios...');
  await prisma.configuracion.createMany({
    data: [
      { clave: 'bg_image', valor: 'assets/img/backgrounds/bg_1772030559_233.png' },
      { clave: 'dolar', valor: '1430' },
      { clave: 'theme_mode', valor: 'thematic' },
      { clave: 'tna', valor: '48.00' }
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

  // 2. CLIENTES
  const clientesRaw = db.clientes || [];
  if (clientesRaw.length > 0) {
    const clientesLimpios = clientesRaw.map((c: any) => ({
      id_cliente: c.id_cliente,
      nombre_completo: safeString(c.nombre_completo),
      dni: parseDni(c.dni),
      telefono: safeString(c.telefono),
      email: safeString(c.email) !== '' ? safeString(c.email) : null,
      domicilio: safeString(c.domicilio)
    }));
    await prisma.cliente.createMany({ data: clientesLimpios });
    console.log(`✅ ${clientesLimpios.length} Clientes cargados.`);
  }

  // 3. VEHÍCULOS
  const vehiculosRaw = db.vehiculos || [];
  if (vehiculosRaw.length > 0) {
    const vehiculosLimpios = vehiculosRaw.map((v: any) => ({
      id_vehiculo: v.id_vehiculo,
      marca: safeString(v.marca),
      modelo: safeString(v.modelo),
      anio: parseNum(v.anio) || null,
      patente: safeString(v.patente) || null,
      km: parseNum(v.km) || null,
      color: safeString(v.color),
      transmision: safeString(v.transmision),
      motor: safeString(v.motor),
      estado: mapEstadoVehiculo(v.estado),
      precio_compra_usd: parseNum(v.precio_compra_usd),
      precio_compra_ars: parseNum(v.precio_compra_ars),
      precio_venta_usd: parseNum(v.precio_venta_usd),
      precio_venta_ars: parseNum(v.precio_venta_ars),
      id_cliente: v.id_cliente_consignacion || null,
      comision_consignacion_pct: parseNum(v.comision_consignacion_pct) || null,
      fecha_ingreso: safeDate(v.fecha_ingreso)
    }));
    await prisma.vehiculo.createMany({ data: vehiculosLimpios });
    console.log(`✅ ${vehiculosLimpios.length} Vehículos cargados perfectamente.`);
  }

  // 4. VENTAS
  const ventasRaw = db.ventas || [];
  if (ventasRaw.length > 0) {
    const ventasLimpias = ventasRaw.map((v: any) => ({
      id_venta: v.id_venta,
      id_vehiculo: v.id_vehiculo,
      id_cliente: v.id_cliente,
      id_vendedor_interno: v.id_vendedor_interno || null,
      precio_final_usd: parseNum(v.precio_final_usd),
      forma_pago: mapFormaPago(v.forma_pago),
      cotizacion_dolar_venta: parseNum(v.cotizacion_dolar_venta),
      fecha_venta: safeDate(v.fecha_venta)
    }));
    await prisma.venta.createMany({ data: ventasLimpias });
    console.log(`✅ ${ventasLimpias.length} Ventas cargadas.`);
  }

  // 5. CUOTAS DE VENTAS
  const ventaCuotasRaw = db.venta_cuotas || [];
  if (ventaCuotasRaw.length > 0) {
    const vCuotasLimpias = ventaCuotasRaw.map((c: any) => ({
      id_cuota: c.id_cuota,
      id_venta: c.id_venta,
      numero_cuota: parseNum(c.numero_cuota),
      monto_usd: parseNum(c.monto_usd),
      fecha_vencimiento: safeDate(c.fecha_vencimiento),
      estado: mapEstadoCuota(c.estado),
      fecha_pago: c.fecha_pago ? safeDate(c.fecha_pago) : null
    }));
    await prisma.ventaCuota.createMany({ data: vCuotasLimpias });
    console.log(`✅ ${vCuotasLimpias.length} Cuotas de ventas procesadas.`);
  }

  // 6. PRÉSTAMOS
  const prestamosRaw = db.prestamos || [];
  if (prestamosRaw.length > 0) {
    const prestamosLimpios = prestamosRaw.map((p: any) => ({
      id_prestamo: p.id_prestamo,
      id_cliente: p.id_cliente,
      capital_entregado_usd: parseNum(p.monto_capital_usd),
      total_devolver_usd: parseNum(p.monto_capital_usd),
      cotizacion_dolar_prestamo: parseNum(p.tna) || 1430,
      fecha_prestamo: safeDate(p.fecha_creacion),
      estado: mapEstadoPrestamo(p.estado)
    }));
    await prisma.prestamo.createMany({ data: prestamosLimpios });
    console.log(`✅ ${prestamosLimpios.length} Préstamos cargados.`);
  }

  // 7. CUOTAS DE PRÉSTAMOS
  const prestamoCuotasRaw = db.prestamo_cuotas || [];
  if (prestamoCuotasRaw.length > 0) {
    const pCuotasLimpias = prestamoCuotasRaw.map((c: any) => ({
      id_cuota: c.id_cuota,
      id_prestamo: c.id_prestamo,
      numero_cuota: parseNum(c.numero_cuota),
      monto_usd: parseNum(c.monto_usd),
      fecha_vencimiento: safeDate(c.fecha_vencimiento),
      estado: mapEstadoCuota(c.estado),
      fecha_pago: c.fecha_pago ? safeDate(c.fecha_pago) : null
    }));
    await prisma.prestamoCuota.createMany({ data: pCuotasLimpias });
    console.log(`✅ ${pCuotasLimpias.length} Cuotas de préstamos procesadas.`);
  }

  // 8. TAREAS
  const tareasRaw = db.tareas || [];
  if (tareasRaw.length > 0) {
    const tareasLimpias = tareasRaw.map((t: any) => ({
      id_tarea: t.id_tarea,
      id_vehiculo: t.id_vehiculo,
      descripcion: safeString(t.descripcion) || 'Sin detalle',
      estado_tarea: mapEstadoTarea(t.estado_tarea)
    }));
    await prisma.tarea.createMany({ data: tareasLimpias });
    console.log(`✅ ${tareasLimpias.length} Tareas cargadas.`);
  }

  // 9. GASTOS
  const gastosRaw = db.gastos || [];
  if (gastosRaw.length > 0) {
    const gastosLimpios = gastosRaw.map((g: any) => ({
      id_gasto: g.id_gasto,
      descripcion: safeString(g.descripcion) || 'Gasto de taller',
      monto_usd: parseNum(g.monto_usd),
      monto_ars: parseNum(g.monto_ars),
      fecha: safeDate(g.fecha_gasto),
      id_tarea: g.id_tarea || null
    }));
    await prisma.gasto.createMany({ data: gastosLimpios });
    console.log(`✅ ${gastosLimpios.length} Gastos financieros registrados.`);
  }

  console.log('--- 🎉 MIGRACIÓN MASIVA FINALIZADA CON ÉXITO ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });