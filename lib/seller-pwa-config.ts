export type SellerPwaConfig = {
  showArsPrices: boolean;
  showUsdPrices: boolean;
  showReservationOwner: boolean;
  showCostAndMargin: boolean;
  showNotes: boolean;
  allowCloseSales: boolean;
};

export const DEFAULT_SELLER_PWA_CONFIG: SellerPwaConfig = {
  showArsPrices: true,
  showUsdPrices: true,
  showReservationOwner: true,
  showCostAndMargin: false,
  showNotes: true,
  allowCloseSales: true,
};

export function normalizeSellerPwaConfig(value: unknown): SellerPwaConfig {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  const config: SellerPwaConfig = {
    showArsPrices: typeof source.showArsPrices === 'boolean' ? source.showArsPrices : DEFAULT_SELLER_PWA_CONFIG.showArsPrices,
    showUsdPrices: typeof source.showUsdPrices === 'boolean' ? source.showUsdPrices : DEFAULT_SELLER_PWA_CONFIG.showUsdPrices,
    showReservationOwner: typeof source.showReservationOwner === 'boolean' ? source.showReservationOwner : DEFAULT_SELLER_PWA_CONFIG.showReservationOwner,
    showCostAndMargin: typeof source.showCostAndMargin === 'boolean' ? source.showCostAndMargin : DEFAULT_SELLER_PWA_CONFIG.showCostAndMargin,
    showNotes: typeof source.showNotes === 'boolean' ? source.showNotes : DEFAULT_SELLER_PWA_CONFIG.showNotes,
    allowCloseSales: typeof source.allowCloseSales === 'boolean' ? source.allowCloseSales : DEFAULT_SELLER_PWA_CONFIG.allowCloseSales,
  };

  // La PWA nunca debe quedar sin ninguna moneda visible.
  if (!config.showArsPrices && !config.showUsdPrices) config.showArsPrices = true;
  return config;
}
