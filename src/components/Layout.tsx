import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Layout({ title, back = '/', children }: { title?: string; back?: string | null; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-10" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
      <header className="mb-4 flex items-center gap-3">
        {back !== null && (
          <Link to={back} className="-ml-2 rounded-full px-2 py-1 text-2xl leading-none text-brand-700 dark:text-brand-500" aria-label="Tillbaka">
            ‹
          </Link>
        )}
        <h1 className="text-xl font-semibold">{title ?? 'Mesign'}</h1>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl bg-white p-4 text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-300">{children}</div>;
}
