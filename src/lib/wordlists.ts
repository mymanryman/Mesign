import type { Catalog } from './types';

export const MAX_WORDS = 100;
export const MAX_NAME_LENGTH = 60;
/** Hur ofta bygget letar efter nya listor. Ska stämma med schemat i .github/workflows/deploy.yml. */
export const UPDATE_INTERVAL_TEXT = 'inom en timme';

export type WordList = {
  id: string;
  name: string;
  words: string[];
  status: 'pending' | 'done';
  notFound?: string[];
  signCount?: number;
};

/** Delar upp inklistrad text i ord: ett per rad eller kommaseparerat, utan dubbletter. */
export function parseWordList(text: string): string[] {
  const words: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/[\n,;]/)) {
    const word = raw.trim().replace(/\s+/g, ' ');
    const key = word.toLocaleLowerCase('sv-SE');
    if (word && !seen.has(key)) {
      seen.add(key);
      words.push(word);
    }
  }
  return words;
}

export function topicIdForList(listId: string): string {
  return `lista-${listId}`;
}

/** Tar bort andras ordlistor ur katalogen, och tecken som bara finns i dem. */
export function visibleCatalog(catalog: Catalog, uid: string | null): Catalog {
  const topics = catalog.topics.filter((t) => !t.ownerUid || t.ownerUid === uid);
  if (topics.length === catalog.topics.length) return catalog;
  const visible = new Set(topics.map((t) => t.id));
  const signs = catalog.signs
    .filter((s) => s.topicIds.some((t) => visible.has(t)))
    .map((s) => ({ ...s, topicIds: s.topicIds.filter((t) => visible.has(t)) }));
  return { ...catalog, topics, signs };
}
