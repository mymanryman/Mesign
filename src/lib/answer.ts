/** Gör om ett svar till en jämförbar form: gemener, utan skiljetecken och extra mellanslag. */
export function normalize(text: string): string {
  return text
    .toLocaleLowerCase('sv-SE')
    .normalize('NFC')
    .replace(/[.,!?;:"'()\-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export type AnswerResult = 'correct' | 'typo' | 'wrong';

/**
 * Jämför ett skrivet svar med ordet och dess synonymer.
 * Ett stavfel godtas i ord med minst fem bokstäver, så att korta ord som "mor" och "mer" inte blandas ihop.
 */
export function checkAnswer(input: string, word: string, synonyms: string[] = []): AnswerResult {
  const given = normalize(input);
  if (!given) return 'wrong';
  const accepted = [word, ...synonyms].map(normalize);
  if (accepted.includes(given)) return 'correct';
  const closeEnough = accepted.some((a) => a.length >= 5 && levenshtein(given, a) <= 1);
  return closeEnough ? 'typo' : 'wrong';
}
