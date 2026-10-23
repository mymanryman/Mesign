# Mesign

Teckenspråksträning på svenska. En PWA som visar tecken från
[Svenskt teckenspråkslexikon](https://teckensprakslexikon.su.se/) och låter dig öva på tre sätt:

- **Bläddra och lär:** se tecknen för orden i de ämnen du valt.
- **Teckna själv:** du får ett ord, tecknar själv (gärna med kameran som spegel) och jämför med rätt tecken.
- **Vad betyder tecknet?:** du ser ett tecken och skriver, eller väljer, vad det betyder.

Progressionen sparas i webbläsaren och ord du missar kommer tillbaka oftare. Man byter tecken genom att svajpa.

Under **Mina ordlistor** kan du logga in med Google och skriva in egna ord. Tryck sedan på **Uppdatera nu**
och **Run workflow** i GitHub. Bygget slår upp orden med lexikonets sökning, hämtar videorna och deployar.
Varje lista blir ett eget ämne som bara du ser.

## Kom igång

```bash
npm install
npm run import          # hämtar tecken och videor till public/ (kräver nätverk till lexikonet)
npm run dev
```

Ämnen och önskade ord står i [`scripts/topics.json`](scripts/topics.json). Ändra där och kör importen igen.

## Deploy

Appen deployas till Firebase Hosting (projekt `mesign-e00eb`) från GitHub Actions:

- varje pull request får en förhandsvisningslänk som gäller i 7 dagar,
- varje push till `main` går ut live.

Det kräver att repot har hemligheten `FIREBASE_SERVICE_ACCOUNT_MESIGN_E00EB` med en servicekontonyckel
(JSON) för Firebase-projektet. Enklast skapas den med `firebase init hosting:github`.

### Firebase-inställningar för ordlistor

- Firestore ska vara aktiverat, med reglerna i [`firestore.rules`](firestore.rules) inklistrade under Firestore > Regler.
- Inloggning med Google ska vara aktiverad under Authentication.
- Tjänstkontot i hemligheten behöver rollen Cloud Datastore User för att läsa listorna. Rollen Firebase Authentication Admin
  behövs också om inloggning ska fungera i förhandsvisningar. Annars fungerar den bara på den publicerade appen.

## Licens

Tecknen kommer från Svenskt teckenspråkslexikon, Stockholms universitet, och används enligt
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.sv). Mesign är icke-kommersiell
och delas under samma licens.
