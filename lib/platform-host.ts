function normalizeHost(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').split(':')[0];
}

export function getPlatformHostname(baseUrl: string | undefined): string | null {
  const explicit = normalizeHost(process.env.PLATFORM_HOST);
  if (explicit) return explicit;

  if (!baseUrl) return 'onlycars.nanoapps.ar';
  try {
    return normalizeHost(new URL(baseUrl).hostname) || 'onlycars.nanoapps.ar';
  } catch {
    return 'onlycars.nanoapps.ar';
  }
}

/**
 * Compatibilidad con el helper histórico. BASE_DOMAIN ya no define la plataforma:
 * - PLATFORM_HOST=onlycars.nanoapps.ar
 * - TENANT_BASE_DOMAIN=nanoapps.ar
 */
export function isPlatformHostname(
  domain: string,
  _baseDomain?: string,
  baseUrl?: string
): boolean {
  const cleanDomain = normalizeHost(domain);
  const platformHostname = getPlatformHostname(baseUrl);
  return Boolean(cleanDomain && platformHostname && cleanDomain === platformHostname);
}
