'use client';

import { Banknote, DollarSign } from 'lucide-react';

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
  const syncFromArs = (value: string) => {
    const parsed = Number(value);
    onChange({
      ars: value,
      usd: value && Number.isFinite(parsed) && rate > 0 ? (parsed / rate).toFixed(2) : '',
    });
  };

  const syncFromUsd = (value: string) => {
    const parsed = Number(value);
    onChange({
      usd: value,
      ars: value && Number.isFinite(parsed) && rate > 0 ? (parsed * rate).toFixed(2) : '',
    });
  };

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
        {helper || `Conversión automática con cotización $ ${Number(rate || 0).toLocaleString('es-AR')}. Podés editar cualquiera de las dos monedas.`}
      </p>
    </fieldset>
  );
}
