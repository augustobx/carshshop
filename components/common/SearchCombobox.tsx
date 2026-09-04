'use client';

import { ChevronDown, Search, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

export type SearchComboboxOption = {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
};

type SearchComboboxProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  required?: boolean;
  disabled?: boolean;
  helper?: string;
};

export default function SearchCombobox({
  label,
  value,
  onChange,
  options,
  placeholder = 'Buscar... ',
  emptyText = 'No se encontraron resultados.',
  required = false,
  disabled = false,
  helper,
}: SearchComboboxProps) {
  const selected = options.find((option) => option.value === value) || null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options.slice(0, 80);
    return options
      .filter((option) => `${option.label} ${option.description || ''} ${option.searchText || ''}`.toLowerCase().includes(term))
      .slice(0, 80);
  }, [options, query]);

  const closeSoon = () => {
    blurTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const select = (nextValue: string) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onChange(nextValue);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
        {label}{required ? ' *' : ''}
      </label>

      {selected ? (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-2.5 min-h-11">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{selected.label}</p>
            {selected.description && <p className="text-xs text-slate-500 truncate">{selected.description}</p>}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white"
              title="Cambiar selección"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10" />
          <input
            value={query}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onBlur={closeSoon}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            placeholder={placeholder}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400" />

          {open && !disabled && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
              {filtered.length === 0 ? (
                <div className="px-4 py-5 text-sm text-slate-500 text-center">{emptyText}</div>
              ) : (
                filtered.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(option.value)}
                    className="w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-colors"
                  >
                    <p className="text-sm font-bold text-slate-900">{option.label}</p>
                    {option.description && <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {required && <input tabIndex={-1} aria-hidden="true" value={value} onChange={() => undefined} required className="absolute opacity-0 pointer-events-none w-px h-px" />}
      {helper && <p className="text-[11px] text-slate-400">{helper}</p>}
    </div>
  );
}
