import type { Mode, Sign } from './types';

export type Grade = 'correct' | 'almost' | 'wrong';

export type SignProgress = {
  /** 1–5, högre = kan tecknet bättre. */
  box: number;
  /** När tecknet ska repeteras, millisekunder sedan 1970. */
  nextDue: number;
  correct: number;
  wrong: number;
  byMode: Partial<Record<Mode, number>>;
};

export type ProgressMap = Record<string, SignProgress>;

const DAY = 24 * 60 * 60 * 1000;
/** Väntetid innan repetition, per låda. Låda 1 kommer tillbaka direkt. */
export const BOX_INTERVALS = [0, 0, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY];
export const MAX_BOX = 5;

export function grade(prev: SignProgress | undefined, result: Grade, mode: Mode, now = Date.now()): SignProgress {
  const p: SignProgress = prev ?? { box: 1, nextDue: now, correct: 0, wrong: 0, byMode: {} };
  let box = p.box;
  if (result === 'correct') box = Math.min(MAX_BOX, box + 1);
  if (result === 'wrong') box = 1;
  return {
    box,
    nextDue: now + BOX_INTERVALS[box],
    correct: p.correct + (result === 'wrong' ? 0 : 1),
    wrong: p.wrong + (result === 'wrong' ? 1 : 0),
    byMode: { ...p.byMode, [mode]: (p.byMode[mode] ?? 0) + 1 },
  };
}

/**
 * Väljer tecken till en övning. Förfallna tecken med låg låda kommer först, sedan nya tecken,
 * sist de som inte behöver repeteras än. Slumpen avgör inom varje grupp.
 */
export function pickSigns(signs: Sign[], progress: ProgressMap, count: number, now = Date.now(), random = Math.random): Sign[] {
  const scored = signs.map((sign) => {
    const p = progress[sign.id];
    let rank: number;
    if (!p) rank = 10;
    else if (p.nextDue <= now) rank = p.box;
    else rank = 20 + p.box;
    return { sign, rank, tiebreak: random() };
  });
  scored.sort((a, b) => a.rank - b.rank || a.tiebreak - b.tiebreak);
  return shuffle(scored.slice(0, count).map((s) => s.sign), random);
}

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ett tecken räknas som inlärt från låda 3, alltså efter minst två rätt i rad. */
export function isLearned(p: SignProgress | undefined): boolean {
  return !!p && p.box >= 3;
}

const STORAGE_KEY = 'mesign.progress.v1';

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Privat läge eller full lagring: övningen fungerar ändå, men sparas inte.
  }
}
