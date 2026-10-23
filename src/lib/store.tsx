import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Catalog, Mode } from './types';
import { grade, loadProgress, saveProgress, type Grade, type ProgressMap } from './progress';
import { loadSettings, saveSettings, type Settings } from './settings';

type CatalogState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; catalog: Catalog };

type Store = {
  catalog: CatalogState;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  progress: ProgressMap;
  record: (signId: string, result: Grade, mode: Mode) => void;
  resetProgress: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children, catalogUrl = '/data/catalog.json' }: { children: ReactNode; catalogUrl?: string }) {
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' });
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);

  useEffect(() => {
    let cancelled = false;
    fetch(catalogUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Kunde inte hämta tecken (${res.status})`);
        return res.json() as Promise<Catalog>;
      })
      .then((data) => !cancelled && setCatalog({ status: 'ready', catalog: data }))
      .catch((err: Error) => !cancelled && setCatalog({ status: 'error', message: err.message }));
    return () => {
      cancelled = true;
    };
  }, [catalogUrl]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const record = useCallback((signId: string, result: Grade, mode: Mode) => {
    setProgress((prev) => {
      const next = { ...prev, [signId]: grade(prev[signId], result, mode) };
      saveProgress(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    saveProgress({});
    setProgress({});
  }, []);

  const value = useMemo(
    () => ({ catalog, settings, updateSettings, progress, record, resetProgress }),
    [catalog, settings, updateSettings, progress, record, resetProgress],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore måste användas inom StoreProvider');
  return store;
}

/** Tecknen i de valda ämnena, eller alla tecken om inga ämnen är valda. */
export function signsForTopics(catalog: Catalog, topicIds: string[]) {
  if (topicIds.length === 0) return catalog.signs;
  return catalog.signs.filter((s) => s.topicIds.some((t) => topicIds.includes(t)));
}
