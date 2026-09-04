import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .split(':')[0];

const tenantBaseDomain = normalize(process.env.TENANT_BASE_DOMAIN) || 'nanoapps.ar';
const platformHost = normalize(process.env.PLATFORM_HOST) || 'onlycars.nanoapps.ar';

async function main() {
  console.log('--- Corrigiendo dominios de tenants OnlyCars ---');
  console.log(`Plataforma: ${platformHost}`);
  console.log(`Tenants: <slug>.${tenantBaseDomain}`);

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      slug: true,
      domains: {
        select: { id: true, hostname: true, isCustom: true, isPrimary: true },
      },
    },
  });

  for (const tenant of tenants) {
    const desiredHostname = `${tenant.slug}.${tenantBaseDomain}`;
    const existingDesired = await prisma.tenantDomain.findUnique({
      where: { hostname: desiredHostname },
    });

    if (existingDesired && existingDesired.tenantId !== tenant.id) {
      throw new Error(`DOMAIN_CONFLICT: ${desiredHostname} pertenece a otro tenant.`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.tenantDomain.updateMany({
        where: { tenantId: tenant.id },
        data: { isPrimary: false },
      });

      await tx.tenantDomain.upsert({
        where: { hostname: desiredHostname },
        update: {
          tenantId: tenant.id,
          isPrimary: true,
          isCustom: false,
          verifiedAt: null,
        },
        create: {
          tenantId: tenant.id,
          hostname: desiredHostname,
          isPrimary: true,
          isCustom: false,
        },
      });

      const legacyHosts = [
        platformHost,
        `${tenant.slug}.${platformHost}`,
        tenantBaseDomain,
      ].filter((host) => host !== desiredHostname);

      await tx.tenantDomain.deleteMany({
        where: {
          tenantId: tenant.id,
          isCustom: false,
          hostname: { in: legacyHosts },
        },
      });
    });

    console.log(`OK ${tenant.slug} -> ${desiredHostname}`);
  }

  const reservedPlatformDomain = await prisma.tenantDomain.findUnique({
    where: { hostname: platformHost },
  });

  if (reservedPlatformDomain) {
    await prisma.tenantDomain.delete({ where: { id: reservedPlatformDomain.id } });
    console.log(`Eliminado dominio de plataforma asignado a tenant: ${platformHost}`);
  }

  console.log('--- Dominios de tenants normalizados correctamente ---');
}

main()
  .catch((error) => {
    console.error('Error corrigiendo dominios:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
