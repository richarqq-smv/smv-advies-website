# SEO-plan

> De actieve SEO-implementatiefase is formeel afgesloten (zie `docs/SEO-ROADMAP.md`). Dit document is geen nieuwe SEO-fase — het bundelt de bestaande SEO-structuur en documenteert waar toekomstige, datagedreven beslissingen genomen moeten worden. Geen gegarandeerde ranking-claims.

## Keyword-clusters (bestaand, 12 artikelen)

Zie `docs/SEO-CONTENT-MAP.md` voor de volledige, geverifieerde clusterindeling en interne-linkstrategie. Samengevat: wetgeving (energielabel C, energiebesparingsplicht), installaties (zonnepanelen, laadpalen, batterijopslag, warmtepomp, dakisolatie, LED), subsidies (EIA/ISDE/SDE++), en netcongestie/verborgen energieverspillers.

## Pagina's en titles

Alle 24 live routes hebben unieke, geverifieerde title/meta description/canonical/H1 (zie `SEO-ROADMAP.md`, "Technische SEO-status"). Nieuwe pagina's (zoals de herziene `/cases`) zijn meegenomen in deze fase se build-/lintcontrole en behouden dezelfde structuur (`Seo`-component + `getBreadcrumbSchema`).

## Interne linking

BLOG ⇄ DIENST (`/pakketten`) ⇄ CASE (`/cases`) ⇄ CTA-pad is doorlopend — zie `SEO-CONTENT-MAP.md`. De `/cases`-pagina bestaat nog (nu met eerlijke, niet-fictieve inhoud), dus bestaande interne links blijven functioneel.

## Local SEO

**Bijgewerkt 2026-10-16**: sinds 2026-10-15 bestaan er wél 10 losse dorpspagina's (`/oud-beijerland`, `/heinenoord`, `/puttershoek`, `/maasdam`, `/zuid-beijerland`, `/mijnsheerenland`, `/s-gravendeel`, `/klaaswaal`, `/strijen`, `/numansdorp`) — een expliciete klantwens, niet voortgekomen uit Search Console-data. Zie `docs/SEO-CONTENT-MAP.md`, sectie "Dorpspagina's", voor de volledige details (databron, techniek, hoe dunne content is vermeden). `/werkgebied` blijft daarnaast bestaan als overzichtspagina met een interactieve kaart die naar alle 10 doorlinkt.

## Structured data

Organization, WebSite, BreadcrumbList, FAQPage, BlogPosting — allemaal aanwezig, uitsluitend met echte gegevens. Geen ratings/reviews/openingstijden in structured data totdat deze daadwerkelijk correct en actueel zijn.

## Blog-ideeën

Zie `CONTENT_PLAN.md` voor 30 concrete, geprioriteerde content-ideeën voor een eventuele toekomstige contentronde — alleen te starten bij een aantoonbare zoekintentie/content gap, niet om het aantal artikelen te verhogen (zie `SEO-ROADMAP.md`, "Roadmap"-regels).

## Wanneer een nieuwe SEO-fase wél zinvol is

Zie de expliciete triggerlijst in `docs/SEO-ROADMAP.md` ("Projectstatus — actieve implementatie afgesloten"): Search Console-toegang, een meetbare verkeersdaling, hoge-impressies/lage-CTR-pagina's, posities net buiten pagina 1, nieuwe wet-/subsidieregelgeving, een nieuwe dienst, of nieuwe echte cases.
