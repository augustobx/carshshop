'use client';

import Link from 'next/link';
import { Calculator, LayoutGrid, Handshake } from 'lucide-react';

export default function PwaBottomNav({ active }: { active: 'stock' | 'quote' | 'operations' }) {
  const item = (key: 'stock' | 'quote' | 'operations', href: string, label: string, icon: React.ReactNode) => (
    <Link href={href} className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1 ${active === key ? 'text-indigo-600' : 'text-slate-400'}`}>
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-md items-center border-t border-slate-200 bg-white px-3 py-2 pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.04)]">
      {item('stock', '/pwa/dashboard', 'Stock', <LayoutGrid className="h-6 w-6" />)}
      {item('quote', '/pwa/cotizador', 'Cotizar', <Calculator className="h-6 w-6" />)}
      {item('operations', '/pwa/operaciones', 'Operaciones', <Handshake className="h-6 w-6" />)}
    </nav>
  );
}
