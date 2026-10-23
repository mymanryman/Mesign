import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Catalog, Mode } from './types';
import { grade, loadProgress, saveProgress, type Grade, type ProgressMap } from './progress';
import { loadSettings, saveSettings, type Settings } from './settings';
import { visibleCatalog } from './wordlists';

type CatalogState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; catalog: Catalog };

type Store = {
  catalog: CatalogState;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  progress: ProgressMap;
  record: (signId: string, result: Grade, mode: Mode) => void;
  resetProgress: () => void;
  /** Inloggad användare. Sparas lokalt så att egna ordlistor visas utan att Firebase behöver laddas. */
  uid: string | null;
  setUid: (uid: string | null) => void;
};

const UID_KEY = 'mesign.uid';

function loadUid(): string | null {
  try {
    return localStorage.getItem(UID_KEY);
  } catch {
    return null;
  }
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children, catalogUrl = '/data/catalog.json' }: { children: ReactNode; catalogUrl?: string }) {
  const [catalog, setCatalog] = useState<CatalogState>({ status: 'loading' });
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [progress, setProgress] = useState<ProgressMap>(loadProgress);
  const [uid, setUidState] = useState<string | null>(loadUid);

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

  const setUid = useCallback((next: string | null) => {
    try {
      if (next) localStorage.setItem(UID_KEY, next);
      else localStorage.removeItem(UID_KEY);
    } catch {
      // Ignoreras, se saveProgress.
    }
    setUidState(next);
  }, []);

  const visible = useMemo<CatalogState>(
    () => (catalog.status === 'ready' ? { status: 'ready', catalog: visibleCatalog(catalog.catalog, uid) } : catalog),
    [catalog, uid],
  );

  const value = useMemo(
    () => ({ catalog: visible, settings, updateSettings, progress, record, resetProgress, uid, setUid }),
    [visible, settings, updateSettings, progress, record, resetProgress, uid, setUid],
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
