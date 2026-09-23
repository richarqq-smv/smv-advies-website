# Pre-launch checklist

Wat er moet gebeuren vóór (of bij) de formele start van SMV Advies. Vinkjes zijn een indicatie op basis van de huidige repository-staat, geen garantie — controleer live vóór de daadwerkelijke livegang/KvK-registratie.

## Legal

- [ ] KvK-nummer invullen (`src/data/company.js`)
- [x] Privacyverklaring aanwezig (`src/pages/Privacy.jsx`)
- [x] Algemene voorwaarden aanwezig (`src/pages/Voorwaarden.jsx`)
- [x] Cookiebanner + consent-afhandeling werkend (`CookieBanner.jsx`, GA4 Consent Mode v2)
- [x] Contactgegevens correct en consistent (telefoon, e-mail, adres in `company.js`)

## Brand

- [x] Logo aanwezig (`public/logo.png`, `public/logo-header.png`)
- [x] Kleuren/typografie/design tokens consistent (Tailwind-config + gedeelde UI-componenten)
- [ ] Founder-/portretfoto (zie `CONTENT_NEEDED.md`)
- [ ] Echte bedrijfspandfoto voor de hero (zie `CONTENT_NEEDED.md`)

## Proof

- [ ] Eerste echte praktijkcase (zie `CASE_TEMPLATE.md`) — `/cases` toont tot die tijd bewust geen fictieve cases
- [ ] Eerste testimonial (zie `REVIEW_TEMPLATE.md`, alleen met expliciete toestemming)
- [ ] Reviews (alleen via een echt, gekoppeld platform zoals Google Business Profile — nooit verzinnen)

## SEO

- [x] Unieke titles/meta descriptions op alle pagina's (zie `docs/SEO-ROADMAP.md`)
- [x] Sitemap + robots.txt aanwezig en correct
- [x] Structured data (Organization/WebSite/BreadcrumbList/FAQPage/BlogPosting) geïmplementeerd met alleen echte gegevens
- [ ] Google Search Console gekoppeld (nog geen toegang, zie `docs/SEO-ROADMAP.md`)
- [ ] Google Business Profile aangemaakt (na KvK/livegang)

## Analytics

- [x] GA4 + Consent Mode v2 geïmplementeerd, standaard "denied" tot toestemming
- [x] Geen tracking zonder toestemming van de bezoeker

## Technical

- [x] Formulieren getest (energiescan: validatie, submit, EmailJS-payload — zie eerdere sessieverslagen)
- [x] 404-afhandeling correct (GitHub Pages toont sinds recent de eigen `NotFound`-pagina, niet de generieke GitHub-pagina)
- [x] Lint en build slagen zonder fouten
- [x] Alle 24+ routes rechtstreeks bereikbaar (geen SPA-routingprobleem)
- [ ] Lighthouse/Core Web Vitals-meting (geen tool beschikbaar in de huidige sessie-omgeving — aanbevolen zodra een sessie hier toegang toe heeft)

## Voor livegang specifiek

1. KvK-nummer invullen.
2. Minimaal founder-foto en bedrijfspandfoto aanleveren (voorkomt dat de site bij livegang nog placeholders toont op de belangrijkste plekken).
3. Google Business Profile aanmaken en NAP-gegevens consistent houden met de website.
4. Search Console koppelen zodra mogelijk, voor data-gedreven vervolgstappen.

## Kan na livegang

- Eerste praktijkcases toevoegen zodra klanten dit toestaan.
- Aanvullende contentartikelen uit `CONTENT_PLAN.md`.
- Lokale SEO-uitbreiding, alleen op basis van concrete Search Console-signalen (zie `docs/SEO-CONTENT-MAP.md`, sectie "Lokale SEO").
- Eventueel voorbeeldrapport als lead magnet (zie `WEBSITE_STRATEGY.md`).
