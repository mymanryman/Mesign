#!/usr/bin/env node
// Lägger till egna ordlistor från Firestore (users/{uid}/wordLists/{listId}) ovanpå de fasta ämnena
// och skriver public/data/catalog.json. Varje ord slås upp med lexikonets sökning.
//
// Miljövariabler:
//   FIREBASE_SERVICE_ACCOUNT  tjänstkontots JSON-nyckel. Saknas den hoppas ordlistorna över.
//   WRITE_STATUS=true         skriv tillbaka status och ord som inte hittades till Firestore.
//                             Sätts bara när bygget deployar till produktion.
//
// Kör: npm run import-wordlists (efter npm run import-signs)

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { baseCatalogPath, dataDir, fetchSign, fetchText } from './fetching.mjs';
import { LEXICON_ORIGIN, findExactMatch, parseCategoryPage } from './lexicon.mjs';

const MAX_WORDS = 100;

async function readLists() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) {
    console.log('Ingen FIREBASE_SERVICE_ACCOUNT, hoppar över egna ordlistor.');
    return [];
  }
  const { cert, initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const credentials = JSON.parse(json);
  initializeApp({ credential: cert(credentials), projectId: credentials.project_id });
  const snapshot = await getFirestore().collectionGroup('wordLists').get();
  return snapshot.docs.map((doc) => ({ doc, uid: doc.ref.parent.parent.id, ...doc.data() }));
}

async function main() {
  let catalog;
  try {
    catalog = JSON.parse(await readFile(baseCatalogPath, 'utf8'));
  } catch {
    throw new Error(`Hittar inte ${baseCatalogPath}. Kör npm run import-signs först.`);
  }
  const signs = new Map(catalog.signs.map((s) => [s.id, s]));
  let lists = [];
  try {
    lists = await readLists();
  } catch (err) {
    // T.ex. om Firestore inte är aktiverat än. De fasta ämnena ska ändå kunna deployas.
    console.log(`::warning::Kunde inte läsa ordlistor från Firestore: ${err.message}`);
  }
  const writeStatus = process.env.WRITE_STATUS === 'true';

  for (const [i, list] of lists.entries()) {
    const topicId = `lista-${list.doc.id}`;
    const words = (Array.isArray(list.words) ? list.words : []).slice(0, MAX_WORDS);
    const notFound = [];
    let count = 0;
    for (const word of words) {
      const html = await fetchText(`${LEXICON_ORIGIN}/sok?q=${encodeURIComponent(word)}`);
      const match = findExactMatch(parseCategoryPage(html), word);
      if (!match) {
        notFound.push(word);
        continue;
      }
      const existing = signs.get(match.id);
      if (existing) {
        if (!existing.topicIds.includes(topicId)) existing.topicIds.push(topicId);
        count++;
        continue;
      }
      const sign = await fetchSign(match, [topicId]);
      if (sign) {
        signs.set(sign.id, sign);
        count++;
      } else {
        notFound.push(word);
      }
    }
    console.log(`Ordlista "${list.name}": ${count} av ${words.length} ord hittades${notFound.length ? ` (saknas: ${notFound.join(', ')})` : ''}`);
    catalog.topics.push({ id: topicId, name: String(list.name ?? 'Min lista'), order: 1000 + i, ownerUid: list.uid });
    if (writeStatus) {
      const { FieldValue } = await import('firebase-admin/firestore');
      await list.doc.ref.update({ status: 'done', notFound, signCount: count, importedAt: FieldValue.serverTimestamp() });
    }
  }

  catalog.signs = [...signs.values()];
  catalog.generatedAt = new Date().toISOString();
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Katalog: ${catalog.signs.length} tecken i ${catalog.topics.length} ämnen.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
