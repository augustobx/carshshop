"use client";

import { useEffect } from "react";
import { useConfigStore } from "../store/useConfigStore";

export function ConfigInitializer() {
  const loadConfig = useConfigStore((state) => state.loadConfig);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return null;
}
