import { describe, expect, it } from 'vitest';
import { BOX_INTERVALS, grade, isLearned, pickSigns } from './progress';
import type { Sign } from './types';

const sign = (id: string): Sign => ({ id, word: id, synonyms: [], topicIds: ['t'], media: { video: '' }, sourceUrl: '' });

describe('grade', () => {
  it('flyttar upp vid rätt och ner till låda 1 vid fel', () => {
    const now = 1_000;
    const first = grade(undefined, 'correct', 'produce', now);
    expect(first.box).toBe(2);
    expect(first.nextDue).toBe(now + BOX_INTERVALS[2]);
    const second = grade(first, 'wrong', 'recognize', now);
    expect(second.box).toBe(1);
    expect(second).toMatchObject({ correct: 1, wrong: 1, byMode: { produce: 1, recognize: 1 } });
  });
  it('låter lådan stå kvar vid nästan', () => {
    const p = grade(grade(undefined, 'correct', 'produce'), 'almost', 'produce');
    expect(p.box).toBe(2);
  });
  it('räknar låda 3 och uppåt som inlärt', () => {
    const p = grade(grade(undefined, 'correct', 'produce'), 'correct', 'produce');
    expect(isLearned(p)).toBe(true);
  });
});

describe('pickSigns', () => {
  it('väljer förfallna tecken före nya och nya före sådana som inte ska repeteras än', () => {
    const now = 10 * BOX_INTERVALS[5];
    const signs = [sign('later'), sign('new'), sign('due')];
    const progress = {
      later: { box: 4, nextDue: now + 1000, correct: 3, wrong: 0, byMode: {} },
      due: { box: 1, nextDue: now - 1000, correct: 0, wrong: 2, byMode: {} },
    };
    const picked = pickSigns(signs, progress, 2, now, () => 0.5).map((s) => s.id);
    expect(picked.sort()).toEqual(['due', 'new']);
  });
  it('returnerar högst så många som finns', () => {
    expect(pickSigns([sign('a')], {}, 10)).toHaveLength(1);
  });
});
