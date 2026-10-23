import { describe, expect, it } from 'vitest';
import type { Sign } from '../lib/types';
import { buildChoices } from './Practice';

const sign = (word: string): Sign => ({ id: word, word, synonyms: [], topicIds: [], media: { video: '' }, sourceUrl: '' });

describe('buildChoices', () => {
  it('ger rätt ord och tre andra, utan dubbletter', () => {
    const pool = ['hund', 'katt', 'häst', 'ko', 'gris'].map(sign);
    const choices = buildChoices(pool[0], pool, pool);
    expect(choices).toHaveLength(4);
    expect(new Set(choices).size).toBe(4);
    expect(choices).toContain('hund');
  });
  it('fyller på från hela katalogen när ämnet är litet', () => {
    const pool = ['röd', 'blå'].map(sign);
    const all = [...pool, ...['hund', 'katt', 'ko'].map(sign)];
    expect(buildChoices(pool[0], pool, all)).toHaveLength(4);
  });
});
