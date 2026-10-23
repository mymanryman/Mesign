#!/usr/bin/env node
// Hämtar de fasta ämnena från Svenskt teckenspråkslexikon och skriver .import-cache/base-catalog.json
// samt videor och stillbilder till public/media/signs/. Kör sedan import-wordlists, som lägger till
// egna ordlistor och skriver public/data/catalog.json.
//
// Materialet är licensierat CC BY-NC-SA 4.0. Skriptet hämtar bara de ämnen som står i
// scripts/topics.json, väntar mellan anropen och hoppar över filer som redan finns.
//
// Kör: npm run import-signs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { baseCatalogPath, cacheDir, fetchSign, fetchText, root } from './fetching.mjs';
import { LEXICON_ORIGIN, chooseSigns, parseCategoryPage } from './lexicon.mjs';

const MAX_PAGES = 40;

async function listCategory(category) {
  const all = [];
  const seen = new Set();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const html = await fetchText(`${LEXICON_ORIGIN}/kategori/${category}?page=${page}`);
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
  await mkdir(cacheDir, { recursive: true });

  const signs = new Map();
  const topics = [];
  for (const [order, topic] of config.topics.entries()) {
    const listed = await listCategory(topic.category);
    const chosen = chooseSigns(listed, topic.preferred ?? [], config.maxSignsPerTopic);
    const has = (s, w) => [s.word, ...s.synonyms].some((x) => x.toLowerCase() === w.toLowerCase());
    const missing = (topic.preferred ?? []).filter((w) => !chosen.some((s) => has(s, w)));
    console.log(`${topic.name}: ${listed.length} i lexikonet, ${chosen.length} valda${missing.length ? ` (saknas: ${missing.join(', ')})` : ''}`);
    topics.push({ id: topic.id, name: topic.name, order });

    for (const entry of chosen) {
      const existing = signs.get(entry.id);
      if (existing) {
        existing.topicIds.push(topic.id);
        continue;
      }
      const sign = await fetchSign(entry, [topic.id]);
      if (sign) signs.set(entry.id, sign);
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
  await writeFile(baseCatalogPath, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Klart: ${catalog.signs.length} tecken i ${topics.length} ämnen.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
