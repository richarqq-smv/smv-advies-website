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

Stand 23 november 2026. De wekelijkse check werkt deze lijst bij en haalt een punt pas weg als
Search Console laat zien dat het gelukt is.

| Actie | Waar | Stand 23-11-2026 |
| --- | --- | --- |
| Pull request van 23 november (`seo/weekcheck-2026-11-23`) mergen en de oudere weekcheck-pull requests (#12, #13, #14) sluiten | GitHub | Open: er is sinds 26-10 niets gemerged, dus de sitemapreparatie en de energielabel-tekst staan nog steeds niet live. Deze pull request bevat beide; #12 en #13 korten ook de titel van het isolatie-artikel in, die in #11 bewust ongewijzigd bleef |
| `sitemap.xml` opnieuw indienen | Search Console → Sitemaps | Na de merge nodig: 42 URL's (2 nieuwe artikelen). Laatst opgehaald 14-11 (40 URL's, 0 fouten) |
| Indexering aanvragen voor `/blog/veelgemaakte-fouten-verduurzamen-bedrijfspand` en `/blog/mjop-en-verduurzamingsadvies-verschil` | URL-inspectie | Na merge en opnieuw indienen. Nu: onbekend bij Google |
| Indexering aanvragen voor `/pakketten`, `/contact`, `/werkwijze`, `/energie-indicatie`, `/blog`, `/trustpilot` | URL-inspectie | Gelukt (29 van 40 pagina's geïndexeerd) |
| Indexering aanvragen voor `/faq`, `/werkgebied`, `/cases` | URL-inspectie | Open: `/faq` en `/werkgebied` gevonden, niet geïndexeerd; `/cases` onbekend bij Google. Geen van drieën ooit gecrawld |
| Indexering aanvragen voor `/blog/warmtepomp-in-het-mkb`, `/blog/verborgen-energieverspillers`, `/blog/laadpalen-op-uw-bedrijfsterrein`, `/blog/ventilatie-in-uw-bedrijfspand`, `/blog/batterijopslag-voor-uw-bedrijfspand`, `/blog/zonnepanelen-op-uw-bedrijfspand`, `/blog/eia-isde-sde-subsidies`, `/blog/verduurzamingsmaatregelen-bedrijfspand` | URL-inspectie | Open: alle acht gevonden, niet geïndexeerd |
| Google Bedrijfsprofiel aanmaken | business.google.com | Nog niet gedaan (later, ivm tijd). Alle gegevens staan klaar in `bedrijfsprofiel.md`. Extra reden: voor "smv" (52 vertoningen) toont Google vooral `/contact` en `/privacy` |
