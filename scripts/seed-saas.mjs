import { PrismaClient, EstadoVehiculo, FormaPago, EstadoTarea } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);
const prisma = new PrismaClient();

async function hashUserPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

const safeString = (val) => (typeof val === 'string' ? val.trim() : '');
const parseNum = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};
const safeDate = (val, defaultDate = new Date()) => {
  if (!val || val === 'NULL' || String(val).trim() === '') return defaultDate;
  const d = new Date(String(val).trim());
  return isNaN(d.getTime()) ? defaultDate : d;
};

const mapEstadoVehiculo = (val) => {
  const s = safeString(val).toLowerCase();
  if (s.includes('listo')) return EstadoVehiculo.LISTO_PARA_VENTA;
  if (s.includes('consig')) return EstadoVehiculo.EN_CONSIGNACION;
  if (s.includes('seña') || s.includes('sena')) return EstadoVehiculo.SENADO;
  if (s.includes('vendid')) return EstadoVehiculo.VENDIDO;
  return EstadoVehiculo.EN_PREPARACION;
};

async function main() {
  console.log('--- 🚀 Iniciando Seed SaaS de OnlyCars (NanoLabs) ---');

  // 1. PLANOS SAAS: Creación o actualización de Planes
  console.log('1. Creando planes SaaS de plataforma...');
  const plansData = [
    {
      code: 'STARTER',
      name: 'Plan Inicial',
      priceMonthly: 99,
      maxVehicles: 30,
      maxLocations: 1,
      maxUsers: 3,
      features: ['crm_leads', 'basic_reports'],
    },
    {
      code: 'PRO',
      name: 'Plan Profesional',
      priceMonthly: 249,
      maxVehicles: 150,
      maxLocations: 3,
      maxUsers: 10,
      features: ['crm_leads', 'multi_location', 'trade_ins', 'print_contracts', 'advanced_costing'],
    },
    {
      code: 'ENTERPRISE',
      name: 'Gran Concesionaria',
      priceMonthly: 499,
      maxVehicles: 9999,
      maxLocations: 20,
      maxUsers: 50,
      features: ['crm_leads', 'multi_location', 'trade_ins', 'print_contracts', 'advanced_costing', 'api_access', 'custom_domain'],
    },
  ];

  for (const p of plansData) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }

  // 2. SUPERADMIN MAESTRO DE NANOLABS
  console.log('2. Creando SuperAdmin maestro de plataforma...');
  const superAdminEmail = 'desa@nanolabs.com.ar';
  const superAdminPasswordHash = await hashUserPassword('Nanolabs2026!');

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      isSuperAdmin: true,
      name: 'Desarrollador NanoLabs',
    },
    create: {
      email: superAdminEmail,
      name: 'Desarrollador NanoLabs',
      passwordHash: superAdminPasswordHash,
      isSuperAdmin: true,
    },
  });

  // 3. TENANT INICIAL: "demo" (Concesionaria Demo)
  console.log('3. Creando Tenant Inicial "demo"...');
  const proPlan = await prisma.plan.findUnique({ where: { code: 'PRO' } });

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {
      name: 'OnlyCars Concesionaria Modelo',
      status: 'ACTIVE',
    },
    create: {
      id: 'tenant_demo',
      slug: 'demo',
      name: 'OnlyCars Concesionaria Modelo',
      status: 'ACTIVE',
      email: 'demo@onlycars.nanoapps.ar',
      phone: '+54 11 4000-8888',
      address: 'Av. del Libertador 3500',
      city: 'Buenos Aires',
      cuit: '30-71829304-8',
    },
  });

  // Dominio base de plataforma
  const baseDomain = process.env.BASE_DOMAIN || 'onlycars.nanoapps.ar';
  await prisma.tenantDomain.upsert({
    where: { hostname: `demo.${baseDomain}` },
    update: {},
    create: {
      tenantId: tenant.id,
      hostname: `demo.${baseDomain}`,
      isPrimary: true,
    },
  });

  // Dominio base de plataforma como dominio directo
  await prisma.tenantDomain.upsert({
    where: { hostname: baseDomain },
    update: {},
    create: {
      tenantId: tenant.id,
      hostname: baseDomain,
      isPrimary: false,
    },
  });

  // Dominio localhost para desarrollo
  await prisma.tenantDomain.upsert({
    where: { hostname: 'localhost' },
    update: {},
    create: {
      tenantId: tenant.id,
      hostname: 'localhost',
      isPrimary: false,
    },
  });

  // Suscripción
  const periodEnd = new Date();
  periodEnd.setFullYear(periodEnd.getFullYear() + 1);

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {
      status: 'ACTIVE',
      planId: proPlan.id,
      currentPeriodEnd: periodEnd,
    },
    create: {
      tenantId: tenant.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    },
  });

  // Sucursal inicial
  const location = await prisma.location.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'central' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Casa Central',
      code: 'central',
      address: 'Av. del Libertador 3500',
      isMain: true,
    },
  });

  // Configuración de concesionaria
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {
      appName: 'OnlyCars Concesionaria Modelo',
      dolarActual: 1430,
    },
    create: {
      tenantId: tenant.id,
      appName: 'OnlyCars Concesionaria Modelo',
      primaryColor: '#2563eb',
      secondaryColor: '#0f172a',
      dolarActual: 1430,
      tipoDolar: 'blue',
      tnaFinanciacion: 48.0,
      telefonoContacto: '+54 11 4000-8888',
      direccion: 'Av. del Libertador 3500, CABA',
    },
  });

  // Usuario Admin del Tenant
  const adminDealerEmail = 'admin@carshop.com';
  const adminDealerPasswordHash = await hashUserPassword('123456');

  const dealerAdmin = await prisma.user.upsert({
    where: { email: adminDealerEmail },
    update: {},
    create: {
      email: adminDealerEmail,
      name: 'Director General',
      passwordHash: adminDealerPasswordHash,
      isSuperAdmin: false,
    },
  });

  await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: dealerAdmin.id } },
    update: { role: 'OWNER' },
    create: {
      tenantId: tenant.id,
      userId: dealerAdmin.id,
      role: 'OWNER',
      locationId: location.id,
    },
  });

  // 4. MIGRACIÓN DE DATOS DESDE database.json HACIA EL TENANT DEMO
  const rutaJson = path.join(process.cwd(), 'prisma', 'database.json');
  if (fs.existsSync(rutaJson)) {
    console.log('4. Importando datos existentes de database.json al tenant demo...');
    const db = JSON.parse(fs.readFileSync(rutaJson, 'utf-8'));

    // Clientes
    if (Array.isArray(db.clientes)) {
      console.log(`- Importando ${db.clientes.length} clientes...`);
      for (const c of db.clientes) {
        await prisma.cliente.upsert({
          where: { id_cliente: c.id_cliente },
          update: {},
          create: {
            id_cliente: c.id_cliente,
            tenantId: tenant.id,
            nombre_completo: c.nombre_completo || 'Cliente Sin Nombre',
            dni: c.dni && String(c.dni).trim() !== '' ? String(c.dni).trim() : null,
            telefono: c.telefono ? String(c.telefono) : null,
            email: c.email ? String(c.email) : null,
            domicilio: c.domicilio ? String(c.domicilio) : null,
          },
        });
      }
    }

    // Vehículos
    if (Array.isArray(db.vehiculos)) {
      console.log(`- Importando ${db.vehiculos.length} vehículos...`);
      for (const v of db.vehiculos) {
        const precioCompraUsd = parseNum(v.precio_compra_usd);
        const precioVentaUsd = parseNum(v.precio_venta_usd);
        const precioCompraArs = parseNum(v.precio_compra_ars);
        const precioVentaArs = parseNum(v.precio_venta_ars);

        await prisma.vehiculo.upsert({
          where: { id_vehiculo: v.id_vehiculo },
          update: {},
          create: {
            id_vehiculo: v.id_vehiculo,
            tenantId: tenant.id,
            locationId: location.id,
            marca: safeString(v.marca) || 'Sin Marca',
            modelo: safeString(v.modelo) || 'Sin Modelo',
            anio: v.anio ? parseInt(v.anio) : null,
            patente: v.patente ? String(v.patente).toUpperCase().trim() : null,
            km: v.km ? parseInt(v.km) : null,
            motor: v.motor ? String(v.motor) : null,
            vin: v.vin ? String(v.vin) : null,
            color: v.color ? String(v.color) : null,
            combustible: v.combustible ? String(v.combustible) : 'Nafta',
            transmision: v.transmision ? String(v.transmision) : 'Manual',
            tipo_vehiculo: v.tipo_vehiculo || 'Auto',
            tipo_ingreso: v.tipo_ingreso || 'Propio',
            estado: mapEstadoVehiculo(v.estado),
            precio_compra_usd: precioCompraUsd,
            precio_compra_ars: precioCompraArs,
            precio_venta_usd: precioVentaUsd,
            precio_venta_ars: precioVentaArs,
            costo_total_real_usd: precioCompraUsd,
            fecha_ingreso: safeDate(v.fecha_ingreso),
            id_cliente: v.id_cliente ? parseInt(v.id_cliente) : null,
          },
        });
      }
    }

    // Ventas
    if (Array.isArray(db.ventas)) {
      console.log(`- Importando ${db.ventas.length} ventas...`);
      for (const v of db.ventas) {
        const formaPago = safeString(v.forma_pago).toLowerCase().includes('cuota') ? FormaPago.Cuotas : FormaPago.Contado;

        await prisma.venta.upsert({
          where: { id_venta: v.id_venta },
          update: {},
          create: {
            id_venta: v.id_venta,
            tenantId: tenant.id,
            locationId: location.id,
            id_vehiculo: v.id_vehiculo,
            id_cliente: v.id_cliente,
            precio_final_usd: parseNum(v.precio_final_usd),
            cotizacion_dolar_venta: parseNum(v.cotizacion_dolar_venta) || 1430,
            forma_pago: formaPago,
            fecha_venta: safeDate(v.fecha_venta),
            numero_boleto: `BOL-HIST-${String(v.id_venta).padStart(4, '0')}`,
          },
        });
      }
    }

    // Venta Cuotas
    if (Array.isArray(db.venta_cuotas)) {
      console.log(`- Importando ${db.venta_cuotas.length} cuotas de venta...`);
      for (const c of db.venta_cuotas) {
        await prisma.ventaCuota.upsert({
          where: { id_cuota: c.id_cuota },
          update: {},
          create: {
            id_cuota: c.id_cuota,
            tenantId: tenant.id,
            id_venta: c.id_venta,
            numero_cuota: parseInt(c.numero_cuota) || 1,
            monto_usd: parseNum(c.monto_usd),
            fecha_vencimiento: safeDate(c.fecha_vencimiento),
            estado: safeString(c.estado).toUpperCase() || 'PENDIENTE',
            monto_pagado_ars: c.monto_pagado_ars ? parseNum(c.monto_pagado_ars) : null,
            cotizacion_pago: c.cotizacion_pago ? parseNum(c.cotizacion_pago) : null,
            fecha_pago: c.fecha_pago ? safeDate(c.fecha_pago) : null,
          },
        });
      }
    }
  }

  console.log('--- ✅ Seed SaaS Completado Exitosamente ---');
  console.log('Credenciales creadas:');
  console.log('1. SuperAdmin NanoLabs: desa@nanolabs.com.ar / Nanolabs2026!');
  console.log('2. Admin Concesionaria Demo: admin@carshop.com / 123456');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
