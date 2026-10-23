import { describe, expect, it } from 'vitest';
import { checkAnswer, levenshtein, normalize } from './answer';

describe('normalize', () => {
  it('tar bort versaler, skiljetecken och extra mellanslag', () => {
    expect(normalize('  Hej  då! ')).toBe('hej då');
    expect(normalize('MÅNDAG')).toBe('måndag');
  });
});

describe('levenshtein', () => {
  it('räknar ändringar', () => {
    expect(levenshtein('katt', 'katt')).toBe(0);
    expect(levenshtein('mamma', 'mama')).toBe(1);
    expect(levenshtein('röd', 'rod')).toBe(1);
  });
});

describe('checkAnswer', () => {
  it('godtar ordet och synonymer', () => {
    expect(checkAnswer('Mamma', 'mamma')).toBe('correct');
    expect(checkAnswer('morsa', 'mamma', ['morsa'])).toBe('correct');
  });
  it('godtar ett stavfel i längre ord', () => {
    expect(checkAnswer('måndg', 'måndag')).toBe('typo');
  });
  it('godtar inte stavfel i korta ord', () => {
    expect(checkAnswer('mer', 'mor')).toBe('wrong');
    expect(checkAnswer('rod', 'röd')).toBe('wrong');
  });
  it('räknar tomt svar som fel', () => {
    expect(checkAnswer('  ', 'hund')).toBe('wrong');
  });
});
