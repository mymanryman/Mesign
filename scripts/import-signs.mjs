#!/usr/bin/env node
// Hämtar tecken från Svenskt teckenspråkslexikon och skriver public/data/catalog.json
// samt videor och stillbilder till public/media/signs/.
//
// Materialet är licensierat CC BY-NC-SA 4.0. Skriptet hämtar bara de ämnen som står i
// scripts/topics.json, väntar mellan anropen och hoppar över filer som redan finns.
//
// Kör: npm run import-signs

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEXICON_ORIGIN, chooseSigns, parseCategoryPage, parseSignPage } from './lexicon.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mediaDir = join(root, 'public/media/signs');
const dataDir = join(root, 'public/data');
const DELAY_MS = 250;
const MAX_PAGES = 40;
const HEADERS = { 'User-Agent': 'Mesign/0.1 (icke-kommersiell träningsapp; https://github.com/mymanryman/Mesign)' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
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

const pageHtml = new Map();

/** Visar var ett saknat ord står i kategorins HTML, så att tolkningen kan felsökas. */
function showContext(category, word, listed) {
  for (const html of pageHtml.get(category) ?? []) {
    const id = html.match(new RegExp(`/ord/(\\d+)"[^>]*>${word}<`))?.[1];
    if (!id) continue;
    const first = html.indexOf(`/ord/${id}`);
    return `id ${id} tolkades som ${JSON.stringify(listed.find((s) => s.id === id))}; första förekomsten: ${html
      .slice(Math.max(0, first - 300), first + 500)
      .replace(/\s+/g, ' ')}`;
  }
  return null;
}

async function listCategory(category) {
  const all = [];
  pageHtml.set(category, []);
  const seen = new Set();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const html = await fetchText(`${LEXICON_ORIGIN}/kategori/${category}?page=${page}`);
    pageHtml.get(category).push(html);
    const fresh = parseCategoryPage(html).filter((s) => !seen.has(s.id));
    if (fresh.length === 0) {
      if (page === 1) throw new Error(`Hittade inga tecken i kategorin "${category}". Har sidans uppbyggnad ändrats?\n${html.slice(0, 2000)}`);
      break;
    }
    fresh.forEach((s) => seen.add(s.id));
    all.push(...fresh);
  }
  return all;
}

async function main() {
  const config = JSON.parse(await readFile(join(root, 'scripts/topics.json'), 'utf8'));
  await mkdir(mediaDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  const signs = new Map();
  const topics = [];
  for (const [order, topic] of config.topics.entries()) {
    const listed = await listCategory(topic.category);
    const chosen = chooseSigns(listed, topic.preferred ?? [], config.maxSignsPerTopic);
    const has = (s, w) => [s.word, ...s.synonyms].some((x) => x.toLowerCase() === w.toLowerCase());
    const missing = (topic.preferred ?? []).filter((w) => !chosen.some((s) => has(s, w)));
    console.log(`  valda: ${chosen.map((s) => s.word).join(', ')}`);
    console.log(`${topic.name}: ${listed.length} i lexikonet, ${chosen.length} valda${missing.length ? ` (saknas: ${missing.join(', ')})` : ''}`);
    for (const word of missing) {
      const context = showContext(topic.category, word, listed);
      if (context) console.log(`  "${word}": ${context}`);
    }
    topics.push({ id: topic.id, name: topic.name, order });

    for (const { id, word, synonyms } of chosen) {
      const existing = signs.get(id);
      if (existing) {
        existing.topicIds.push(topic.id);
        continue;
      }
      const sourceUrl = `${LEXICON_ORIGIN}/ord/${id}`;
      const media = parseSignPage(await fetchText(sourceUrl));
      if (!media.video) {
        console.warn(`  Ingen video för ${word} (${sourceUrl}), hoppar över`);
        continue;
      }
      await download(media.video, join(mediaDir, `${id}.mp4`));
      let poster;
      if (media.poster) {
        await download(media.poster, join(mediaDir, `${id}.jpg`));
        poster = `/media/signs/${id}.jpg`;
      }
      signs.set(id, {
        id,
        word,
        synonyms,
        topicIds: [topic.id],
        media: { video: `/media/signs/${id}.mp4`, ...(poster ? { poster } : {}) },
        sourceUrl,
      });
    }
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    source: {
      name: 'Svenskt teckenspråkslexikon',
      url: LEXICON_ORIGIN,
      license: 'CC BY-NC-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.sv',
    },
    topics,
    signs: [...signs.values()],
  };
  await writeFile(join(dataDir, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Klart: ${catalog.signs.length} tecken i ${topics.length} ämnen.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
