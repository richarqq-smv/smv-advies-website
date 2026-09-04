# SMV Advies — SEO Roadmap

> Dit document is het permanente projectgeheugen voor het SEO-traject van smv-advies.nl. Elke toekomstige sessie die aan SEO/content werkt, moet dit document eerst lezen (samen met `docs/SEO-CONTENT-MAP.md`) voordat er onderzoek of implementatie plaatsvindt. Laatst bijgewerkt: Fase 18 (2026-09-01), op basis van commit `15481a0`.

## Projectdoel

SMV Advies is een onafhankelijke verduurzamingsadviseur voor mkb-bedrijfspanden in de Hoeksche Waard (gevestigd in Oud-Beijerland). Het SEO-doel van de website is: ondernemers en eigenaren van bedrijfspanden die zoeken naar concrete verduurzamingsmaatregelen, wettelijke verplichtingen of subsidiemogelijkheden laten landen op inhoudelijk sterke, feitelijk correcte content, en die vervolgens naar de gratis energie-indicatie (`/energie-indicatie`) of naar contact (`/contact`) leiden — zonder ooit een claim te maken die het bedrijf niet kan onderbouwen (SMV verkoopt geen installaties en is geen keuringsinstantie).

## Huidige situatie

- **12 blogartikelen**, gepubliceerd tussen 22 mei 2026 en 4 september 2026 (zie "Uitgevoerde fases").
- **7 commerciële/institutionele pagina's**: home, pakketten, energie-indicatie, over, werkwijze, werkgebied, cases, plus faq, contact, privacy, voorwaarden.
- **Sitemap**: `public/sitemap.xml`, 24 URL's (8 vaste pagina's/overzichten + 12 blogposts + faq/contact/privacy/voorwaarden), handmatig onderhouden — elke nieuwe blogpost vereist een eigen `<url>`-regel.
- **robots.txt**: `User-agent: * / Allow: /`, verwijst naar de sitemap. Niet gewijzigd sinds de vroege technische SEO-fase.
- **Structured data**: `src/lib/structuredData.js` — `getOrganizationSchema()` (ProfessionalService, met volledig NAP: Frans Halsstraat 28, 3262 HG Oud-Beijerland, `areaServed: Hoeksche Waard`), `getWebsiteSchema()`, `getBreadcrumbSchema()`, `getFaqSchema()`, `getBlogPostingSchema()`. Elke pagina krijgt via `<Seo>` altijd Organization + WebSite + paginaspecifieke schema's. Server-side geïnjecteerd door `scripts/prerender.mjs` met `data-seo-ld="true"`, client-side vervangen (niet verdubbeld) bij hydratie.
- **Analytics/consent**: GA4 via statische `gtag.js`-tag in `index.html`, Google Consent Mode v2, standaard `denied` totdat de gebruiker via de cookiebanner kiest. Getest en bevestigd werkend in elke fase sinds fase 7 (zie "Analytics-status").
- **Deployment**: GitHub Actions (`.github/workflows/ci.yml`) → lint → build (Vite client + SSR + `scripts/prerender.mjs`) → GitHub Pages. Elke push naar `main` triggert een nieuwe deployment.
- **Contentarchitectuur**: `src/data/blogPosts.js` is de enige databron voor blogcontent (`BLOG_POSTS`-array, nieuwste eerst). `src/pages/BlogPost.jsx` rendert met vaste sectietypes (`p`, `h2`, `h3`, `ul`, `callout`, `table`). Nieuwe blogposts vereisen **geen** wijziging aan routing, prerendering of structured-data-code — alleen een nieuw object in `BLOG_POSTS` plus een sitemap-regel.

## Uitgevoerde fases

| Fase | Onderwerp | URL | Datum | Categorie | Commit | Belangrijkste SEO-doel |
|---|---|---|---|---|---|---|
| 9 | Zonnepanelen op uw bedrijfspand | `/blog/zonnepanelen-op-uw-bedrijfspand` | 2026-08-31 | Installaties | `884ac7f` | Nieuwe zoekintentie "zonnepanelen zakelijk/bedrijfspand"; saldering-2027-wijziging als actuele aanleiding |
| 10 | Laadpalen op uw bedrijfsterrein | `/blog/laadpalen-op-uw-bedrijfsterrein` | 2026-09-01 | Installaties | `23b2a31` | Laadinfrastructuur-zoekintentie; SEBA-sluiting en SPRILA als actuele subsidieverandering |
| 11 | Batterijopslag voor uw bedrijfspand | `/blog/batterijopslag-voor-uw-bedrijfspand` | 2026-09-02 | Installaties | `4717d21` | Batterijopslag als zelfstandig onderwerp; EIA-code 251118 en de SPRILA-batterijvoorwaarde (alleen icm laadinfra) correct uitgelegd |
| 12 | Energiebesparingsplicht voor uw bedrijfspand | `/blog/energiebesparingsplicht-voor-uw-bedrijfspand` | 2026-09-03 | Wetgeving | `924f1d0` | Bredere wettelijke verplichting dan energielabel-C (geldt voor vrijwel elk bedrijfspand ≥ drempel, niet alleen kantoren) |
| 13 | Ventilatie in uw bedrijfspand | `/blog/ventilatie-in-uw-bedrijfspand` | 2026-09-04 | Installaties | `b959d43` | Ventilatie als zelfstandige wettelijke eis + fiscale invalshoek (EIA voor WTW/CO2-sturing), losstaand van dakisolatie |
| 14 | SEO-projectgeheugen (roadmap + content map) | n.v.t. (documentatie, geen nieuwe URL) | 2026-09-01 (sessiedatum) | n.v.t. | `969680a` | Persistente projectcontext zodat toekomstige sessies niet opnieuw hoeven te worden gebrieft |
| 15 | Interne linkstrategie: ontbrekende inkomende links toegevoegd | n.v.t. (bestaande artikelen gewijzigd, geen nieuwe URL) | 2026-09-01 (sessiedatum) | n.v.t. | `ce084f7` | P1-item uit de roadmap uitgevoerd: link vanuit `netcongestie-hoeksche-waard` naar `batterijopslag-voor-uw-bedrijfspand`, en vanuit `verborgen-energieverspillers` naar `ventilatie-in-uw-bedrijfspand`. Search Console-toegang gecontroleerd en niet beschikbaar — geen data verzonnen, doorgegaan met eerstvolgende prioriteit. |
| 16 | Technische SEO-/performance-audit | n.v.t. (site-brede technische wijziging, geen nieuwe URL) | 2026-09-01 (sessiedatum) | n.v.t. | `0c03d46` | Roadmap-item #7 uitgevoerd: eerste formele technische audit (Core Web Vitals-relevante checks, title/meta/canonical/H1-uniekheid over alle 24 routes, indexeerbaarheid, orphan-pages, structured data). Eén concreet, bevestigd probleem gevonden en verholpen (zie "Technische SEO-status" hieronder); overige onderzochte punten waren al in orde en zijn ongewijzigd gelaten. |
| 17 | Contentoptimalisatie bestaande artikelen (interne links) | `netcongestie-hoeksche-waard`, `warmtepomp-in-het-mkb`, `led-verlichting-snelste-stap` (bestaande artikelen gewijzigd, geen nieuwe URL) | 2026-09-01 (sessiedatum) | n.v.t. | `edd79e3` | Roadmap-item #3 (gedeeltelijk) uitgevoerd: audit van alle 12 artikelen op actualiteit/dunheid/ontbrekende links wees uit dat drie oudere artikelen (geschreven vóórdat zonnepanelen, laadpalen en energiebesparingsplicht als losse artikelen bestonden) die onderwerpen bij naam noemden zonder te linken. Geen inhoudelijke feiten bleken verouderd (netcongestie's "1 juli 2026"-wachtlijstfeit opnieuw primair geverifieerd en nog steeds correct). Zie "Contentoptimalisatie — fase 17" hieronder voor details. |
| 18 | Commerciële/conversie- en vertrouwensaudit | `/cases`, `/energie-indicatie`, homepage (bestaande pagina's gewijzigd, geen nieuwe URL) | 2026-09-01 (sessiedatum) | n.v.t. | `15481a0` | Roadmap-item #5 uitgevoerd: audit van homepage, energie-indicatie, contact, cases en sitestructuur op conversie-/vertrouwensknelpunten. Drie concrete, laag-risico fixes doorgevoerd (zie "Commerciële/conversie-audit — fase 18" hieronder). Belangrijkste niet-uitgevoerde bevindingen vereisen eigenaarsinput (echte foto's, KvK-nummer) of zijn een bewuste business-keuze (contactgegevens-gate in de energie-indicatietool) — expliciet gedocumenteerd, niet zelfstandig gewijzigd. |

**Eerdere fases (vóór fase 9, uit git history, ter context)**: de eerste vijf blogartikelen (energielabel-C, netcongestie, dakisolatie, EIA/ISDE/SDE++, warmtepomp, LED, verborgen energieverspillers) en de technische SEO-basis (prerendering, sitemap, structured data, GA4/Consent Mode) zijn in eerdere, niet meer als "Fase N" genummerde sessies gebouwd. Zie git log voor het volledige verloop; de belangrijkste commits zijn `f90060e` (initial commit) t/m `9253087` (laatste inhoudelijke verdieping vóór fase 9).

## Huidige contentclusters

### Wetgeving
- Energielabel C verplicht voor uw bedrijfspand (`energielabel-c-verplicht-bedrijfspand`)
- Energiebesparingsplicht voor uw bedrijfspand (`energiebesparingsplicht-voor-uw-bedrijfspand`)

### Installaties
- Zonnepanelen op uw bedrijfspand
- Laadpalen op uw bedrijfsterrein
- Batterijopslag voor uw bedrijfspand
- Ventilatie in uw bedrijfspand
- De warmtepomp in het mkb (`warmtepomp-in-het-mkb`)

### Subsidies / fiscaliteit
- EIA, ISDE en SDE++ (`eia-isde-sde-subsidies`) — inmiddels een pillar-artikel dat ook KIA en een vergelijkingstabel bevat (sinds de EIA/ISDE/SDE++/KIA-verdieping, commit `0a68552`)

### Energie-infrastructuur
- Netcongestie in de Hoeksche Waard (`netcongestie-hoeksche-waard`)
- (Batterijopslag en laadpalen raken dit cluster ook thematisch, maar staan primair onder "Installaties")

### Isolatie
- Dakisolatie voor uw bedrijfspand (`dakisolatie-voor-uw-bedrijfspand`)

### Efficiëntie
- LED-verlichting: de snelste verduurzamingsstap die er is (`led-verlichting-snelste-stap`)

### Inzicht
- Verborgen energieverspillers in uw bedrijfspand (`verborgen-energieverspillers`) — listicle-stijl, functioneert als lichte hub naar LED en dakisolatie

*(Categorieën zijn exact zoals ze in `src/data/blogPosts.js` per artikel staan; er bestaan geen andere categorieën in de huidige data.)*

## Content gaps

Onderstaande zijn **aanbevelingen**, geen goedgekeurde content. Elke fase moet dit expliciet opnieuw beoordelen en de feiten opnieuw primair verifiëren vóór publicatie.

| Onderwerp | Zoekintentie | Relevantie | Bestaande overlap | Potentiële interne links | Bronbeschikbaarheid | Prioriteit |
|---|---|---|---|---|---|---|
| Gevelisolatie / glasisolatie (HR++/triple glas) | "gevelisolatie bedrijfspand", "glasisolatie zakelijk" | Middel — logische aanvulling op dakisolatie | Hoog — dakisolatie-artikel raakt dit al zijdelings (Bbl-schil-eisen) | dakisolatie, energiebesparingsplicht, subsidies | Bbl/IPLO waarschijnlijk goed beschikbaar | Midden |
| Zakelijke financiering/lening voor verduurzaming (bijv. Qredits, groene lening) | "verduurzaming financieren bedrijfspand" | Middel — andere invalshoek dan subsidie (lenen vs. subsidiëren) | Laag t.o.v. subsidie-artikel, mits scherp afgebakend | subsidies, energiebesparingsplicht | Risico: grenst aan financieel advies — voorzichtig positioneren, mogelijk buiten scope van SMV's adviesrol | Laag |
| Energiemanagementsysteem / verbruiksmonitoring | "energiemonitoring bedrijfspand" | Middel | Laag — nu alleen één zin in netcongestie-artikel | netcongestie, batterijopslag, zonnepanelen | Redelijk, maar FAQ stelt expliciet dat SMV geen monitoring doet — positionering vereist extra zorgvuldigheid | Laag–Midden |
| Airconditioning/koeling zakelijk | "airco bedrijfspand energiezuinig" | Laag–Middel — zwakkere regelgevende hefboom dan andere onderwerpen | Laag | ventilatie, energiebesparingsplicht | Zwakker dan andere kandidaten; makkelijk in consumenten-territorium te glijden | Laag |
| Vloerisolatie | "vloerisolatie bedrijfshal" | Laag–Middel | Hoog — conceptueel dicht bij dakisolatie | dakisolatie | Waarschijnlijk beschikbaar via Bbl | Laag |
| Warmtenet-aansluiting bedrijfspand | "aansluiten op warmtenet bedrijfspand" | Laag — sterk regio-/situatie-afhankelijk | Laag | netcongestie, warmtepomp | Sterk regionaal, moeilijk landelijk te onderbouwen | Laag |

## Cannibalisatie-risico

Onderwerpen waarbij toekomstige artikelen expliciet moeten afbakenen tegen bestaand materiaal:

- **Subsidies/fiscaliteit** — `eia-isde-sde-subsidies` is het enige artikel dat EIA/ISDE/SDE++/KIA-mechaniek mag uitleggen. Elk ander artikel mag alleen kort verwijzen en linken; specifieke Energielijst-codes voor een nieuw onderwerp (zoals bij batterijopslag/ventilatie is gedaan) mogen daar wél op hoofdlijnen worden geïntroduceerd, mits ze niet al ergens anders staan.
- **Netcongestie-mechaniek** (wachtlijsten, grootverbruik/kleinverbruik, Hoeksche Waard-tijdlijn) — uitsluitend in `netcongestie-hoeksche-waard`. Batterijopslag, zonnepanelen, laadpalen en ventilatie mogen er alleen kort naar verwijzen.
- **Saldering (2027)** — uitsluitend uitgebreid uitgelegd in `zonnepanelen-op-uw-bedrijfspand`. Batterijopslag mag er kort naar verwijzen (al gedaan), toekomstige artikelen niet opnieuw herhalen.
- **Bbl-bouwregelgeving voor de gebouwschil** (Rc-waarden, ingrijpende renovatie) — hoort primair bij `dakisolatie-voor-uw-bedrijfspand`. Ventilatie-artikel citeert een eigen, ander Bbl-artikel (ventilatie-eis) en overlapt daardoor niet.
- **Energielabel-C vs. energiebesparingsplicht** — bewust als twee afzonderlijke artikelen behandeld omdat de wettelijke grondslag, doelgroep (alleen kantoorfunctie vs. vrijwel elk bedrijfspand) en drempels verschillen. Toekomstige content moet dit onderscheid niet laten vervagen.
- **ISDE zakelijk vs. particulier** — belangrijke valkuil, al één keer aangetroffen (Fase 13): sommige ISDE-maatregelen (zoals de ventilatie-subsidie sinds 2026) gelden uitsluitend voor woningeigenaren, niet voor zakelijke gebruikers. Elke nieuwe ISDE-claim moet expliciet op de RVO-pagina "zakelijke gebruikers" worden gecontroleerd, niet op de algemene of particuliere ISDE-pagina.

## Contentoptimalisatie — fase 17

Volledige audit van alle 12 artikelen op actualiteit, dunheid, titel/meta-kwaliteit, ontbrekende links en cannibalisatierisico. Bevindingen en acties:

- **`netcongestie-hoeksche-waard`**: de "1 juli 2026"-wachtlijstwijziging voor kleinverbruikers is opnieuw gecontroleerd bij meerdere bronnen (incl. Stedin en Vakcentrum) en blijft correct — geen inhoudelijke wijziging nodig. Wel gevonden: de bulletlijst "Kunt u nog verduurzamen ondanks netcongestie?" noemde zonnepanelen en laadpalen bij naam zonder te linken (beide dedicated artikelen bestonden nog niet toen dit artikel op 2026-08-20 werd geschreven). **Opgelost**: beide nu gelinkt.
- **`warmtepomp-in-het-mkb`**: de subsidieparagraaf ("Kosten en subsidie") is inhoudelijk nog correct (ISDE voor zakelijke warmtepompen bestaat nog, EIA kan van toepassing zijn) en blijft bewust kort — verdere uitleg hoort in het subsidie-artikel. Wel gevonden: de paragraaf "De elektrische aansluiting" noemde zonnepanelen en laadpalen bij naam zonder te linken (zelfde oorzaak: geschreven vóór die artikelen bestonden). **Opgelost**: beide nu gelinkt.
- **`led-verlichting-snelste-stap`**: het dunste/oudste artikel (4 min, 2026-06-05). Introparagraaf noemde "isolatie" en "een warmtepomp" zonder te linken. **Opgelost**: beide nu gelinkt. Daarnaast een nieuwe, natuurlijke link toegevoegd naar `energiebesparingsplicht-voor-uw-bedrijfspand` (dat artikel citeert LED al als voorbeeld van een Erkende-Maatregelenlijst-maatregel; dit maakt de verwijzing wederzijds).
- **Overige 9 artikelen**: gecontroleerd, geen concrete, onderbouwde reden gevonden voor wijziging op dit moment. Title/meta/H1 van alle 12 artikelen zijn al bevestigd uniek en aanwezig (fase 16-audit). Geen titel/meta-wijzigingen doorgevoerd — er was geen concrete onderbouwing dat de bestaande titels onderpresteren (geen Search Console-data beschikbaar om dat te toetsen).
- **Geen wijziging aan structured data, CTA's, of bestaande, inhoudelijk correcte tekst** — alleen internal-linking, puur additief.

## Commerciële/conversie-audit — fase 18

Gerichte audit van homepage, `/energie-indicatie`, `/contact`, `/cases` en de sitestructuur op conversie- en vertrouwensknelpunten.

**Bevindingen — homepage**: heldere, niet-overclaimende propositie (H1 "Uw bedrijfspand, toekomstbestendig", subline benoemt onafhankelijkheid en direct bruikbaar rapport), duidelijke primaire CTA (energie-indicatie) en secundaire CTA (pakketten), logische sectievolgorde (Hero → USP's → Pricing → Energie-CTA → Werkwijze → Regionaal → Cases → Closing CTA). Eén concreet gat gevonden: de cases-teaser op de homepage had geen link naar de volledige `/cases`-pagina — **opgelost**.

**Bevindingen — energie-indicatie**: duidelijke verwachtingsmanagement ("Gratis indicatie · geen officieel energielabel", expliciete disclaimer dat het geen NTA 8800-meting is), concrete tijdsindicatie (5-7 minuten), stappenoverzicht. De pagina noemde dakisolatie, een warmtepomp en LED-verlichting zonder naar de bijbehorende artikelen te linken, terwijl bezoekers die via die content binnenkomen hier juist zouden willen doorlezen — **opgelost**.

**Bevindingen — contact**: al laagdrempelig (directe mailto/tel-knoppen, geen verplicht formulier, volledige contactgegevens zichtbaar, expliciete reactietijd). Geen wijziging nodig.

**Bevindingen — cases**: de content zelf (cijfers, voor/na-situaties) is bevestigd **verbatim overgenomen van de bestaande, eerder gepubliceerde cases van de klant** (zie code-comments in `cases.js`/`casesDetailed.js`) — dit is geen verzonnen content en is in deze fase niet aangepast. Twee concrete knelpunten gevonden:
- Geen enkele case linkte naar de blogartikelen over de maatregelen die de case zelf noemt (dakisolatie, warmtepomp, zonnepanelen, LED, ISDE) — **opgelost** door een nieuw, apart `relatedArticles`-veld per case toe te voegen (uitdrukkelijk niet vermengd met de verbatim clienttekst).
- Alle drie cases gebruiken nog een `ImagePlaceholder` in plaats van echte voor/na-foto's ("nog te plaatsen"). Dit is een **substantieel vertrouwens-/bewijsprobleem dat inhoud van de eigenaar vereist** — er is geen bestaande fotografie in de repository om te gebruiken, en er is dus bewust niets verzonnen of aangepast. Zie "Benodigde input van de eigenaar" hieronder.

**Bevindingen — diensten/sitestructuur**: belangrijkste pagina's zijn maximaal 1-2 klikken bereikbaar vanuit navigatie of content; CTA's zijn consistent (vrijwel elk blogartikel en elke commerciële pagina eindigt met dezelfde twee routes: energie-indicatie en contact). Geen orphan pages (herbevestigd, zie fase 16).

**Bevindingen — trust/autoriteit**: de site beantwoordt "waarom SMV Advies" (onafhankelijkheids-USP, herhaald op meerdere plekken), "wat krijgt de klant" (heldere pakketten-vergelijking, QuickScan/Premium/Gold) en "welk bewijs is er" (3 cases met concrete cijfers). Ontbrekend, en niet zelf in te vullen: KvK-nummer (`company.js` heeft `kvk: null`, al gedocumenteerd sinds fase 16), certificeringen, reviews — geen van deze bestaat in de repository en is dus terecht afwezig in plaats van verzonnen.

**Doorgevoerde verbeteringen (fase 18)**:
1. Elke case op `/cases` linkt nu naar de relevante blogartikelen (nieuw `relatedArticles`-veld, editorieel, los van de verbatim clienttekst).
2. `/energie-indicatie` linkt nu naar de dakisolatie-, warmtepomp- en LED-artikelen.
3. De homepage-cases-sectie heeft nu een "Bekijk alle cases"-link naar `/cases`.

**Bewust niet uitgevoerd / vereist input van de eigenaar**:
- **Echte voor/na-fotografie voor de 3 cases en de homepage-hero** — kan niet worden verzonnen; alle huidige afbeeldingen zijn `ImagePlaceholder`-componenten. Dit is het grootste resterende vertrouwens-/conversieknelpunt van de site.
- **KvK-nummer** (`src/data/company.js`, `kvk: null`) — invullen zodra bekend, verschijnt dan automatisch overal waar het hoort (zie comment in dat bestand).
- **De energie-indicatietool vraagt in stap 4 volledige contactgegevens (naam, bedrijfsnaam, e-mail, telefoon) vóórdat er enig resultaat wordt getoond.** Dit is een reële frictiedrempel voor een tool die wordt gepresenteerd als "gratis" en "vrijblijvend", maar het verwijderen van die drempel is een leadgenerator-/businessmodelbeslissing die niet zelfstandig door een SEO-fase mag worden genomen. Gemeld als aandachtspunt, niet gewijzigd.

## Interne linkstrategie

Onderstaande is opgebouwd uit de daadwerkelijke `ROUTES.blogPost(...)`-links in `src/data/blogPosts.js` (gecontroleerd per artikel, niet geschat).

**Uitgaande links per artikel:**

| Artikel | Linkt naar |
|---|---|
| Ventilatie | dakisolatie, EIA/ISDE/SDE++, energiebesparingsplicht |
| Energiebesparingsplicht | LED, dakisolatie, warmtepomp, EIA/ISDE/SDE++, energielabel-C |
| Batterijopslag | zonnepanelen, netcongestie, EIA/ISDE/SDE++, laadpalen |
| Laadpalen | EIA/ISDE/SDE++, zonnepanelen, netcongestie |
| Zonnepanelen | netcongestie, EIA/ISDE/SDE++, dakisolatie |
| Energielabel-C | dakisolatie, LED, warmtepomp |
| Netcongestie | dakisolatie, LED, warmtepomp, EIA/ISDE/SDE++, batterijopslag, zonnepanelen, laadpalen (fase 17) (+ externe link naar Stedin's congestiechecker) |
| Dakisolatie | EIA/ISDE/SDE++, warmtepomp (+ link naar `/cases`) |
| EIA/ISDE/SDE++ | LED, warmtepomp, dakisolatie, energielabel-C (+ link naar `/contact`) |
| Warmtepomp | dakisolatie, netcongestie, EIA/ISDE/SDE++, zonnepanelen, laadpalen (fase 17) |
| LED | EIA/ISDE/SDE++, verborgen energieverspillers, dakisolatie, warmtepomp, energiebesparingsplicht (fase 17) (+ link naar `/cases`) |
| Verborgen energieverspillers | LED, dakisolatie, ventilatie |

**Update (fase 15) — ontbrekende inkomende links opgelost**: `batterijopslag-voor-uw-bedrijfspand` en `ventilatie-in-uw-bedrijfspand` hadden na fase 14 geen enkele inkomende link vanuit een ander artikel. In fase 15 is dit verholpen: de bestaande H3 "Batterijopslag" in `netcongestie-hoeksche-waard` linkt nu naar het batterijopslag-artikel, en de ventilatie-passage in `verborgen-energieverspillers` linkt nu naar het ventilatie-artikel. Beide artikelen hebben nu minimaal 1 inkomende link.

**EIA/ISDE/SDE++-artikel is de sterkste hub**: 9 van de 11 andere artikelen linken hier naartoe. Dit bevestigt dat het pillar-artikel zijn functie goed vervult.

**Commerciële CTA-bestemmingen**: vrijwel elk blogartikel eindigt met een `cta`-object naar `/energie-indicatie` ("Start de gratis energie-indicatie"), en gebruikt een `callout`-blok met een link naar `/contact` voor twijfelgevallen. Enkele artikelen linken daarnaast naar `/pakketten`, `/werkwijze` of `/cases` als aanvullende commerciële/vertrouwenscontext.

## Technische SEO-status

- **Prerendering**: `scripts/prerender.mjs` rendert elke route naar een platte `dist/<route>.html` (geen `/route/index.html`, om een GitHub Pages 301-redirect te voorkomen). Blogpost-slugs worden **automatisch** afgeleid uit `BLOG_POSTS` — een nieuwe blogpost vereist geen wijziging aan dit script. Nieuwe top-level pagina's (zoals destijds `/werkgebied`) vereisen wél een handmatige toevoeging aan de `ROUTES`-array in dit script.
- **Routes**: `/blog/:slug` is een generieke dynamische route in `src/App.jsx`; nieuwe blogposts hebben dus ook geen routing-wijziging nodig.
- **Canonical**: elke pagina krijgt een canonical URL via de `Seo`-component/`prerender.mjs`, consistent geverifieerd in elke fase.
- **Sitemap**: handmatig onderhouden, 24 URL's, geen duplicaten (laatst gevalideerd in fase 13).
- **Robots.txt**: ongewijzigd sinds de vroege technische fase, verwijst correct naar de sitemap.
- **Structured data**: JSON-LD wordt zowel server-side geïnjecteerd als client-side (na hydratie) opnieuw gezet, met een `data-seo-ld="true"`-attribuut dat voorkomt dat beide gelijktijdig bestaan (fix uit commit `177219e`). In elke fase sinds fase 7 is bevestigd: exact 4 JSON-LD-blokken op een blogpost (ProfessionalService, WebSite, BreadcrumbList, BlogPosting), geen duplicatie na hydratie of SPA-navigatie.
- **Hydration/SPA-navigatie**: consistent getest en foutloos in fase 7 t/m 13.
- **Mobile**: consistent getest op ~375px viewport, geen horizontale overflow, in fase 7 t/m 13.
- **Performance**: eerste formele audit uitgevoerd in fase 16 (geen Lighthouse-tool beschikbaar in deze sessie-omgeving; onderzoek gebeurde via directe inspectie van de build-output, netwerkgedrag en DOM). Bevindingen:
  - **Gevonden en verholpen**: de headerlogo (`<img>` in `src/components/layout/Header.jsx`) laadde op élke pagina het volledige bronbestand `logo.png` (1672×941px, 731 KB) terwijl het slechts op ~44–48px hoogte werd getoond. Er is een correct geschaald, apart bestand `public/logo-header.png` (199×112px, 12,7 KB — 98% kleiner) aangemaakt met Pillow (Python) uit het bestaande logo (geen nieuwe content verzonnen) en de header gebruikt dit nu, met expliciete `width`/`height`-attributen. Dit werd op elke pagina van de site geladen, dus de impact is sitebreed. `logo.png` zelf is ongewijzigd en blijft in gebruik voor structured data en het nieuwe `og:image`.
  - **Gevonden en verholpen**: geen enkele pagina had een `og:image`-tag (bevestigd via inspectie van `index.html` en `scripts/prerender.mjs`'s `buildHead()`) — social-share-previews (LinkedIn, WhatsApp, etc.) toonden dus geen afbeelding. Toegevoegd: `og:image`, `og:image:width`, `og:image:height` (statisch, sitebreed, wijzend naar het bestaande `logo.png`) en `twitter:card=summary_large_image` in `index.html`. Omdat dit één statische tag is die voor elke pagina gelijk is, hoefde `Seo.jsx` of `prerender.mjs` niet te worden aangepast — de tag loopt automatisch mee in elke geprerenderde pagina.
  - **Onderzocht, geen wijziging nodig**: JS/CSS-bundelgrootte (hoofdbundel 250 KB / 76 KB gzip, grootste losse chunk 73 KB / 21 KB gzip — normaal voor een React 19-app, geen buitensporige bundels aangetroffen); `modulepreload`-hints worden al automatisch door Vite gegenereerd; er is precies één render-blocking stylesheet (onvermijdelijk voor een Tailwind-app zonder critical-CSS-inlining, geen laag-risico fix beschikbaar).
  - **Onderzocht, bewust niet gewijzigd (te fragiel voor een laag-risico fix)**: lettertypen (self-hosted via `@fontsource-variable`) hebben geen `<link rel="preload">`-hints. Dit zou de eerste tekst-render marginaal kunnen versnellen, maar een handmatige preload-tag zou de content-hashed bestandsnamen van elke build moeten volgen — zonder een build-plugin die dit automatisch genereert, zou dat bij elke toekomstige build stilzwijgend kunnen verouderen. Aanbevolen voor een latere fase, mits met een betrouwbare, build-geïntegreerde oplossing (bijv. een Vite-plugin), niet als handmatige tag.
  - **Niet gemeten (geen tool beschikbaar)**: exacte LCP/CLS/INP-getallen (Lighthouse/PageSpeed Insights/CrUX-data). Aanbevolen om dit alsnog te meten zodra een sessie toegang heeft tot zo'n tool of tot het Core Web Vitals-rapport in Search Console.
- **Technische SEO — volledige audit over alle 24 routes (fase 16)**: title, meta description en canonical zijn stuk voor stuk uniek (geen duplicaten); elke pagina heeft precies één `<h1>`; geen `noindex` op een pagina die wél geïndexeerd zou moeten worden (alleen `NotFound.jsx` heeft terecht `noindex`); geen orphan pages gevonden (elke route in de sitemap is bereikbaar via de hoofdnavigatie, footer, `/contact`-knop in de header, of interne bloglinks); geen duplicate-content-risico; trailing-slash-consistentie was al eerder in het project opgelost (platte `.html`-bestanden i.p.v. `/route/index.html`, zie eerdere commit `6abf045`).
- **GitHub Pages deployment**: via `.github/workflows/ci.yml` — checkout → npm ci → lint → build → `actions/upload-pages-artifact` → `actions/deploy-pages`. Triggert op elke push naar `main`.

## Analytics-status

GA4 wordt geladen via een statische `<script>`-tag in `index.html` (bewust niet dynamisch geïnjecteerd, om Consent Mode niet te breken — zie eerdere commits `3f2f885`, `9509f3c`, `fa114f5`, `d3c0daa`). Consent Mode v2 zet `analytics_storage` (en overige signalen) standaard op `denied` vóórdat de tag laadt.

De bestaande regressietest, herhaald en bevestigd in elke fase van fase 7 t/m 13 (lokaal én live, telkens met domein-gekwalificeerde cookie-clearing om valse positieven van een eerder geaccepteerde sessie te voorkomen):
- **denied by default** bij een schone sessie;
- **"Weigeren"** houdt `analytics_storage` op `denied`, geen `_ga`-cookie;
- **"Accepteren"** zet consent op `accepted`, plaatst een echte `_ga`-cookie, en `window.google_tag_data.ics.usedUpdate` wordt `true`.

Deze implementatie is in fase 14 **niet gewijzigd** en moet dat ook in toekomstige contentfases niet worden, behalve via een expliciete, apart aangevraagde en gemarkeerde analytics-fase.

## Bekende issues

- **Pre-existing broken PostToolUse-hook** (omgevingsniveau, niet in de repository): elke Edit/Write triggert een `python3 ... validate_antipatterns.py`-aanroep die faalt met `[Errno 2] No such file or directory`. Dit is een lokale sessie-/omgevingsconfiguratie buiten de repository, blokkeert de daadwerkelijke bestandswijziging niet, en is in vrijwel elke fase sinds fase 7 waargenomen en bevestigd irrelevant voor de website zelf.
- **Incidentele transiënte 5xx-responses tijdens live route-regressie**: in fase 12 en fase 13 gaf een enkele, telkens andere en niet-gerelateerde route (dakisolatie in fase 12, de nieuwe ventilatie-URL en later batterijopslag in fase 13) tijdens één curl-aanroep een `503`, en gaf bij directe herhaling (binnen enkele seconden) consistent `200`. Dit patroon — niet reproduceerbaar, wisselt van route, treedt op kort na een verse deployment — wijst op een kortstondige CDN/origin-fluctuatie, niet op een structurele regressie. **Behandel een enkele, niet-reproduceerbare 5xx dus niet als SEO-regressie**; controleer altijd met een korte herhaling vóórdat een fout als echt probleem wordt gerapporteerd of vóórdat een bestaand bestand wordt aangepast om het te "fixen".
- **Geen KvK-nummer bekend**: `src/data/company.js` heeft `kvk: null` met expliciete instructie dat dit veld pas moet worden ingevuld zodra het nummer bekend is. Niet SEO-kritisch, maar relevant voor eventuele toekomstige lokale-SEO- of trust-signalen.

## Roadmap

Deze roadmap is nadrukkelijk **niet** een oproep tot eindeloos nieuwe blogartikelen. Na de huidige contentbasis (12 artikelen, brede dekking van installaties/wetgeving/subsidies/infrastructuur) verschuift de prioriteit logischerwijs naar meten, optimaliseren en converteren in plaats van uitsluitend uitbreiden.

| # | Richting | Doel | Waarom | Afhankelijkheden | Prioriteit | Wanneer |
|---|---|---|---|---|---|---|
| 1 | ~~Interne linking bijwerken~~ | ~~Batterijopslag en ventilatie een inkomende link geven vanuit netcongestie resp. verborgen-energieverspillers~~ | Concreet vastgestelde lacune (zie "Interne linkstrategie") | — | **Afgerond in fase 15** | Uitgevoerd op 2026-09-01 |
| 2 | Search Console-analyse | Zodra data beschikbaar is: impressies, CTR, posities, zoekopdrachten per pagina analyseren | Data-gedreven prioritering is veel betrouwbaarder dan verder gokken op content gaps | Toegang tot Search Console (nog steeds niet beschikbaar per fase 15 — opnieuw gecontroleerd, geen connector gevonden) | **P1**, zodra data er is | Zo snel mogelijk na voldoende indexatie/verkeer |
| 3 | Contentoptimalisatie bestaande artikelen | Oudere artikelen herzien op actualiteit van cijfers/regelgeving en ontbrekende interne links | Feiten uit eerdere fases kunnen na verloop van tijd verouderen (subsidiebedragen, drempels, wetsartikelen) | Primaire bronverificatie per artikel | **Gedeeltelijk afgerond in fase 17** (interne links op netcongestie/warmtepomp/LED; overige 9 artikelen gecontroleerd, geen concrete wijziging nodig bevonden) | Periodiek herhalen, bijv. ieder kwartaal of bij bekende wetswijziging |
| 4 | Verdere content gaps | Zie tabel "Content gaps" hierboven | Nog niet alle relevante zoekintenties zijn gedekt | Nieuwe primaire bronverificatie per onderwerp | **P2/P3** afhankelijk van onderwerp | Na Search Console-inzicht, niet blind doorgaan |
| 5 | ~~Commerciële/conversie-SEO~~ | ~~De paden content → `/energie-indicatie` → `/contact` optimaliseren~~ | Meer content zonder conversieverbetering levert minder waarde op dan gerichte funnel-optimalisatie | — | **Uitgevoerd in fase 18** (interne links); resterende bevindingen vereisen eigenaarsinput of een businessbeslissing (zie "Commerciële/conversie-audit — fase 18") | Uitgevoerd op 2026-09-01 |
| 6 | Lokale SEO | Overwegen of een aparte, goed onderbouwde uitbreiding van lokale signalen (bijv. per-kern content, meer expliciete NAP-consistentie) waarde toevoegt naast de al bestaande `/werkgebied`-pagina | Werkgebied bestaat al en dekt de regio; verdere uitbreiding moet aantoonbare zoekintentie hebben, geen aanname | Zie "Lokale SEO"-sectie in `SEO-CONTENT-MAP.md` | **P3** | Alleen na concrete aanwijzing (bijv. Search Console-zoekwoorden per kern) |
| 7 | ~~Technische SEO-audit~~ | ~~Performance/Core Web Vitals, en herbevestiging van prerendering/canonical/structured data op schaal (24+ routes)~~ | Nooit formeel gemeten; risico neemt toe naarmate het aantal routes groeit | — | **Afgerond in fase 16** | Uitgevoerd op 2026-09-01; opvolging (echte LCP/CLS/INP-meting via Lighthouse/Search Console) blijft openstaan zodra een sessie daar toegang toe heeft |
| 8 | Autoriteit/backlinks | Nog niet onderzocht of geadresseerd | Buiten de huidige on-page/content-scope van dit project | Vereist aparte strategie en waarschijnlijk externe input (partnerschappen, lokale ondernemersverenigingen) | **P3** | Pas relevant nadat on-page/technische basis en conversie op orde zijn |

### Hoe toekomstige fases moeten worden uitgevoerd

1. Lees altijd eerst dit document (`docs/SEO-ROADMAP.md`).
2. Lees daarna `docs/SEO-CONTENT-MAP.md`.
3. Controleer de actuele repository (git log, `blogPosts.js`, `sitemap.xml`) vóórdat je een roadmap-item uitvoert — dit document kan achterlopen op de werkelijke staat als het niet is bijgewerkt.
4. Onderzoek actuele claims altijd via primaire bronnen (Rijksoverheid, RVO, IPLO, Belastingdienst, ACM, netbeheerders) — nooit alleen secundaire samenvattingen.
5. Vermijd cannibalisatie — check de tabel "Cannibalisatie-risico" hierboven vóór je een nieuw onderwerp kiest.
6. Gebruik de bestaande architectuur (sectietypes `p`/`h2`/`h3`/`ul`/`callout`/`table`, `ROUTES.blogPost()`-helper, bestaande CTA/callout-patronen) — bouw geen nieuwe renderer of datamodel zonder aantoonbare noodzaak.
7. Maak geen onnodige technische wijzigingen — een nieuwe blogpost raakt normaal gesproken alleen `blogPosts.js` en `sitemap.xml`.
8. Test lokaal (lint, build, prerender, SEO-velden, JSON-LD, interne links, sitemap, browser/mobile, GA4/Consent Mode, robots) vóór commit.
9. Test live na deployment, met cache-busting, inclusief een volledige route-regressie.
10. Commit en push pas als alle lokale checks schoon zijn; wacht op een succesvolle GitHub Actions-run vóór live-verificatie.
11. Werk dit document (en `SEO-CONTENT-MAP.md`) bij ná iedere afgeronde SEO-fase — nieuw artikel, nieuwe interne link, gewijzigde prioriteit.
12. Verzin geen feiten — cijfers, bedragen, drempels, jaartallen en wettelijke verwijzingen moeten primair verifieerbaar zijn of worden weggelaten/algemeen geformuleerd.
13. Stop bij materiële onzekerheid (tegenstrijdige primaire bronnen, een claim die niet te verifiëren is) in plaats van te gokken — meld dit expliciet in het eindrapport in plaats van door te schrijven.

## Eerstvolgende prioriteit (bijgewerkt na fase 18)

Met fase 15 t/m 18 afgerond (interne links, technische audit, contentoptimalisatie, commerciële/conversie-audit), zijn vrijwel alle **zelfstandig uitvoerbare, low-risk SEO-/websiteverbeteringen die zonder aanvullende data of eigenaarsinput konden worden vastgesteld, nu doorgevoerd.** De eerstvolgende hoogste prioriteit blijft **Search Console-analyse zodra toegang beschikbaar komt** (P1, geblokkeerd — opnieuw gecontroleerd in fase 18, nog steeds geen connector gevonden). Zonder die data, of zonder de hieronder genoemde eigenaarsinput, is er op dit moment geen concrete, aantoonbare volgende technische of content-actie meer te identificeren zonder in gokken of cosmetische wijzigingen te vervallen.

**Wat wél nog aanvullende input vereist (geen actie voor een toekomstige Claude-sessie zonder die input)**:
- Echte voor/na-fotografie voor de 3 cases en de homepage-hero (grootste resterende vertrouwens-/conversieknelpunt, zie "Commerciële/conversie-audit — fase 18").
- Het KvK-nummer (`src/data/company.js`).
- Een besluit van de eigenaar over de contactgegevens-gate in de energie-indicatietool (stap 4 vraagt naam/bedrijfsnaam/e-mail/telefoon vóór enig resultaat) — een leadgenerator-/businessmodelkeuze, geen technische bug.

**Resterende, niet-geblokkeerde P2/P3-opties** (alleen zinvol met een concrete aanleiding, niet als automatisme):
- de resterende 9 artikelen periodiek herbeoordelen bij een bekende wet-/subsidiewijziging;
- een echte Core Web Vitals-meting zodra Lighthouse/PSI/Search Console-toegang bestaat;
- een expliciet goedgekeurd nieuw contentartikel uit de "Content gaps"-tabel in `SEO-CONTENT-MAP.md` (gevelisolatie/glasisolatie heeft de hoogste prioriteit).

**Advies voor de eigenaar**: dit is een logisch pauzepunt in het zelfstandige SEO-traject. De volgende zinvolle stap is ofwel (1) Search Console koppelen zodat toekomstige fases datagedreven kunnen prioriteren, of (2) de drie owner-input-items hierboven aanleveren (met name de fotografie), waarna een fase die content direct kan verwerken.
