import crypto from 'crypto';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';

const scryptAsync = promisify(crypto.scrypt);
const prisma = new PrismaClient();

async function hashUserPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta variable requerida ${name}`);
  return value;
}

async function main() {
  const superAdminEmail = requiredEnv('SEED_SUPERADMIN_EMAIL').toLowerCase();
  const superAdminPassword = requiredEnv('SEED_SUPERADMIN_PASSWORD');
  const dealerAdminEmail = requiredEnv('SEED_DEMO_ADMIN_EMAIL').toLowerCase();
  const dealerAdminPassword = requiredEnv('SEED_DEMO_ADMIN_PASSWORD');

  const [superAdminHash, dealerAdminHash] = await Promise.all([
    hashUserPassword(superAdminPassword),
    hashUserPassword(dealerAdminPassword),
  ]);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: 'Desarrollador NanoLabs',
      passwordHash: superAdminHash,
      isSuperAdmin: true,
    },
    create: {
      email: superAdminEmail,
      name: 'Desarrollador NanoLabs',
      passwordHash: superAdminHash,
      isSuperAdmin: true,
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' },
    include: { locations: { where: { isMain: true }, take: 1 } },
  });

  if (!tenant) {
    throw new Error('BOOTSTRAP_AUTH_FAILED: tenant demo no existe después del seed.');
  }

  const dealerAdmin = await prisma.user.upsert({
    where: { email: dealerAdminEmail },
    update: {
      name: 'Director General',
      passwordHash: dealerAdminHash,
      isSuperAdmin: false,
    },
    create: {
      email: dealerAdminEmail,
      name: 'Director General',
      passwordHash: dealerAdminHash,
      isSuperAdmin: false,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: dealerAdmin.id,
      },
    },
    update: {
      role: 'OWNER',
      isActive: true,
      locationId: tenant.locations[0]?.id ?? null,
    },
    create: {
      tenantId: tenant.id,
      userId: dealerAdmin.id,
      role: 'OWNER',
      isActive: true,
      locationId: tenant.locations[0]?.id ?? null,
    },
  });

  await prisma.userSession.deleteMany({
    where: { userId: { in: [superAdmin.id, dealerAdmin.id] } },
  });

  console.log('--- Usuarios de acceso verificados ---');
  console.log(`SuperAdmin: ${superAdminEmail}`);
  console.log(`Demo Admin: ${dealerAdminEmail}`);
}

main()
  .catch((error) => {
    console.error('Error verificando usuarios de acceso:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
