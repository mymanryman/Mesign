// Firebase laddas först när någon öppnar Mina ordlistor, så att resten av appen förblir liten.
import type { FirebaseApp } from 'firebase/app';
import type { User } from 'firebase/auth';
import { MAX_NAME_LENGTH, MAX_WORDS, type WordList } from './wordlists';

let appPromise: Promise<FirebaseApp> | null = null;

async function loadConfig(): Promise<Record<string, string>> {
  // Firebase Hosting serverar projektets webbkonfiguration på den här adressen.
  try {
    const res = await fetch('/__/firebase/init.json');
    if (res.ok) return (await res.json()) as Record<string, string>;
  } catch {
    // Faller tillbaka på miljövariabler vid lokal utveckling.
  }
  const env = import.meta.env;
  if (!env.VITE_FIREBASE_API_KEY) throw new Error('Firebase är inte konfigurerat här. Använd den publicerade appen.');
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

function getApp(): Promise<FirebaseApp> {
  appPromise ??= (async () => {
    const [{ initializeApp }, config] = await Promise.all([import('firebase/app'), loadConfig()]);
    // Inloggningen går via appens egen domän, så att Safari inte blockerar den som tredjepartsinnehåll.
    const hosted = /\.(web\.app|firebaseapp\.com)$/.test(location.hostname);
    return initializeApp({ ...config, authDomain: hosted ? location.host : config.authDomain });
  })();
  appPromise.catch(() => (appPromise = null));
  return appPromise;
}

export async function onUserChanged(callback: (user: User | null) => void): Promise<() => void> {
  const [{ getAuth, onAuthStateChanged }, app] = await Promise.all([import('firebase/auth'), getApp()]);
  return onAuthStateChanged(getAuth(app), callback);
}

export async function signIn(): Promise<void> {
  const [{ getAuth, GoogleAuthProvider, signInWithRedirect }, app] = await Promise.all([import('firebase/auth'), getApp()]);
  await signInWithRedirect(getAuth(app), new GoogleAuthProvider());
}

export async function signOut(): Promise<void> {
  const [{ getAuth, signOut: doSignOut }, app] = await Promise.all([import('firebase/auth'), getApp()]);
  await doSignOut(getAuth(app));
}

async function firestore() {
  const [fs, app] = await Promise.all([import('firebase/firestore'), getApp()]);
  return { fs, db: fs.getFirestore(app) };
}

export async function watchWordLists(uid: string, callback: (lists: WordList[]) => void, onError: (e: Error) => void): Promise<() => void> {
  const { fs, db } = await firestore();
  const q = fs.query(fs.collection(db, 'users', uid, 'wordLists'), fs.orderBy('updatedAt', 'desc'));
  return fs.onSnapshot(
    q,
    (snap) =>
      callback(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name ?? ''),
            words: Array.isArray(data.words) ? data.words : [],
            status: data.status === 'done' ? 'done' : 'pending',
            notFound: data.notFound,
            signCount: data.signCount,
          };
        }),
      ),
    onError,
  );
}

/** Sparar en ny lista, eller ändrar en befintlig. Listan väntar sedan på nästa uppdatering. */
export async function saveWordList(uid: string, list: { id?: string; name: string; words: string[] }): Promise<void> {
  const { fs, db } = await firestore();
  const lists = fs.collection(db, 'users', uid, 'wordLists');
  const ref = list.id ? fs.doc(lists, list.id) : fs.doc(lists);
  await fs.setDoc(ref, {
    name: list.name.trim().slice(0, MAX_NAME_LENGTH) || 'Min lista',
    words: list.words.slice(0, MAX_WORDS),
    status: 'pending',
    updatedAt: fs.serverTimestamp(),
  });
}

export async function deleteWordList(uid: string, id: string): Promise<void> {
  const { fs, db } = await firestore();
  await fs.deleteDoc(fs.doc(db, 'users', uid, 'wordLists', id));
}
