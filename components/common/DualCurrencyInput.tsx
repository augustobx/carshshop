'use client';

import { Banknote, DollarSign } from 'lucide-react';
import { useEffect, useRef } from 'react';

type DualCurrencyInputProps = {
  label: string;
  ars: string;
  usd: string;
  rate: number;
  onChange: (values: { ars: string; usd: string }) => void;
  required?: boolean;
  disabled?: boolean;
  helper?: string;
  arsPlaceholder?: string;
  usdPlaceholder?: string;
};

function parseAmount(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function moneyInput(value: number) {
  return Number(value.toFixed(2)).toString();
}

export default function DualCurrencyInput({
  label,
  ars,
  usd,
  rate,
  onChange,
  required = false,
  disabled = false,
  helper,
  arsPlaceholder = 'Monto en pesos',
  usdPlaceholder = 'Monto en dólares',
}: DualCurrencyInputProps) {
  const lastEdited = useRef<'ARS' | 'USD'>('ARS');
  const previousRate = useRef(Number(rate || 0));
  const safeRate = Number(rate || 0);

  const syncFromArs = (value: string) => {
    lastEdited.current = 'ARS';
    const parsed = parseAmount(value);
    onChange({
      ars: value,
      usd: parsed !== null && safeRate > 0 ? moneyInput(parsed / safeRate) : '',
    });
  };

  const syncFromUsd = (value: string) => {
    lastEdited.current = 'USD';
    const parsed = parseAmount(value);
    onChange({
      usd: value,
      ars: parsed !== null && safeRate > 0 ? moneyInput(parsed * safeRate) : '',
    });
  };

  // Si cambia la cotización mientras el formulario está abierto, recalculamos la moneda derivada.
  useEffect(() => {
    if (safeRate <= 0 || previousRate.current === safeRate) return;
    previousRate.current = safeRate;

    if (lastEdited.current === 'USD') {
      const parsedUsd = parseAmount(usd);
      if (parsedUsd !== null) onChange({ usd, ars: moneyInput(parsedUsd * safeRate) });
      return;
    }

    const parsedArs = parseAmount(ars);
    if (parsedArs !== null) onChange({ ars, usd: moneyInput(parsedArs / safeRate) });
  }, [safeRate]); // intencional: sólo reacciona al cambio de cotización

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-black text-slate-600 uppercase tracking-wider">
        {label}{required ? ' *' : ''}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pesos (ARS)</span>
          <div className="relative mt-1">
            <Banknote className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="number"
              step="any"
              min="0"
              required={required}
              disabled={disabled}
              value={ars}
              onChange={(e) => syncFromArs(e.target.value)}
              placeholder={arsPlaceholder}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dólares (USD)</span>
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
            <input
              type="number"
              step="any"
              min="0"
              required={required}
              disabled={disabled}
              value={usd}
              onChange={(e) => syncFromUsd(e.target.value)}
              placeholder={usdPlaceholder}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
        </label>
      </div>
      <p className="text-[11px] text-slate-400">
        {helper || `Conversión automática con cotización $ ${safeRate.toLocaleString('es-AR')}. Podés editar cualquiera de las dos monedas.`}
      </p>
    </fieldset>
  );
}
