import { Link } from 'react-router-dom';
import { CatalogGate } from '../components/CatalogGate';
import { InstallHint } from '../components/InstallHint';
import { Layout } from '../components/Layout';
import { TopicPicker } from '../components/TopicPicker';
import { signsForTopics, useStore } from '../lib/store';

const MODES = [
  { to: '/lar', title: 'Bläddra och lär', text: 'Se tecknen för orden i lugn och ro.' },
  { to: '/ova/teckna', title: 'Teckna själv', text: 'Du får ett ord, tecknar och jämför med rätt tecken.' },
  { to: '/ova/tolka', title: 'Vad betyder tecknet?', text: 'Du ser ett tecken och skriver vad det betyder.' },
];

const COUNTS = [5, 10, 20];

export function Home() {
  const { settings, updateSettings } = useStore();
  return (
    <Layout back={null}>
      <CatalogGate>
        {(catalog) => {
          const available = signsForTopics(catalog, settings.topicIds).length;
          return (
            <div className="space-y-6">
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">1. Välj ämnen</h2>
                <TopicPicker catalog={catalog} />
                <p className="mt-2 text-sm text-slate-500">
                  {settings.topicIds.length === 0 ? 'Inget ämne valt: du övar på alla ' : 'Du övar på '}
                  {available} tecken.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">2. Antal frågor</h2>
                <div className="flex gap-2">
                  {COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={settings.questionCount === n}
                      onClick={() => updateSettings({ questionCount: n })}
                      className={`flex-1 rounded-xl py-2 font-medium ${
                        settings.questionCount === n ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">3. Välj övning</h2>
                <div className="space-y-2">
                  {MODES.map((m) => (
                    <Link
                      key={m.to}
                      to={m.to}
                      className="block rounded-2xl bg-brand-600 p-4 text-white shadow-sm active:bg-brand-700"
                    >
                      <span className="block text-lg font-semibold">{m.title}</span>
                      <span className="text-sm text-brand-50">{m.text}</span>
                    </Link>
                  ))}
                </div>
              </section>

              <InstallHint />

              <footer className="text-center text-xs text-slate-500">
                Tecken från{' '}
                <a className="underline" href={catalog.source.url}>
                  {catalog.source.name}
                </a>{' '}
                ({catalog.source.license}). <Link className="underline" to="/om">Om Mesign</Link>
              </footer>
            </div>
          );
        }}
      </CatalogGate>
    </Layout>
  );
}
