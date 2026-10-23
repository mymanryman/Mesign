import { useState } from 'react';
import { CatalogGate } from '../components/CatalogGate';
import { Layout } from '../components/Layout';
import { SignPlayer } from '../components/SignPlayer';
import { signsForTopics, useStore } from '../lib/store';

export function Browse() {
  const { settings } = useStore();
  const [index, setIndex] = useState(0);
  return (
    <Layout title="Bläddra och lär">
      <CatalogGate>
        {(catalog) => {
          const signs = [...signsForTopics(catalog, settings.topicIds)].sort((a, b) => a.word.localeCompare(b.word, 'sv'));
          if (signs.length === 0) return <p>Inga tecken i de valda ämnena.</p>;
          const i = Math.min(index, signs.length - 1);
          const sign = signs[i];
          return (
            <div className="space-y-4">
              <p className="text-center text-3xl font-semibold">{sign.word}</p>
              <SignPlayer sign={sign} />
              <div className="flex gap-2">
                <button type="button" disabled={i === 0} onClick={() => setIndex(i - 1)} className="flex-1 rounded-xl bg-white py-3 font-medium disabled:opacity-40 dark:bg-slate-900">
                  Föregående
                </button>
                <button
                  type="button"
                  disabled={i === signs.length - 1}
                  onClick={() => setIndex(i + 1)}
                  className="flex-1 rounded-xl bg-white py-3 font-medium disabled:opacity-40 dark:bg-slate-900"
                >
                  Nästa
                </button>
              </div>
              <ul className="flex flex-wrap gap-2" aria-label="Alla ord">
                {signs.map((s, j) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(j)}
                      aria-current={j === i}
                      className={`rounded-full px-3 py-1 text-sm ${j === i ? 'bg-brand-600 text-white' : 'bg-white dark:bg-slate-900'}`}
                    >
                      {s.word}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500">
                <a className="underline" href={sign.sourceUrl}>
                  Se {sign.word} i teckenspråkslexikonet
                </a>
              </p>
            </div>
          );
        }}
      </CatalogGate>
    </Layout>
  );
}
