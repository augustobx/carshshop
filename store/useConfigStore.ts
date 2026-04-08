import { create } from "zustand";
import { getConfigData } from "../actions/config";

interface ConfigState {
  dolarBlue: number;
  tna: number;
  setDolarBlue: (val: number) => void;
  setTna: (val: number) => void;
  loadConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  dolarBlue: 1000,
  tna: 0.05,
  setDolarBlue: (val: number) => set({ dolarBlue: val }),
  setTna: (val: number) => set({ tna: val }),
  loadConfig: async () => {
    try {
      const data = await getConfigData();
      set({ 
        dolarBlue: parseFloat(data.dolar_blue),
        tna: parseFloat(data.tna)
      });
    } catch (err) {
      console.error("Failed loading config from server action", err);
    }
  }
}));
