import { create } from 'zustand';

interface ConfigState {
  dolarBlue: number;
  tipoDolar: string;
  setDolar: (valor: number) => void;
  setTipoDolar: (tipo: string) => void;

  // 1. LE AVISAMOS A TYPESCRIPT QUE ESTA FUNCIÓN EXISTE
  loadConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  dolarBlue: 1000, // Valor por defecto
  tipoDolar: 'blue',
  setDolar: (valor) => set({ dolarBlue: valor }),
  setTipoDolar: (tipo) => set({ tipoDolar: tipo }),

  // 2. CREAMOS LA FUNCIÓN REAL
  loadConfig: async () => {
    try {
      // Acá idealmente llamarías a tu base de datos para traer el dólar real.
      // Ejemplo: 
      // const configDB = await obtenerConfiguracion();
      // if (configDB) set({ dolarBlue: configDB.valor_dolar });

      console.log("Configuración inicializada correctamente");
    } catch (error) {
      console.error("Error al cargar la configuración:", error);
    }
  }
}));