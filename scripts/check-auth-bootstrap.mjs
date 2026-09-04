import crypto from 'crypto';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';

const scryptAsync = promisify(crypto.scrypt);
const prisma = new PrismaClient();

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta variable requerida ${name}`);
  return value;
}

async function verifyUserPassword(password, storedHash) {
  if (!storedHash?.startsWith('scrypt$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  const actual = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

async function main() {
  const superAdminEmail = requiredEnv('SEED_SUPERADMIN_EMAIL').toLowerCase();
  const superAdminPassword = requiredEnv('SEED_SUPERADMIN_PASSWORD');
  const dealerAdminEmail = requiredEnv('SEED_DEMO_ADMIN_EMAIL').toLowerCase();
  const dealerAdminPassword = requiredEnv('SEED_DEMO_ADMIN_PASSWORD');

  const [superAdmin, dealerAdmin, demoTenant] = await Promise.all([
    prisma.user.findUnique({ where: { email: superAdminEmail } }),
    prisma.user.findUnique({ where: { email: dealerAdminEmail } }),
    prisma.tenant.findUnique({ where: { slug: 'demo' } }),
  ]);

  if (!superAdmin || !superAdmin.isSuperAdmin) {
    throw new Error('AUTH_CHECK_FAILED: SuperAdmin inexistente o sin privilegios.');
  }
  if (!(await verifyUserPassword(superAdminPassword, superAdmin.passwordHash))) {
    throw new Error('AUTH_CHECK_FAILED: contraseña de SuperAdmin no coincide con su hash.');
  }

  if (!dealerAdmin || dealerAdmin.isSuperAdmin) {
    throw new Error('AUTH_CHECK_FAILED: Admin demo inexistente o con rol global incorrecto.');
  }
  if (!(await verifyUserPassword(dealerAdminPassword, dealerAdmin.passwordHash))) {
    throw new Error('AUTH_CHECK_FAILED: contraseña de Admin demo no coincide con su hash.');
  }
  if (!demoTenant) {
    throw new Error('AUTH_CHECK_FAILED: tenant demo inexistente.');
  }

  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId: demoTenant.id,
        userId: dealerAdmin.id,
      },
    },
  });

  if (!membership || !membership.isActive || membership.role !== 'OWNER') {
    throw new Error('AUTH_CHECK_FAILED: membresía OWNER del Admin demo inválida.');
  }

  console.log('--- ✅ Auth bootstrap verificado ---');
  console.log(`SuperAdmin OK: ${superAdminEmail}`);
  console.log(`Demo Admin OWNER OK: ${dealerAdminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
