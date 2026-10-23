// Tolkar sidor från Svenskt teckenspråkslexikon (https://teckensprakslexikon.su.se).
// Hålls separat från importskriptet så att tolkningen kan testas utan nätverk.

export const LEXICON_ORIGIN = 'https://teckensprakslexikon.su.se';

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', aring: 'å', auml: 'ä', ouml: 'ö', Aring: 'Å', Auml: 'Ä', Ouml: 'Ö', eacute: 'é' };

export function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name] ?? m);
}

function cleanText(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/**
 * Alla tecken på en kategorisida, i den ordning de visas: [{ id, word, synonyms }].
 * Uppslagsordet kan rymma flera ord ("mamma, mor, morsa") och en notis om varianter.
 */
export function parseCategoryPage(html) {
  const re = /<a\b[^>]*\bhref=["'](?:https?:\/\/teckensprakslexikon\.su\.se)?\/ord\/(\d+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set();
  const signs = [];
  for (const [, id, inner] of html.matchAll(re)) {
    const text = cleanText(inner).replace(/\d+\s+varianter?\s+finns/gi, '');
    const [word, ...synonyms] = text.split(',').map((w) => w.trim()).filter(Boolean);
    // Länkar runt miniatyrbilder saknar text och hoppas över.
    if (!word || seen.has(id)) continue;
    seen.add(id);
    signs.push({ id, word, synonyms });
  }
  return signs;
}

/** Videons och stillbildens adresser på en teckensida. */
export function parseSignPage(html) {
  const movies = [...html.matchAll(/\/movies\/[^"'\s<>]+?\.mp4/g)].map((m) => m[0]);
  const video = movies.find((m) => m.includes('-tecken.mp4')) ?? movies[0];
  const photo =
    html.match(/\/photos\/[^"'\s<>]+?-photo-1-medium\.jpg/)?.[0] ?? html.match(/\/photos\/[^"'\s<>]+?-photo-1\.jpg/)?.[0];
  return {
    video: video ? LEXICON_ORIGIN + video : undefined,
    poster: photo ? LEXICON_ORIGIN + photo : undefined,
  };
}

const key = (word) => word.toLocaleLowerCase('sv-SE');

/**
 * Väljer tecken för ett ämne: först de önskade orden i den ordning de står, sedan övriga
 * tills taket nås. Ett önskat ord kan också vara en synonym ("mor" hittar "mamma, mor").
 * Finns samma ord flera gånger används den första varianten.
 */
export function chooseSigns(listed, preferred, max) {
  const byWord = new Map();
  for (const s of listed) {
    if (!byWord.has(key(s.word))) byWord.set(key(s.word), s);
  }
  const chosen = [];
  for (const word of preferred) {
    const s = byWord.get(key(word)) ?? listed.find((l) => (l.synonyms ?? []).some((w) => key(w) === key(word)));
    if (s && !chosen.includes(s)) chosen.push(s);
  }
  for (const s of byWord.values()) {
    if (chosen.length >= max) break;
    if (!chosen.includes(s)) chosen.push(s);
  }
  return chosen.slice(0, max);
}
