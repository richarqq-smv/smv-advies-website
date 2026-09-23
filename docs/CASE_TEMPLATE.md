# Case-intaketemplate

> Gebruik dit formulier zodra een adviestraject is afgerond en er een geverifieerde case gepubliceerd kan worden. Vraag de klant elk antwoord expliciet te bevestigen vóór publicatie — vul nooit iets in namens de klant en verzin geen antwoorden.

## Vragen aan de klant

1. Wat voor bedrijf heeft u? (branche, korte omschrijving)
2. Wat voor pand heeft u? (type, bouwjaar, oppervlakte, aantal verdiepingen)
3. Wat was de aanleiding om verduurzamingsadvies aan te vragen?
4. Wat waren de grootste problemen of vragen vooraf?
5. Wat was het energiegebruik (gas/elektra) vóór het advies, indien bekend?
6. Welk pakket heeft SMV Advies uitgevoerd (Basis/Premium/Gold)?
7. Wat heeft SMV Advies onderzocht tijdens het traject?
8. Welke maatregelen zijn geadviseerd, en in welke volgorde?
9. Welke investering hoorde bij het advies (indicatie of daadwerkelijke offertes)?
10. Welke besparing werd verwacht?
11. Welke terugverdientijd werd verwacht?
12. Wat is er daadwerkelijk uitgevoerd (kan afwijken van het advies)?
13. Wat was het echte, gemeten resultaat (indien al bekend — anders leeg laten, nooit invullen met een schatting)?
14. Mag de bedrijfsnaam worden genoemd? (ja/nee/alleen branche + regio)
15. Mag een foto van het pand/traject worden gebruikt? (ja/nee — zo ja: welke foto's, wie maakt ze)
16. Mag een testimonial/quote worden gepubliceerd? (zie `REVIEW_TEMPLATE.md` voor de aparte toestemmingsprocedure)

## Publicatieregels

- Publiceer alleen velden waarvoor expliciete toestemming is gegeven.
- Ontbreekt een antwoord? Laat het veld weg — vul nooit een schatting of gemiddelde in.
- Cijfers (investering/besparing/terugverdientijd) mogen alleen gepubliceerd worden als ze aantoonbaar bij déze klant horen, niet als "typisch" of "gemiddeld" voorbeeld.
- Gebruik de datastructuur hieronder als codeschema zodra de eerste case klaar is voor publicatie — dit is bewust hetzelfde schema als eerder in `cases.js`/`casesDetailed.js` werd gebruikt, zodat de bestaande componenten (of een lichte variant ervan) makkelijk herbruikt kunnen worden.

```js
{
  id: 'slug-van-het-bedrijf-of-de-locatie',
  package: 'Basis' | 'Premium' | 'Gold',
  sector: '...',
  location: '...',
  title: '...',
  description: '...',
  voor: ['...'],
  na: ['...'],
  resultaat: '...',
  imageLabel: '...',
  quote: null, // alleen vullen na REVIEW_TEMPLATE.md-toestemming
  published: false, // handmatig op true zetten na expliciete klantgoedkeuring
}
```
