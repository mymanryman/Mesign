import { useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { Layout, Notice } from '../components/Layout';
import { deleteWordList, onUserChanged, saveWordList, signIn, signOut, watchWordLists } from '../lib/firebase';
import { useStore } from '../lib/store';
import { MAX_NAME_LENGTH, MAX_WORDS, parseWordList, topicIdForList, UPDATE_INTERVAL_TEXT, type WordList } from '../lib/wordlists';

type AuthState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; user: User | null };

export function WordLists() {
  const { setUid } = useStore();
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    onUserChanged((user) => {
      setAuth({ status: 'ready', user });
      setUid(user?.uid ?? null);
    })
      .then((u) => (cancelled ? u() : (unsubscribe = u)))
      .catch((e: Error) => setAuth({ status: 'error', message: e.message }));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [setUid]);

  return (
    <Layout title="Mina ordlistor">
      {auth.status === 'loading' && <Notice>Laddar…</Notice>}
      {auth.status === 'error' && <Notice>{auth.message}</Notice>}
      {auth.status === 'ready' && !auth.user && <SignedOut />}
      {auth.status === 'ready' && auth.user && <SignedIn user={auth.user} />}
    </Layout>
  );
}

function SignedOut() {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <p>Skriv in egna ord, så hämtar Mesign tecknen från teckenspråkslexikonet. Varje lista blir ett eget ämne att öva på.</p>
      <p className="text-sm text-slate-500">Du loggar in med Google så att bara du kan ändra dina listor.</p>
      <button
        type="button"
        onClick={() => signIn().catch((e: Error) => setError(e.message))}
        className="w-full rounded-xl bg-brand-600 py-4 text-lg font-semibold text-white"
      >
        Logga in med Google
      </button>
      {error && <p className="text-sm text-rose-700">{error}</p>}
    </div>
  );
}

function SignedIn({ user }: { user: User }) {
  const { catalog } = useStore();
  const [lists, setLists] = useState<WordList[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WordList | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    watchWordLists(user.uid, setLists, (e) => setError(e.message))
      .then((u) => (cancelled ? u() : (unsubscribe = u)))
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user.uid]);

  const topicIds = new Set(catalog.status === 'ready' ? catalog.catalog.topics.map((t) => t.id) : []);
  const pending = lists?.filter((l) => l.status === 'pending') ?? [];
  // Listan är importerad men appen har fortfarande den gamla katalogen.
  const needsReload = lists?.some((l) => l.status === 'done' && !topicIds.has(topicIdForList(l.id))) ?? false;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Inloggad som {user.displayName ?? user.email}.{' '}
        <button type="button" className="underline" onClick={() => void signOut()}>
          Logga ut
        </button>
      </p>

      {pending.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-amber-50 p-4 text-amber-950 dark:bg-amber-900/30 dark:text-amber-100">
          <p className="font-medium">
            {pending.length === 1 ? '1 lista väntar' : `${pending.length} listor väntar`} på att tecknen hämtas.
          </p>
          <p className="text-sm">Mesign hämtar tecknen automatiskt {UPDATE_INTERVAL_TEXT}. Du kan stänga appen så länge.</p>
        </div>
      )}

      {needsReload && (
        <button type="button" onClick={() => location.reload()} className="w-full rounded-xl border border-brand-600 py-3 font-medium text-brand-700 dark:text-brand-500">
          Nya tecken finns. Ladda om appen
        </button>
      )}

      <ListForm key={editing?.id ?? 'new'} uid={user.uid} list={editing} onDone={() => setEditing(null)} />

      {error && <p className="text-sm text-rose-700">{error}</p>}
      {lists === null && !error && <Notice>Hämtar dina listor…</Notice>}
      {lists && lists.length > 0 && (
        <ul className="space-y-2">
          {lists.map((list) => (
            <li key={list.id} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{list.name}</p>
                  <p className="text-sm text-slate-500">
                    {list.words.length} ord ·{' '}
                    {list.status === 'pending' ? 'väntar på tecken' : `${list.signCount ?? 0} tecken hittades`}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button type="button" className="underline" onClick={() => setEditing(list)}>
                    Ändra
                  </button>
                  <button
                    type="button"
                    className="text-rose-700 underline"
                    onClick={() => {
                      if (confirm(`Ta bort listan ${list.name}?`)) deleteWordList(user.uid, list.id).catch((e: Error) => setError(e.message));
                    }}
                  >
                    Ta bort
                  </button>
                </div>
              </div>
              {list.status === 'done' && list.notFound && list.notFound.length > 0 && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Hittades inte i lexikonet: {list.notFound.join(', ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ListForm({ uid, list, onDone }: { uid: string; list: WordList | null; onDone: () => void }) {
  const [name, setName] = useState(list?.name ?? '');
  const [text, setText] = useState(list?.words.join('\n') ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const words = parseWordList(text);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (words.length === 0) return setError('Skriv minst ett ord.');
    if (words.length > MAX_WORDS) return setError(`En lista får ha högst ${MAX_WORDS} ord.`);
    setSaving(true);
    setError(null);
    try {
      await saveWordList(uid, { id: list?.id, name, words });
      setName('');
      setText('');
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <p className="font-medium">{list ? `Ändra ${list.name}` : 'Ny lista'}</p>
      <label className="block text-sm">
        Namn
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Till exempel Jobbet"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-950"
        />
      </label>
      <label className="block text-sm">
        Ord, ett per rad eller kommaseparerade
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          autoCapitalize="none"
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base dark:border-slate-700 dark:bg-slate-950"
        />
      </label>
      <p className="text-xs text-slate-500">{words.length} ord</p>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <div className="flex gap-2">
        {list && (
          <button type="button" onClick={onDone} className="flex-1 rounded-xl bg-slate-100 py-3 font-medium dark:bg-slate-800">
            Avbryt
          </button>
        )}
        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white disabled:opacity-60">
          {saving ? 'Sparar…' : 'Spara lista'}
        </button>
      </div>
    </form>
  );
}
