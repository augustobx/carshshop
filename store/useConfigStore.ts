import { create } from 'zustand';

interface ConfigState {
  dolarBlue: number; // Mantenemos el nombre de la variable para compatibilidad con el resto del sistema
  tipoDolar: string;
  setDolar: (valor: number) => void;
  setTipoDolar: (tipo: string) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  dolarBlue: 1000, // Valor por defecto hasta que cargue la DB
  tipoDolar: 'blue',
  setDolar: (valor) => set({ dolarBlue: valor }),
  setTipoDolar: (tipo) => set({ tipoDolar: tipo })
}));