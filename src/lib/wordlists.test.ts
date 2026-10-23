import { describe, expect, it } from 'vitest';
import type { Catalog } from './types';
import { parseWordList, visibleCatalog } from './wordlists';

describe('parseWordList', () => {
  it('delar på rader och kommatecken och tar bort dubbletter', () => {
    expect(parseWordList('hund\nKatt, häst\n\n hej  då ;hund')).toEqual(['hund', 'Katt', 'häst', 'hej då']);
  });
});

describe('visibleCatalog', () => {
  const sign = (id: string, topicIds: string[]) => ({ id, word: id, synonyms: [], topicIds, media: { video: '' }, sourceUrl: '' });
  const catalog: Catalog = {
    generatedAt: '',
    source: { name: '', url: '', license: '', licenseUrl: '' },
    topics: [
      { id: 'djur', name: 'Djur', order: 0 },
      { id: 'lista-a', name: 'Min', order: 1000, ownerUid: 'me' },
      { id: 'lista-b', name: 'Annans', order: 1001, ownerUid: 'other' },
    ],
    signs: [sign('hund', ['djur', 'lista-b']), sign('bil', ['lista-b']), sign('sol', ['lista-a'])],
  };
  it('visar bara egna ordlistor', () => {
    const v = visibleCatalog(catalog, 'me');
    expect(v.topics.map((t) => t.id)).toEqual(['djur', 'lista-a']);
    expect(v.signs.map((s) => s.id)).toEqual(['hund', 'sol']);
    expect(v.signs[0].topicIds).toEqual(['djur']);
  });
  it('visar inga ordlistor när ingen är inloggad', () => {
    expect(visibleCatalog(catalog, null).topics.map((t) => t.id)).toEqual(['djur']);
  });
});
