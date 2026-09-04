type DualMoneyProps = {
  ars?: number | string | null;
  usd?: number | string | null;
  rate?: number | string | null;
  primary?: 'ARS' | 'USD';
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  showLabels?: boolean;
  compact?: boolean;
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function format(value: number, maxDigits = 0) {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  });
}

export default function DualMoney({
  ars,
  usd,
  rate,
  primary = 'ARS',
  className = '',
  primaryClassName = 'font-black text-slate-900',
  secondaryClassName = 'text-xs font-semibold text-slate-500',
  showLabels = true,
  compact = false,
}: DualMoneyProps) {
  const parsedRate = toNumber(rate);
  let arsValue = toNumber(ars);
  let usdValue = toNumber(usd);

  if (arsValue === null && usdValue !== null && parsedRate && parsedRate > 0) {
    arsValue = usdValue * parsedRate;
  }
  if (usdValue === null && arsValue !== null && parsedRate && parsedRate > 0) {
    usdValue = arsValue / parsedRate;
  }

  const arsText = arsValue === null ? '—' : `$ ${format(arsValue)}`;
  const usdText = usdValue === null ? '—' : `U$S ${format(usdValue, 2)}`;
  const primaryText = primary === 'ARS' ? arsText : usdText;
  const secondaryText = primary === 'ARS' ? usdText : arsText;
  const primaryLabel = primary === 'ARS' ? 'ARS' : 'USD';
  const secondaryLabel = primary === 'ARS' ? 'USD' : 'ARS';

  return (
    <div className={`${compact ? 'leading-tight' : 'space-y-0.5'} ${className}`}>
      <div className={primaryClassName}>
        {primaryText}{showLabels && primaryText !== '—' ? ` ${primaryLabel}` : ''}
      </div>
      <div className={secondaryClassName}>
        {secondaryText}{showLabels && secondaryText !== '—' ? ` ${secondaryLabel}` : ''}
      </div>
    </div>
  );
}
