// Gemensamma hjälpfunktioner för att hämta från Svenskt teckenspråkslexikon med paus mellan anropen.

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEXICON_ORIGIN, parseSignPage } from './lexicon.mjs';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const mediaDir = join(root, 'public/media/signs');
export const dataDir = join(root, 'public/data');
export const cacheDir = join(root, '.import-cache');
/** Katalogen med de fasta ämnena. Ordlistorna läggs till ovanpå den i public/data/catalog.json. */
export const baseCatalogPath = join(cacheDir, 'base-catalog.json');

const DELAY_MS = 250;
const HEADERS = { 'User-Agent': 'Mesign/0.1 (icke-kommersiell träningsapp; https://github.com/mymanryman/Mesign)' };

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchText(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) {
      await sleep(DELAY_MS);
      return res.text();
    }
    if (attempt >= 3) throw new Error(`${res.status} för ${url}`);
    await sleep(1000 * attempt);
  }
}

async function exists(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

async function download(url, path) {
  if (await exists(path)) return;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} för ${url}`);
  await writeFile(path, Buffer.from(await res.arrayBuffer()));
  await sleep(DELAY_MS);
}

/**
 * Hämtar video och stillbild för ett tecken och returnerar dess katalogpost,
 * eller null om tecknet saknar video.
 */
export async function fetchSign({ id, word, synonyms }, topicIds) {
  await mkdir(mediaDir, { recursive: true });
  await mkdir(join(cacheDir, 'signs'), { recursive: true });
  // Ett tecken som redan hämtats behöver inte slås upp igen.
  const cached = join(cacheDir, 'signs', `${id}.json`);
  if ((await exists(cached)) && (await exists(join(mediaDir, `${id}.mp4`)))) {
    return { ...JSON.parse(await readFile(cached, 'utf8')), topicIds };
  }
  const sourceUrl = `${LEXICON_ORIGIN}/ord/${id}`;
  const media = parseSignPage(await fetchText(sourceUrl));
  if (!media.video) {
    console.warn(`  Ingen video för ${word} (${sourceUrl}), hoppar över`);
    return null;
  }
  await download(media.video, join(mediaDir, `${id}.mp4`));
  let poster;
  if (media.poster) {
    await download(media.poster, join(mediaDir, `${id}.jpg`));
    poster = `/media/signs/${id}.jpg`;
  }
  const sign = {
    id,
    word,
    synonyms,
    topicIds,
    media: { video: `/media/signs/${id}.mp4`, ...(poster ? { poster } : {}) },
    sourceUrl,
  };
  await writeFile(cached, JSON.stringify(sign));
  return sign;
}
