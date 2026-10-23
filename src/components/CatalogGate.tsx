import type { ReactNode } from 'react';
import { useStore } from '../lib/store';
import type { Catalog } from '../lib/types';
import { Notice } from './Layout';

export function CatalogGate({ children }: { children: (catalog: Catalog) => ReactNode }) {
  const { catalog } = useStore();
  if (catalog.status === 'loading') return <Notice>Hämtar tecken…</Notice>;
  if (catalog.status === 'error')
    return (
      <Notice>
        <p className="font-medium">Tecknen kunde inte laddas.</p>
        <p className="mt-1 text-sm">{catalog.message}. Kontrollera nätverket och försök igen.</p>
      </Notice>
    );
  return <>{children(catalog.catalog)}</>;
}
