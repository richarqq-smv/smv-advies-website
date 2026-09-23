# Website-strategie — SMV Advies

## Doelgroep

Nederlandse mkb-ondernemers met een eigen of gehuurd bedrijfspand (kantoren, werkplaatsen, bedrijfshallen, loodsen, winkels, kleine productiebedrijven), primair in de Hoeksche Waard, gevestigd in Oud-Beijerland.

## Positionering

**Niet**: "Wij zijn een duurzaam adviesbureau" (te generiek).
**Wel**: "Eerst weten wat verstandig is. Daarna pas investeren."

Kernzin: *SMV helpt u eerst bepalen wat verstandig is. De uitvoering bepaalt u daarna zelf.*

## USP: onafhankelijkheid

SMV Advies verkoopt zelf geen zonnepanelen, warmtepompen, isolatie of andere installaties. Daarom heeft SMV geen belang bij het adviseren van één specifieke oplossing of leverancier. Dit is het sterkste onderscheidend vermogen en heeft sinds deze fase een eigen, prominente sectie op de homepage (`Independence.jsx`) in plaats van één USP-bullet tussen vier.

**Claim-discipline**: gebruik feitelijke formuleringen ("geen verkoop van installaties") in plaats van absolute, niet te onderbouwen claims ("100% onafhankelijk"). Dit is in deze fase aangepast in `usps.js`.

## Value proposition

"Wij helpen ondernemers bepalen welke verduurzamingsmaatregelen technisch én financieel verstandig zijn voordat zij grote investeringen doen."

Klantproblemen die de site moet herkennen (nu expliciet aanwezig via `ProblemRecognition.jsx` op de homepage): hoge energiekosten, onzekerheid over prioriteiten, angst voor verkeerde investeringen, onduidelijke terugverdientijd, onduidelijke subsidies, tijdgebrek, moeite met het vergelijken van offertes.

## CTA-strategie

- **Primair**: Gratis energiecheck (`/energie-indicatie`)
- **Secundair**: Adviespakket aanvragen (`/pakketten`)
- **Tertiair**: Contact opnemen (`/contact`)
- **Content-flow**: blogartikel lezen → doorstromen naar de energiecheck of pakketten.

CTA-copy is concreet, niet generiek ("Gratis energiecheck", "Bekijk de adviespakketten" — niet "Meer informatie").

## Pakketten als producten

Drie pakketten, elk met een eigen mentaal frame (toegevoegd in deze fase als `mindset`-veld in `packages.js`, getoond boven elke pakketnaam):

- **Basis Pakket — Oriënteren**: voor ondernemers die eerst inzicht willen.
- **Premium Pakket — Beslissen**: voor ondernemers die een concreet verduurzamingsplan willen. Gemarkeerd als "Aanbevolen" (redactionele keuze door SMV, expliciet niet als "meest gekozen" — dat zou een klantgedragsclaim zijn waarover geen gegevens beschikbaar zijn).
- **Gold Pakket — Ontzorgd worden**: voor ondernemers die begeleiding willen bij de uitvoering.

Prijzen en features zijn ongewijzigd (bestaande, gepubliceerde bedragen — niet verzonnen).

## Funnel

```
Traffic (Google / SEO / referrals / netwerk)
  ↓
Landing page
  ↓
Energiecheck
  ↓
Lead
  ↓
Intake
  ↓
Adviespakket
  ↓
Gold-begeleiding (optioneel)
```

## Trust-architectuur zonder reviews/cases

Omdat er nog geen gepubliceerde klantresultaten zijn, bouwt de site vertrouwen op via:

- Onafhankelijkheid (sterkste USP, eigen sectie)
- Transparante prijzen (zichtbare bandbreedtes, geen verborgen kosten)
- Duidelijk proces (`/werkwijze`, inclusief expliciet "wat kan wachten" — een maatregel die je beter nog niet uitvoert, versterkt onafhankelijkheid)
- Persoonlijk contact (directe mailto/tel, geen drempelformulier)
- Concrete deliverables (`Cases.jsx` toont nu eerlijk wat een compleet advies bevat, zonder cijfers te verzinnen)
- Lokale focus (Hoeksche Waard, Oud-Beijerland)

Reviews, cases, klantlogo's, foto's en resultaten worden pas toegevoegd zodra ze echt bestaan (zie `CONTENT_NEEDED.md`, `CASE_TEMPLATE.md`, `REVIEW_TEMPLATE.md`).

## Objection handling (aanwezig/aan te vullen in FAQ en copy)

- "Kan ik dit niet gewoon zelf?" → Ja, maar onafhankelijk advies geeft eerst een onderbouwde prioritering vóór u meerdere offertes of investeringen aangaat.
- "Waarom niet direct een installateur bellen?" → Een installateur heeft belang bij zijn eigen product; SMV niet.
- "Moet ik meteen alles uitvoeren?" → Nee — dat is precies waarom prioritering onderdeel is van elk advies.
- "Moet ik zonnepanelen/een warmtepomp nemen?" → Niet automatisch — dat hangt af van de analyse.

## Toekomstige groei (fundering nu, niet alles nu bouwen)

- Meer regio's, meer cases, meer artikelen zodra er data/klanten zijn.
- Eventueel een downloadbaar voorbeeldrapport als lead magnet — alleen als het rapport echt bestaat.
- Lokale SEO-uitbreiding alleen op basis van concrete Search Console-signalen (voorkomt dunne content).
