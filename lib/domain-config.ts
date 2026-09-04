import 'server-only';

function normalizeHost(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').split(':')[0];
}

export function getPlatformHost(): string {
  return normalizeHost(process.env.PLATFORM_HOST) || 'onlycars.nanoapps.ar';
}

export function getTenantBaseDomain(): string {
  return normalizeHost(process.env.TENANT_BASE_DOMAIN) || 'nanoapps.ar';
}

export function buildTenantHostname(slug: string): string {
  const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `${cleanSlug}.${getTenantBaseDomain()}`;
}

export function isPlatformHostname(hostname: string | null | undefined): boolean {
  return normalizeHost(hostname) === getPlatformHost();
}
