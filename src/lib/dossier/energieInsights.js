/**
 * Energie-indicatie → kandidaat-signalen voor de bestaande Advieslaag
 * (Energie-indicatie Fase 4). Zelfde rol als buildInsights() in
 * lib/mjop/linking.js, voor een ander domein: puur functioneel, geen
 * database, geen React, geen side effects, geen UUID/Date.now() — een
 * kandidaat-signaal is per definitie afgeleid, nooit zelf opgeslagen.
 *
 * Bewust beperkt tot ÉÉN categorie: één kandidaat-signaal per opgeslagen
 * maatregel in `snapshot.resultaat.maatregelen`. Die maatregelen waren op
 * het moment van meten al door de calculator gefilterd op relevantie (zie
 * berekenMaatregelen() in lib/energieScan/calculations.js) — dit bouwt dus
 * geen nieuwe drempel/norm, het maakt alleen een al bestaande, al
 * opgeslagen beoordeling zichtbaar als aanleiding voor menselijke
 * beoordeling. Andere denkbare categorieën (score/band als signaal,
 * ontbrekende verbruiksgegevens als signaal) zijn bewust NIET
 * geïmplementeerd: die zouden dichter tegen een eigen inhoudelijk oordeel
 * aanliggen ("uw score is laag, dus...") dan tegen het doorgeven van een
 * concrete, al bestaande aanbeveling. Zie het Fase 4-rapport.
 *
 * Uitsluitend snapshot-data: roept nooit een functie uit
 * lib/energieScan/calculations.js aan (geen berekening, geen
 * herinterpretatie) — alle bedragen komen letterlijk uit de bevroren
 * snapshot. Voor de tekstweergave hieronder (`euro`/`euroRange`) wordt
 * bewust geen import gebruikt: calculations.js importeert zelf `from
 * './constants'` zonder extensie, wat de kale Node-testrunner niet kan
 * oplossen (zelfde bekende beperking als bij energieAdapter.test.js) — en
 * dat bestand wijzigen staat expliciet niet toe. De twee formatters
 * hieronder zijn dus een letterlijke, 1-op-1 kopie van euro()/euroRange()
 * uit calculations.js (zelfde formule, zelfde uitvoer), puur om die
 * importketen te vermijden — geen nieuwe of afwijkende notatie.
 *
 * Bewust geen `status`/`statusLabel`-veld (in tegenstelling tot een
 * MJOP-insight): een kandidaat-signaal krijgt nooit automatisch een van de
 * vijf adviesstatussen — dat blijft een bewuste keuze bij het promoveren
 * (zie DossierWerkruimte.jsx's startVanuitEnergieSignaal(), dat het
 * statusveld leeg laat, in tegenstelling tot MJOP's startVanuitSignaal()).
 */
import { formatUitgevoerdOp } from './energieSnapshotFormat.js'

function euro(n) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL')
}

function euroRange(a, b) {
  return euro(a) + ' – ' + euro(b)
}

function buildReden(maatregel, uitgevoerdOp) {
  const details = []
  if (maatregel.besparingEuro != null) details.push(`geschatte besparing ${euro(maatregel.besparingEuro)}/jaar`)
  if (maatregel.investeringLaag != null && maatregel.investeringHoog != null) {
    details.push(`investering ${euroRange(maatregel.investeringLaag, maatregel.investeringHoog)}`)
  }
  const detailTekst = details.length > 0 ? ` (${details.join(', ')})` : ''

  return (
    `De Energie-indicatie van ${formatUitgevoerdOp(uitgevoerdOp)} signaleerde "${maatregel.naam}" als mogelijke maatregel${detailTekst}. ` +
    'Dit kan een aanleiding zijn om dit nader te bespreken — geen conclusie, alleen input voor beoordeling.'
  )
}

/**
 * Bouwt de kandidaat-signalen uit één Dossier-Energie-snapshot. `null`/een
 * snapshot zonder (geldige) maatregelenlijst levert altijd een lege array
 * op, nooit een crash. `energieMaatregelId` (de maatregelnaam zelf, bijv.
 * "Dakisolatie") is de stabiele identiteit — dezelfde soort, niet-
 * tijdgebonden identiteit als MJOP's `componentId`, zodat een eenmaal
 * gepromoveerd signaal niet opnieuw als kandidaat verschijnt (zie
 * DossierWerkruimte.jsx). Maatregelnamen komen uit een vaste, kleine set
 * (calculations.js's berekenMaatregelen()), dus deze identiteit is
 * voorspelbaar en stabiel binnen dezelfde snapshot.
 */
export function buildEnergieInsights(snapshot) {
  const maatregelen = snapshot?.resultaat?.maatregelen
  if (!Array.isArray(maatregelen)) return []

  return maatregelen
    .filter((m) => m && typeof m.naam === 'string' && m.naam.trim())
    .map((maatregel) => ({
      energieMaatregelId: maatregel.naam,
      herkomst: 'energie',
      onderwerp: `Energie-indicatie: ${maatregel.naam}`,
      reden: buildReden(maatregel, snapshot.uitgevoerd_op),
      maatregelNaam: maatregel.naam,
      besparingEuro: maatregel.besparingEuro ?? null,
      investeringLaag: maatregel.investeringLaag ?? null,
      investeringHoog: maatregel.investeringHoog ?? null,
      terugverdientijd: maatregel.terugverdientijd ?? null,
      uitgevoerdOp: snapshot.uitgevoerd_op ?? null,
    }))
}
