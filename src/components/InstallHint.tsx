import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** Visar hur man lägger appen på hemskärmen: en knapp på Android, en instruktion på iPhone. */
export function InstallHint() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;
  if (prompt)
    return (
      <button
        type="button"
        onClick={() => void prompt.prompt().then(() => setPrompt(null))}
        className="w-full rounded-xl border border-brand-600 px-4 py-3 font-medium text-brand-700 dark:text-brand-500"
      >
        Lägg Mesign på hemskärmen
      </button>
    );
  if (isIos)
    return (
      <p className="rounded-xl bg-white p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
        Lägg Mesign på hemskärmen: tryck på dela-knappen i Safari och välj <strong>Lägg till på hemskärmen</strong>.
      </p>
    );
  return null;
}
