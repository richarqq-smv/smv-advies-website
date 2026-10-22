# SEO — werkmap

Notities, data en weekrapporten van de wekelijkse SEO-check (maandagochtend, als geplande taak in
Claude Code). Elke run schrijft een rapport in `rapporten/` en de ruwe Search Console-cijfers in
`data/`, zodat elke week vergeleken kan worden met de vorige.

## Instellingen

| | |
| --- | --- |
| Site | https://smv-advies.nl (Search Console: `sc-domain:smv-advies.nl`) |
| Wat we verkopen | Onafhankelijk verduurzamings- en bouwkundig advies voor mkb-bedrijfspanden in de Hoeksche Waard (Basis / Premium / Gold, zie `src/data/packages.js`) |
| Doel | Aanvragen via `/contact` en starts van de gratis energie-indicatie (`/energie-indicatie`) uit organisch zoekverkeer in de Hoeksche Waard |
| Concurrenten | _nog invullen door Richard_ — namen/sites van andere adviseurs in de regio |
| Wijzigingen | Altijd als pull request. **Nooit zelf mergen.** |

## Toegang

Search Console via het serviceaccount `smv-seo-reader@smv-seo.iam.gserviceaccount.com`, rechten
**Beperkt** (alleen lezen). De sleutel staat als *network secret* (type "GCP access token") in de
Claude Code-cloudomgeving; de omgeving voegt het token zelf toe aan verzoeken naar
`searchconsole.googleapis.com` en `www.googleapis.com`. Nooit een sleutel in de repo of chat zetten.

Voorbeeld (werkt alleen in die omgeving):

```bash
curl -s https://searchconsole.googleapis.com/webmasters/v3/sites
curl -s -X POST 'https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Asmv-advies.nl/searchAnalytics/query' \
  -H 'Content-Type: application/json' -d '{"startDate":"2026-09-21","endDate":"2026-10-18","dimensions":["query"]}'
```

## Spelregels

- Geen verzonnen claims, cijfers, klanten, reviews of prijzen (zie `CLAUDE.md` en
  `.claude/skills/pro-design/SKILL.md`). Teksten herschrijven mag alleen binnen de bestaande feiten.
- Design-afspraken uit `DESIGN.md` blijven gelden; SEO-wijzigingen mogen de opmaak niet terugdraaien.
- Indexeringsverzoeken en het opnieuw indienen van de sitemap doet Richard in de Search Console-
  interface (het serviceaccount is bewust alleen-lezen).

## Openstaande acties voor Richard

Stand volgens Search Console op 22 oktober 2026. De wekelijkse check werkt deze lijst bij en haalt
een punt pas weg als Search Console laat zien dat het gelukt is.

| Actie | Waar | Stand 22-10-2026 |
| --- | --- | --- |
| `sitemap.xml` opnieuw indienen | Search Console → Sitemaps | Laatst ingediend 28-08-2026, laatst opgehaald 15-10-2026, 30 URL's gemeld (de build heeft er 40) |
| Indexering aanvragen voor `/pakketten` | URL-inspectie | Ontdekt, momenteel niet geïndexeerd |
| Indexering aanvragen voor `/contact` | URL-inspectie | Ontdekt, momenteel niet geïndexeerd |
| Indexering aanvragen voor `/werkwijze` | URL-inspectie | Ontdekt, momenteel niet geïndexeerd |
| Indexering aanvragen voor `/energie-indicatie` | URL-inspectie | URL is onbekend bij Google |
| Concurrenten invullen | Tabel *Instellingen* hierboven | Nog leeg |
