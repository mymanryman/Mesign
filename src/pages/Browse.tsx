import { useEffect, useState } from 'react';
import { CatalogGate } from '../components/CatalogGate';
import { Layout } from '../components/Layout';
import { PreloadVideo, SignPlayer } from '../components/SignPlayer';
import { signsForTopics, useStore } from '../lib/store';
import { useSwipe } from '../lib/swipe';
import type { Sign } from '../lib/types';

export function Browse() {
  const { settings } = useStore();
  return (
    <Layout title="Bläddra och lär">
      <CatalogGate>
        {(catalog) => {
          const signs = [...signsForTopics(catalog, settings.topicIds)].sort((a, b) => a.word.localeCompare(b.word, 'sv'));
          if (signs.length === 0) return <p>Inga tecken i de valda ämnena.</p>;
          return <BrowseView signs={signs} />;
        }}
      </CatalogGate>
    </Layout>
  );
}

function BrowseView({ signs }: { signs: Sign[] }) {
  const [index, setIndex] = useState(0);
  const i = Math.min(index, signs.length - 1);
  const sign = signs[i];
  const hasPrev = i > 0;
  const hasNext = i < signs.length - 1;
  const go = (step: number) => setIndex((current) => Math.max(0, Math.min(signs.length - 1, current + step)));

  const swipe = useSwipe({
    onSwipe: (direction) => go(direction === 'left' ? 1 : -1),
    canSwipe: (direction) => (direction === 'left' ? hasNext : hasPrev),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="space-y-4">
      <div {...swipe.bind} className="select-none space-y-4" data-testid="swipe-area">
        <div className="text-center">
          <p className="text-3xl font-semibold">{sign.word}</p>
          {sign.synonyms.length > 0 && <p className="text-sm text-slate-500">även {sign.synonyms.join(', ')}</p>}
          <p className="text-xs text-slate-400">
            {i + 1} av {signs.length} · svajpa för nästa
          </p>
        </div>
        <SignPlayer sign={sign} />
      </div>
      {hasNext && <PreloadVideo sign={signs[i + 1]} />}
      <div className="flex gap-2">
        <button type="button" disabled={!hasPrev} onClick={() => go(-1)} className="flex-1 rounded-xl bg-white py-3 font-medium disabled:opacity-40 dark:bg-slate-900">
          Föregående
        </button>
        <button type="button" disabled={!hasNext} onClick={() => go(1)} className="flex-1 rounded-xl bg-white py-3 font-medium disabled:opacity-40 dark:bg-slate-900">
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
}
