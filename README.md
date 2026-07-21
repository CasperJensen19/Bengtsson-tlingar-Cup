# Släktens minigolf-arkiv ⛳

En liten hemsida för att arkivera familjens minigolf-/bangolf-tävlingar. Fyll i
resultat per hål, fota scorekortet och följ statistiken över åren — snitt per
hål på varje bana, flest vinster, banrekord och hole-in-ones.

Sidan är helt statisk (ren HTML/CSS/JavaScript, inga beroenden) och funkar både
lokalt och gratis via **GitHub Pages**.

---

## Innehåll

| Vad | Var |
|-----|-----|
| Startsida & all logik | `index.html`, `assets/` |
| Det gemensamma arkivet (datan alla ser) | `data/archive.js` |

---

## Publicera sidan (GitHub Pages) — engångsjobb

1. Gå till repot på GitHub → **Settings** → **Pages**.
2. Under *Build and deployment* → *Source*: välj **Deploy from a branch**.
3. Välj branch **main** (eller den branch du vill publicera) och mapp **/ (root)**.
   Klicka **Save**.
4. Efter någon minut ligger sidan på
   `https://<ditt-användarnamn>.github.io/<repo-namn>/`.

Alla i familjen kan sedan besöka den länken i mobilen eller på datorn — ingen
behöver ladda ner något eller ha ett konto för att **titta** på arkivet.

> Vill du testa lokalt först: kör `python3 -m http.server` i mappen och öppna
> `http://localhost:8000`. (Att bara dubbelklicka på `index.html` funkar också.)

---

## Så lägger du in en tävling

1. Öppna sidan och klicka **Ny tävling**.
2. Fyll i namn, datum, bana och spelare.
3. Fota scorekortet (bilden sparas med tävlingen) och skriv in slagen per hål.
   Summor och vinnare räknas ut automatiskt.
4. Klicka **Spara**. Tävlingen syns nu direkt — men **bara på din enhet**.

### Dela med familjen (spara i det gemensamma arkivet)

För att alla ska se en ny tävling behöver den sparas i `data/archive.js` och
committas. Appen gör det enkelt:

1. Gå till **Arkiv & synk** på sidan.
2. Klicka **Exportera arkiv** → filen `archive.js` laddas ner.
3. Ersätt `data/archive.js` i repot med den nedladdade filen och committa/pusha.
4. Kom tillbaka till **Arkiv & synk** och klicka **Markera som sparat** för att
   rensa de lokala ändringarna på enheten.

Klart — nu ser hela familjen tävlingen på sidan.

---

## Vill ni att alla ska kunna spara direkt från mobilen?

Med lösningen ovan är det en person (arkivarien) som committar nya resultat.
Vill ni istället att **alla** ska kunna lägga in resultat direkt från sina
telefoner, utan commit, går det att koppla på en gratis molndatabas
(t.ex. Supabase). Datalagret (`assets/js/store.js`) är byggt så att detta kan
läggas till utan att resten av appen skrivs om.

---

## Teknik i korthet

- **Inga beroenden, ingen byggkedja.** Klassisk JavaScript, laddas direkt i
  webbläsaren. Enkelt att hosta och underhålla.
- **Data** ligger i `data/archive.js` som ett vanligt JS-objekt. Nya/ändrade
  tävlingar lagras i webbläsarens `localStorage` tills de exporteras till
  arkivet.
- **Foton** krymps automatiskt i webbläsaren innan de sparas, så filerna hålls
  små.
- **Integritet:** inga cookies, ingen spårning, inga externa anrop.

### Filöversikt

```
index.html            Skal + navigation
assets/css/styles.css Design (mobil-först, mörkt läge stöds)
assets/js/store.js    Datalager (arkiv + lokala ändringar, Supabase-förberett)
assets/js/stats.js    Statistikberäkningar
assets/js/app.js      Router och alla vyer
data/archive.js       Det gemensamma arkivet (incheckad data)
```
