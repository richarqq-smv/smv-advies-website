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
| Concurrenten | Zie *Concurrenten* hieronder |
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

## Concurrenten

Verzameld via webzoekopdrachten op 22-10-2026. Niet elke site is zelf gecontroleerd: gebruik dit om
te zien wie op dezelfde zoekwoorden mikt, niet als feitenbron voor sitetekst. Geen enkele partij
gevonden die zelf in de Hoeksche Waard zit en zakelijk verduurzamingsadvies geeft.

**Klein en regionaal — de echte concurrenten**

| Partij | Plaats | Aanbod | Verschil met SMV |
| --- | --- | --- | --- |
| Van Wendel Energie Advies | Zwijndrecht | Erkend energielabel utiliteitsgebouwen | Label, geen breed verduurzamingsadvies |
| SENS Consult (sensconsult.nl) | Barendrecht | Verduurzamingsadvies en energielabels, advies en uitvoering onder één dak | Verdient ook aan uitvoering: niet onafhankelijk |
| Energizi Advies | Barendrecht | Energielabels en verduurzaming bedrijfspanden | — |
| Adviesbureau Pors (milieu, energie, omgevingskwaliteit) | Ridderkerk | Mkb-energieadviseur (DEB-lijst) | — |
| De Duurzame Specialisten (deduurzamespecialisten.nl) | Onbekend | Maatwerkadvies bedrijfspand met investering en terugverdientijd per maatregel | Lijkt het meest op het Basis Pakket |
| Energiespecialist MKB (energiespecialistmkb.nl) | Onbekend | Energiecontracten en verduurzaming (zon, laadpalen, batterijen), zegt geen commissie te krijgen | Meer contract- en installatiegericht |
| FW Energy, Duvepa | Werkgebied o.a. Dordrecht/Strijen | Energielabels, ook bedrijfspanden | Label, geen breed advies |

**Groot, landelijk of gratis — ter vergelijking**

- Landelijk mkb-energieadvies: Hezelaer, Vattenfall mkb (beide energieleveranciers), MKB Energie Adviseur, Energie voor MKB, MKB Energie Expert (krijgt vergoeding per energiecontract), Zakelijk Centraal.
- Energielabels/vastgoed: 1energielabel Zakelijk (Zuid-Holland), Opstal Adviseurs, Renewable Partners (Amsterdam/Breda).
- Gratis gemeentelijk: Zakelijk loket Hoeksche Waard / Energieke Regio, Zakelijk Energieloket Barendrecht en Ridderkerk.

Sterke punten van SMV tegenover deze lijst: lokaal in de Hoeksche Waard, en onafhankelijk (geen
uitvoering, geen energiecontracten).

## Openstaande acties voor Richard

Stand 22 oktober 2026. De wekelijkse check werkt deze lijst bij en haalt een punt pas weg als
Search Console laat zien dat het gelukt is.

| Actie | Waar | Stand 22-10-2026 |
| --- | --- | --- |
| `sitemap.xml` opnieuw indienen | Search Console → Sitemaps | Gedaan: ingediend 22-10 06:15 UTC, door Google opgehaald 06:15:59 UTC, 40 URL's gemeld |
| Indexering aanvragen voor `/pakketten` | URL-inspectie | Aangevraagd 22-10 (in prioriteitswachtrij); nog niet geïndexeerd |
| Indexering aanvragen voor `/contact` | URL-inspectie | Aangevraagd 22-10 (in prioriteitswachtrij); nog niet geïndexeerd |
| Indexering aanvragen voor `/werkwijze` | URL-inspectie | Aangevraagd 22-10 (in prioriteitswachtrij); nog niet geïndexeerd |
| Indexering aanvragen voor `/energie-indicatie` | URL-inspectie | Aangevraagd 22-10 (in prioriteitswachtrij); nog niet geïndexeerd |
| Google Bedrijfsprofiel aanmaken | business.google.com | Nog niet gedaan (later, ivm tijd). Alle gegevens staan klaar in `bedrijfsprofiel.md` |
