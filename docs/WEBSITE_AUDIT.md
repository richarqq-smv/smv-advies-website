# Website-audit — samenvatting

> Dit document bundelt de bevindingen uit meerdere eerdere audits (technisch, SEO, commercieel, live-site) plus de nieuwe bevindingen uit de pre-launch-correctie. Voor de volledige, gedetailleerde geschiedenis: zie `docs/SEO-ROADMAP.md` (technisch/SEO, formeel afgesloten) en `docs/COMMERCIAL-REVIEW.md` (commercieel/UX).

## UX

- Navigatie, informatiearchitectuur en CTA-hiërarchie zijn consistent: elke pagina eindigt met dezelfde twee kernroutes (energie-indicatie, contact).
- Mobiele UX: sticky actiebalk (Indicatie/Bellen) + een floating contact-FAB zijn beide aanwezig; er is bewijs dat dit patroon eerder getest is (code-comment in `ContactFab.jsx`), dus niet zelfstandig gewijzigd zonder nieuwe data.
- Formulieren: alleen de energiescan heeft een echt formulier (4 stappen, goede validatie, foutmeldingen, focus states). `/contact` heeft bewust geen formulier — alleen directe mailto/tel-links.

## CRO

- Primaire/secundaire/tertiaire CTA's zijn consistent: energie-indicatie (primair), pakketten (secundair), contact (tertiair).
- **Gecorrigeerd in deze fase**: een badge "Meest gekozen" op het Premium-pakket en de tekst "de meeste ondernemers kiezen voor het Premium Pakket" impliceerden klantgedrag dat er (pre-launch) nog niet is. Vervangen door "Aanbevolen" (redactionele keuze) en een feitelijke vergelijking.
- **Gecorrigeerd in deze fase**: de 3 cases op de homepage en `/cases` toonden specifieke, overtuigend ogende cijfers (bijv. "58% besparing", "Gasverbruik gehalveerd") die feitelijk fictief/placeholder waren. Volledig verwijderd — zie `docs/COMMERCIAL-REVIEW.md` voor de correctie.

## SEO

- Title/meta/canonical/H1 op alle pagina's uniek en aanwezig (bevestigd, meermaals herverifieerd — zie `SEO-ROADMAP.md`).
- Structured data (Organization, WebSite, BreadcrumbList, FAQPage, BlogPosting) aanwezig, uitsluitend met echte gegevens.
- Interne linkstrategie: BLOG ⇄ DIENST ⇄ CASE ⇄ CTA-pad is doorlopend (zie `SEO-CONTENT-MAP.md`).
- Sitemap/robots.txt aanwezig en correct.
- Geen Search Console-toegang — data-gedreven vervolgstappen (welke pagina's, welke zoekwoorden) zijn nog niet mogelijk.

## Performance

- Headerlogo geoptimaliseerd (731 KB → 12,7 KB, eerdere fase).
- Geen Lighthouse/Core Web Vitals-tool beschikbaar in de sessie-omgeving — niet gemeten, alleen via directe inspectie van build-output en netwerkgedrag.
- Code-splitting per route (React.lazy) al aanwezig; homepage laadt eager, overige pagina's lazy.

## Accessibility

- Formuliervelden hebben correcte `aria-invalid`/`aria-describedby`/`role="alert"`.
- Knoppen hebben zichtbare `focus-visible`-states.
- Semantische HTML (headings, `<nav>`, `<button>` vs `<a>`) consistent toegepast in de gedeelde UI-componenten.
- Niet systematisch getest met een screenreader of geautomatiseerde WCAG-scanner in deze sessie — alleen structureel/code-niveau gecontroleerd.

## Technical quality

- Lint en build slagen zonder fouten (herhaaldelijk geverifieerd).
- **Gefixt (eerdere sessie)**: directe 404's toonden GitHub Pages' eigen kale foutpagina in plaats van de site's `NotFound`-component — nu opgelost via `scripts/prerender.mjs`.
- Geen gebroken interne links (geautomatiseerde audit over alle geprerenderde pagina's).
- Geen console-errors op de geteste routes.

## Prioriteitenlijst (P0–P3)

| Prioriteit | Item | Status |
|---|---|---|
| P0 | Fictieve cases verwijderen/vervangen | Opgelost in deze fase |
| P0 | "Meest gekozen"/social-proof-claims zonder klantdata | Opgelost in deze fase |
| P1 | Onafhankelijkheid als sterkere, eigen sectie | Opgelost in deze fase (`Independence.jsx`) |
| P1 | Probleemherkenning op homepage | Opgelost in deze fase (`ProblemRecognition.jsx`) |
| P1 | Pakketten als "Oriënteren/Beslissen/Ontzorgd worden" | Opgelost in deze fase |
| P1 | Hero-copy scherper op kernbelofte | Opgelost in deze fase |
| P2 | Founder-/pandfoto's | Vereist eigenaarsinput (zie `CONTENT_NEEDED.md`) |
| P2 | Eerste echte case | Vereist een afgerond klanttraject (zie `CASE_TEMPLATE.md`) |
| P2 | Core Web Vitals-meting | Vereist tooling die nu niet beschikbaar is |
| P3 | Lokale SEO-uitbreiding per plaatsnaam | Bewust uitgesteld tot Search Console-data beschikbaar is (voorkomt dunne content) |
| P3 | README.md bijwerken met projectspecifieke info | Cosmetisch, geen functionele noodzaak |
