"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "./store";

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    useAppStore.persist.rehydrate();
    return unsub;
  }, []);

  return hydrated;
}
