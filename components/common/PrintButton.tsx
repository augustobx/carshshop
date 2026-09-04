'use client';

import { Printer } from 'lucide-react';

export default function PrintButton({ label = 'Imprimir', className = '' }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className || 'bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-colors'}
    >
      <Printer className="w-4 h-4" /> {label}
    </button>
  );
}
