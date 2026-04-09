import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utilidad para Tailwind (Shadcn)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utilidad Global: Normalización Bimonetaria (Prioridad ARS)
export function normalizePair(usd: number, ars: number, dolar: number) {
  let finalUsd = Number(usd) || 0;
  let finalArs = Number(ars) || 0;

  if (finalArs > 0 && dolar > 0) {
    finalUsd = finalArs / dolar;
  } else if (finalUsd > 0 && dolar > 0) {
    finalArs = finalUsd * dolar;
  }
  return { usd: finalUsd, ars: finalArs };
}

// Utilidad Global: Formateo de Moneda
export function formatMoney(amount: number, currency: 'USD' | 'ARS' = 'USD') {
  return amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}