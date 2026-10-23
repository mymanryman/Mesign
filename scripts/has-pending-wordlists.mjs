#!/usr/bin/env node
// Skriver "true" om någon egen ordlista i Firestore väntar på tecken, annars "false".
// Används av den schemalagda körningen i .github/workflows/deploy.yml för att hoppa över bygget.
//
// Miljövariabler:
//   FIREBASE_SERVICE_ACCOUNT  tjänstkontots JSON-nyckel. Saknas den skrivs "false".

async function hasPending() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) return false;
  const { cert, initializeApp } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const credentials = JSON.parse(json);
  initializeApp({ credential: cert(credentials), projectId: credentials.project_id });
  // Filtreras här i stället för med where(), som skulle kräva ett eget index för collectionGroup.
  const snapshot = await getFirestore().collectionGroup('wordLists').select('status').get();
  return snapshot.docs.some((doc) => doc.get('status') !== 'done');
}

hasPending()
  .then((pending) => {
    console.error(pending ? 'Det finns ordlistor som väntar.' : 'Inga ordlistor väntar.');
    console.log(pending ? 'true' : 'false');
  })
  .catch((err) => {
    console.error(`::warning::Kunde inte läsa ordlistor från Firestore: ${err.message}`);
    console.log('false');
  });
