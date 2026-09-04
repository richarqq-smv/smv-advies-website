# SMV Advies — Commerciële kwaliteits-/conversiereview

> Dit document staat los van `docs/SEO-ROADMAP.md`. De SEO-roadmap is formeel afgesloten en wordt door dit document niet heropend — dit is een aparte, doorlopende plek voor commerciële kwaliteit, vertrouwen, conversie en UX. Laatst bijgewerkt: 2026-09-04, op basis van de eerste review-fase (zie "Fase-geschiedenis" onderaan).

## Doel

Bepalen welke concrete verbeteringen de website van SMV Advies aantoonbaar duidelijker, geloofwaardiger, overtuigender en commercieel sterker maken — zonder feiten te verzinnen en zonder onnodige wijzigingen. Dit is nadrukkelijk geen SEO-audit: title/meta/canonical/JSON-LD/sitemap/robots zijn hier niet opnieuw beoordeeld (zie `docs/SEO-ROADMAP.md` daarvoor).

## Onderzochte onderdelen

`src/data/company.js`, homepage (`Home.jsx` + alle secties: `Hero`, `UspStrip`, `PricingSection`/`PricingCard`, `EnergieCta`, `HowItWorks`, `RegionalBand`, `CasesSection`, `ClosingCta`), `/pakketten` (`Pakketten.jsx`, `ComparisonTable.jsx`, `DecisionCta.jsx`, `packages.js`, `packageComparison.js`), `/energie-indicatie` (`EnergieIndicatie.jsx`, `EnergieScanTool.jsx`, alle stap-componenten, `useEnergieScan.js`, `ResultsView.jsx`, validatie/berekening in `lib/energieScan/*`), `/contact`, `/cases` + `CaseDetailCard.jsx` + `casesDetailed.js`, homepage-cases (`CaseCard.jsx` + `cases.js`), `/over`, `/werkwijze`, `/faq`, header/footer/mobiele navigatie (`Header.jsx`, `Footer.jsx`, `MobileNav.jsx`, `ContactFab.jsx`, `StickyMobileActions.jsx`, `navigation.js`), gedeelde UI-componenten (`Button.jsx`, `TextField.jsx`, `Badge.jsx`, `ImagePlaceholder.jsx`, `SectionHeading.jsx`, `PageHero.jsx`), en de bestaande analytics/consent-implementatie (niet gewijzigd, alleen gecontroleerd op regressie na de gekozen wijziging).

## Funnel-analyse

**Bezoeker → Begrip → Vertrouwen → Bewijs → Aanbod → CTA → Conversie**

- **Begrip**: binnen het eerste scherm van de homepage is duidelijk wát SMV Advies doet (onafhankelijk verduurzamingsadvies) en voor wélk soort object (bedrijfspand — dat woord filtert consumenten/particulieren vanzelf al uit). De regio (Hoeksche Waard) staat expliciet in de eyebrow. Sterk punt.
- **Vertrouwen**: de onafhankelijkheidspositionering ("geen belang bij installateurs", "verkoopt geen installaties, werkt niet op commissiebasis") komt consistent terug op de homepage, `/over` en `/werkwijze`. Dit is het sterkste vertrouwenselement van de site en wordt nergens tegengesproken.
- **Bewijs**: drie cases met concrete, overgenomen cijfers (bijv. "58% verwachte besparing", "Gasverbruik gehalveerd") — inhoudelijk sterk, maar het enige zichtbare beeldmateriaal was tot deze fase een placeholder die letterlijk "nog te plaatsen" toonde. Dat ondermijnde de bewijskracht van precies de sectie die bewijs moet leveren (zie bevinding 1 hieronder — opgelost).
- **Aanbod**: `/pakketten` legt in één oogopslag drie duidelijk gedifferentieerde pakketten uit (QuickScan op afstand → volledige analyse → volledige ontzorging), met een vergelijkingstabel die per rij aangeeft wat wel/niet is inbegrepen. Geen onduidelijkheid over wat een bezoeker krijgt.
- **CTA**: consistent twee routes door de hele site heen — `/energie-indicatie` (laagdrempelig, gratis) en `/contact` (direct, voor wie al overtuigd is). Geen plek gevonden waar een bezoeker moet raden wat de volgende stap is.
- **Conversie**: de energie-indicatietool is functioneel sterk gebouwd (heldere stappen, goede formuliervalidatie, eerlijke disclaimers, een berekend resultaat direct na stap 4), maar vraagt wel volledige contactgegevens vóórdat er iets wordt getoond — een bekende, bewuste business-afweging (zie bevinding 4, niet gewijzigd).

**20-seconden-test**: een bezoeker die de homepage voor het eerst ziet, begrijpt binnen het eerste scherm wat SMV Advies doet, voor wie, en wat de volgende stap is (twee heldere CTA's). Geen herformulering nodig.

## Bevindingen

### 1. Placeholder-afbeeldingen toonden zichtbaar "nog te plaatsen" aan elke bezoeker — OPGELOST

- **Probleem**: `ImagePlaceholder` (gebruikt in de hero en bij alle 3 cases, zowel op de homepage als op `/cases` — 7 plekken in totaal) toonde de tekst "nog te plaatsen" / "definitieve fotografie volgt" letterlijk aan elke bezoeker, zowel visueel als in de a11y-label.
- **Bewijs**: direct gelezen in `src/data/cases.js`, `src/data/casesDetailed.js` en `src/components/home/Hero.jsx` vóór deze wijziging; bevestigd in eerdere fases (fase 18) als bekend, destijds bewust niet aangepakt.
- **Impact**: hoog. Dit raakt precies de bewijssectie van de site (de cases) én de eerste indruk (de hero) — een bezoeker die zoekt naar geloofwaardigheid ziet in plaats daarvan een letterlijke aankondiging dat de content nog niet af is.
- **Ernst**: middel-hoog — geen technische fout, maar een zelfveroorzaakt vertrouwensprobleem dat zonder enige nieuwe content op te lossen was.
- **Oplossing (uitgevoerd)**: de zichtbare/a11y-tekst noemt nu alleen het onderwerp ("Kantoorpand Oud-Beijerland — voor en na verduurzaming", "Bedrijfspand in de Hoeksche Waard"), zonder productiestatus. Geen foto gefabriceerd, geen claim toegevoegd — puur het weglaten van "dit is nog niet af"-taal die niemand hoeft te zien. De daadwerkelijke fotobehoefte staat nu in codecommentaar en in dit document (zie "Owner input" hieronder), niet meer zichtbaar voor bezoekers.

### 2. Mobiele dubbele floating-CTA's (ContactFab + StickyMobileActions) — bewust NIET aangepast

- **Waarneming**: op mobiel (<1024px) zijn tegelijk zichtbaar: een sticky balk onderaan met "Indicatie" en "Bellen", én een uitklapbare chat-bubble rechtsonder die eveneens "Bellen" (plus "E-mail") aanbiedt. "Bellen" staat dus op twee plekken tegelijk in beeld.
- **Bewijs**: bevestigd via `MainLayout.jsx` (beide componenten renderen altijd samen op mobiel) en een mobiele screenshot uit een eerdere fase.
- **Waarom niet aangepast**: `ContactFab.jsx` bevat een expliciete code-comment dat dit element "kept from the previous site's UX because it tested well as a low-friction contact path" — dat is een signaal van eerdere, waarschijnlijk empirische validatie die ik niet zomaar mag overschrijven op basis van mijn eigen esthetisch oordeel. De opdracht is expliciet: "Niet automatisch veranderen omdat een andere website het anders doet" en "maak geen zakelijke aannames namens de eigenaar." Het bewijs vóór verandering (mijn eigen observatie) weegt hier lichter dan het bewijs vóór behoud (eerdere test). Effort/risico van een wijziging is laag, maar het ontbreekt aan voldoende bewijs om de bestaande, kennelijk geteste keuze te overschrijven.
- **Aanbeveling voor de eigenaar**: als er ooit analytics-data beschikbaar komt over click-through op de chat-bubble versus de sticky balk, kan die data uitwijzen of één van de twee overbodig is.

### 3. Hero noemt de doelgroep niet letterlijk — overwogen, niet aangepast

- **Waarneming**: de hero zegt "Uw bedrijfspand, toekomstbestendig" en "Onafhankelijk advies voor uw bedrijfspand" — dit filtert consumenten al impliciet uit (een particulier heeft geen "bedrijfspand"), maar noemt "mkb-ondernemer" niet letterlijk in de eerste zin.
- **Waarom niet aangepast**: het woord "bedrijfspand" doet dit werk al voldoende; een expliciete toevoeging zou vooral cosmetisch zijn zonder aantoonbaar probleem (geen enkele andere pagina, geen enkele eerdere fase, en geen data wijst op verwarring over de doelgroep). Dit valt onder "reeds goed genoeg" — een wijziging zou giswerk zijn, geen onderbouwde verbetering.

### 4. Energie-indicatie: contactgegevens-gate — analyse + voorstel, GEEN implementatie

- **Waarneming**: stap 4 van de energiescan vraagt naam, bedrijfsnaam, e-mailadres en telefoonnummer vóórdat het (al lokaal berekende) resultaat wordt getoond — bevestigd door `useEnergieScan.js`: `berekenResultaat()` wordt pas aangeroepen ná succesvolle validatie van stap 4, binnen `submit()`.
- **Mogelijke voordelen van de huidige aanpak**: elke voltooide scan levert een bruikbare lead op (naam + contactgegevens); voorkomt dat het rapport zonder context wordt gedeeld/gebruikt; sluit aan bij hoe de vorige site dit deed (mogelijk ook getest).
- **Mogelijke conversiefrictie**: bezoekers die alleen willen "even kijken" haken mogelijk af zodra ze contactgegevens moeten geven vóór enig resultaat; dit is een bekend, algemeen patroon bij lead-gates (niet SMV-specifiek onderbouwd met eigen data, dus hier als algemene overweging, niet als vaststaand feit).
- **Mogelijke alternatieven** (louter ter overweging, niet uitgevoerd):
  1. Toon een beperkte preview van het resultaat (bijv. alleen de band/status uit `EnergyScale`, zonder de exacte bedragen of maatregelenlijst) vóór stap 4, en vraag pas contactgegevens voor het volledige rapport.
  2. Maak telefoonnummer optioneel (nu verplicht naast naam/bedrijfsnaam/e-mail) om de drempel te verlagen zonder de lead-waarde (e-mail) te verliezen.
  3. A/B-test (zodra er verkeer/tooling voor is) in plaats van een blinde keuze.
- **Waarom niet uitgevoerd**: dit is expliciet als businessbeslissing aangemerkt in de opdracht en in eerdere fases. Het vereist een keuze van de eigenaar tussen leadvolume/-kwaliteit en toegankelijkheid — geen technische correctie.

### 5. Geen technische fout gevonden die de site aantoonbaar schaadt

Tijdens deze review is geen bug, gebroken flow, toegankelijkheidsblokkade of regressie aangetroffen die correctie rechtvaardigt buiten bevinding 1. Formulieren (energiescan) hebben correcte `aria-invalid`/`aria-describedby`/`role="alert"`; knoppen hebben zichtbare focus-states (`focus-visible:outline`); Contact-pagina heeft geen onnodige velden of frictie.

## Prioritering

| Verbetering | Impact | Bewijs | Effort | Risico | Owner input |
|---|---:|---:|---:|---:|---:|
| 1. Placeholder-copy zonder "nog te plaatsen" | 4 | 5 | 1 | 1 | Nee |
| 2. Mobiele dubbele floating-CTA's samenvoegen | 2 | 2 | 2 | 3 | Ja (conflicterend met eerdere test) |
| 3. Doelgroep expliciet noemen in hero | 1 | 1 | 1 | 1 | Nee, maar onvoldoende bewijs |
| 4. Contactgegevens-gate aanpassen/verzachten | 3 | 2 | 3 | 4 | Ja (businessbeslissing) |

Score (impact × bewijs / effort): #1 = 20, #2 = 2, #3 = 1, #4 = 2. Verbetering #1 steekt er ver bovenuit en is de enige met zowel hoge impact als sterk bewijs bij laag risico en geen owner-inputvereiste.

## Gekozen implementatie

Slechts één wijziging voldeed aan alle criteria (concreet, aantoonbaar nuttig, geen verzonnen content, geen owner input, geen SEO-heropening) — conform de instructie "als er maar één goede wijziging is, voer er één uit" is dat wat is gebeurd:

1. **`src/data/cases.js`, `src/data/casesDetailed.js`, `src/components/home/Hero.jsx`**: `imageLabel`/`label`-teksten aangepast zodat ze alleen het onderwerp benoemen, zonder productiestatus-taal. Commercieel doel: de bewijssectie van de site (cases) en de eerste indruk (hero) mogen niet zelf aankondigen dat ze onaf zijn.
2. **`src/components/ui/ImagePlaceholder.jsx`**: alleen de code-comment aangepast (geen gedragswijziging) zodat toekomstige sessies dit patroon consistent toepassen.

## Bewust NIET uitgevoerd

- Mobiele floating-CTA-samenvoeging (bevinding 2) — onvoldoende bewijs tegenover een eerder geteste keuze.
- Doelgroep expliciet noemen in de hero (bevinding 3) — al voldoende duidelijk, wijziging zou giswerk zijn.
- Contactgegevens-gate in de energiescan (bevinding 4) — expliciete businessbeslissing, alleen geanalyseerd en een voorstel gedaan, niet doorgevoerd.
- Geen nieuwe SEO-audit, geen nieuw blogartikel, geen redesign — buiten scope per opdracht.

## Owner input

- [ ] Echte foto van een bedrijfspand in de Hoeksche Waard voor de **homepage-hero**. Huidige plek: `aspect-[4/3]` (mobiel) / `aspect-[3/4]` (lg+, staand). Richtlijn: representatief bedrijfspand (kantoor/hal/winkel), goed belicht, bij voorkeur buitenaanzicht. Formaat: lever minimaal 1600px breed aan (voor het bredere 4:3-formaat) plús een staand 3:4-crop voor desktop, of één foto met voldoende resolutie om beide crops eruit te halen (min. ~1600×1600px bruikbaar beeldvlak). Bestandsgrootte na compressie: streef naar <150 KB per crop (WebP/JPEG, vergelijkbaar met de eerdere logo-optimalisatie in fase 16).
- [ ] Foto('s) **kantoorpand Oud-Beijerland** (voor/na) — `aspect-[16/10]` op de homepage-cases-kaart, `aspect-[4/3]` op de `/cases`-detailkaart. Eén goede foto kan voor beide crops dienen; lever bij voorkeur ook een "voor"- en "na"-beeld apart aan als die bestaan.
- [ ] Foto('s) **metaalbewerkingsbedrijf Hoeksche Waard** (voor/na) — zelfde formaten als hierboven.
- [ ] Foto('s) **winkel- en showroompand** (voor/na) — zelfde formaten als hierboven.
- [ ] **Alt-tekststrategie**: zodra echte foto's beschikbaar zijn, kan de bestaande `imageLabel`-tekst (nu al schoon, subject-only) direct als `alt`-tekst dienen — geen aparte alt-tekst-exercitie nodig, de tekst is er al geschikt voor.
- [ ] **KvK-nummer** (`src/data/company.js`, `kvk: null`) — vult zich overal automatisch in zodra bekend.
- [ ] **Besluit over de contactgegevens-gate** in de energiescan (zie bevinding 4) — alleen relevant als de eigenaar leadvolume tegen toegankelijkheid wil afwegen; geen actie vereist tenzij gewenst.
- [ ] Eventuele **reviews/testimonials/klantlogo's** — niets van dit alles bestaat momenteel in de repository; niet verzonnen, alleen op te nemen zodra de eigenaar dit aanlevert.

## Vereist data (voor een toekomstige, data-gedreven ronde)

- Search Console (zie `docs/SEO-ROADMAP.md`) — nog steeds niet gekoppeld.
- GA4-conversiedata specifiek voor de energiescan (stap-uitval, met name uitval op stap 4) — zou bevinding 4 van een aanname naar een onderbouwd besluit kunnen brengen.
- Eventuele click-data op de ContactFab versus de sticky mobiele balk — zou bevinding 2 kunnen onderbouwen of juist ontkrachten.

## Tests

Lint, build (24/24 routes geprerenderd), lokale route-regressie op de geraakte routes (`/`, `/cases`) en de overige commerciële routes (`/pakketten`, `/energie-indicatie`, `/contact`), visuele controle van de aangepaste placeholders (desktop + 375px mobiel), en een JSON-LD/hydratie-steekproef op `/` en `/cases` omdat deze routes zijn geraakt. Geen wijziging aan GA4/Consent Mode/structured data/routes — geen reden gevonden om die opnieuw volledig te testen.

## Fase-geschiedenis

| Datum | Onderwerp | Bevindingen | Uitgevoerd |
|---|---|---|---|
| 2026-09-04 | Eerste commerciële kwaliteits-/conversiereview (volledige funnel, alle hoofdpagina's) | 5 bevindingen, zie boven | 1 van 4 kansen (placeholder-copy); overige bewust niet uitgevoerd |
