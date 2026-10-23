# Mesign

Teckenspråksträning på svenska. En PWA som visar tecken från
[Svenskt teckenspråkslexikon](https://teckensprakslexikon.su.se/) och låter dig öva på tre sätt:

- **Bläddra och lär:** se tecknen för orden i de ämnen du valt.
- **Teckna själv:** du får ett ord, tecknar själv (gärna med kameran som spegel) och jämför med rätt tecken.
- **Vad betyder tecknet?:** du ser ett tecken och skriver, eller väljer, vad det betyder.

Progressionen sparas i webbläsaren och ord du missar kommer tillbaka oftare.

## Kom igång

```bash
npm install
npm run import-signs   # hämtar tecken och videor till public/ (kräver nätverk till lexikonet)
npm run dev
```

Ämnen och önskade ord står i [`scripts/topics.json`](scripts/topics.json). Ändra där och kör importen igen.

## Deploy

Appen deployas till Firebase Hosting (projekt `mesign-e00eb`) från GitHub Actions:

- varje pull request får en förhandsvisningslänk som gäller i 7 dagar,
- varje push till `main` går ut live.

Det kräver att repot har hemligheten `FIREBASE_SERVICE_ACCOUNT_MESIGN_E00EB` med en servicekontonyckel
(JSON) för Firebase-projektet. Enklast skapas den med `firebase init hosting:github`.

## Licens

Tecknen kommer från Svenskt teckenspråkslexikon, Stockholms universitet, och används enligt
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.sv). Mesign är icke-kommersiell
och delas under samma licens.
