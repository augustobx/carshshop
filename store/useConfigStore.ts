import { create } from 'zustand';

interface ConfigState {
  dolarBlue: number;
  tipoDolar: string;
  logo: string | null;
  tema: { primary: string, hover: string, ring: string } | null;

  setDolar: (valor: number) => void;
  setTipoDolar: (tipo: string) => void;
  setLogo: (logo: string | null) => void;
  setTema: (tema: any) => void;
  loadConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  dolarBlue: 1000,
  tipoDolar: 'blue',
  logo: null,
  tema: null,

  setDolar: (valor) => set({ dolarBlue: valor }),
  setTipoDolar: (tipo) => set({ tipoDolar: tipo }),
  setLogo: (logo) => set({ logo }),
  setTema: (tema) => set({ tema }),

  loadConfig: async () => {
    // Aquí iría tu lógica actual de carga...
    console.log("Store configurado con logo y tema");
  }
}));