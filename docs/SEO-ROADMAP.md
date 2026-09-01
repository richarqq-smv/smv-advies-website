# SMV Advies — SEO Roadmap

> Dit document is het permanente projectgeheugen voor het SEO-traject van smv-advies.nl. Elke toekomstige sessie die aan SEO/content werkt, moet dit document eerst lezen (samen met `docs/SEO-CONTENT-MAP.md`) voordat er onderzoek of implementatie plaatsvindt. Laatst bijgewerkt: Fase 14 (2026-09-01), op basis van commit `b959d43`.

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
| 14 | SEO-projectgeheugen (dit document + content map) | n.v.t. (documentatie, geen nieuwe URL) | 2026-09-01 (sessiedatum) | n.v.t. | *(dit commit)* | Persistente projectcontext zodat toekomstige sessies niet opnieuw hoeven te worden gebrieft |

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
| Netcongestie | dakisolatie, LED, warmtepomp, EIA/ISDE/SDE++ (+ externe link naar Stedin's congestiechecker) |
| Dakisolatie | EIA/ISDE/SDE++, warmtepomp (+ link naar `/cases`) |
| EIA/ISDE/SDE++ | LED, warmtepomp, dakisolatie, energielabel-C (+ link naar `/contact`) |
| Warmtepomp | dakisolatie, netcongestie, EIA/ISDE/SDE++ |
| LED | EIA/ISDE/SDE++, verborgen energieverspillers (+ link naar `/cases`) |
| Verborgen energieverspillers | LED, dakisolatie |

**Belangrijkste bevinding — ontbrekende inkomende links**: `batterijopslag-voor-uw-bedrijfspand` en `ventilatie-in-uw-bedrijfspand` hebben momenteel **geen enkele inkomende link** vanuit een ander artikel (ze linken alleen naar buiten). Dit is een concrete, feitelijk vastgestelde kans voor een toekomstige "interne linking"-fase: bijvoorbeeld vanuit `netcongestie-hoeksche-waard` (dat al een eigen H3 "Batterijopslag" heeft) naar het batterijopslag-artikel, en vanuit `verborgen-energieverspillers` (dat ventilatie al noemt) naar het ventilatie-artikel. **Dit is nog niet uitgevoerd** — het zou een wijziging aan bestaande artikelen vereisen, wat buiten de scope van fase 14 valt.

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
- **Performance**: niet formeel onderzocht (geen Lighthouse/Core Web Vitals-metingen in de repository of git history aangetroffen) — **onbekend**, aanbevolen als toekomstige technische SEO-audit.
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
| 1 | Interne linking bijwerken | Batterijopslag en ventilatie een inkomende link geven vanuit netcongestie resp. verborgen-energieverspillers | Concreet vastgestelde lacune (zie "Interne linkstrategie") | Wijziging aan bestaande artikelen — vereist expliciete goedkeuring | **P1** | Kortetermijn, lage inspanning |
| 2 | Search Console-analyse | Zodra data beschikbaar is: impressies, CTR, posities, zoekopdrachten per pagina analyseren | Data-gedreven prioritering is veel betrouwbaarder dan verder gokken op content gaps | Toegang tot Search Console (nu niet beschikbaar — zie sectie hieronder) | **P1**, zodra data er is | Zo snel mogelijk na voldoende indexatie/verkeer |
| 3 | Contentoptimalisatie bestaande artikelen | Oudere artikelen (energielabel-C, netcongestie, dakisolatie, EIA-subsidies, warmtepomp, LED, verborgen-energieverspillers) herzien op actualiteit van cijfers/regelgeving | Feiten uit eerdere fases kunnen na verloop van tijd verouderen (subsidiebedragen, drempels, wetsartikelen) | Primaire bronverificatie per artikel | **P2** | Periodiek, bijv. ieder kwartaal of bij bekende wetswijziging |
| 4 | Verdere content gaps | Zie tabel "Content gaps" hierboven | Nog niet alle relevante zoekintenties zijn gedekt | Nieuwe primaire bronverificatie per onderwerp | **P2/P3** afhankelijk van onderwerp | Na Search Console-inzicht, niet blind doorgaan |
| 5 | Commerciële/conversie-SEO | De paden content → `/energie-indicatie` → `/contact` optimaliseren (zie "Commercieel pad"-sectie in de content map) | Meer content zonder conversieverbetering levert minder waarde op dan gerichte funnel-optimalisatie | Geen technische blokkade; vraagt wel bewuste, losse goedkeuring omdat het bestaande pagina's raakt | **P2** | Nadat er voldoende verkeersdata is om knelpunten te identificeren |
| 6 | Lokale SEO | Overwegen of een aparte, goed onderbouwde uitbreiding van lokale signalen (bijv. per-kern content, meer expliciete NAP-consistentie) waarde toevoegt naast de al bestaande `/werkgebied`-pagina | Werkgebied bestaat al en dekt de regio; verdere uitbreiding moet aantoonbare zoekintentie hebben, geen aanname | Zie "Lokale SEO"-sectie in `SEO-CONTENT-MAP.md` | **P3** | Alleen na concrete aanwijzing (bijv. Search Console-zoekwoorden per kern) |
| 7 | Technische SEO-audit | Performance/Core Web Vitals, en herbevestiging van prerendering/canonical/structured data op schaal (24+ routes) | Nooit formeel gemeten; risico neemt toe naarmate het aantal routes groeit | Geen | **P2** | Ruim vóór het volgende grote contentblok, of bij twijfel over laadtijd |
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
