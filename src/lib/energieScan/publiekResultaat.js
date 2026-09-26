/**
 * De publieke kant van de Energie Indicatie: wat een bezoeker te zien krijgt
 * (op het scherm en in de bevestigingsmail), afgeleid uit de volledige
 * berekening van berekenResultaat() in calculations.js.
 *
 * De Energie Indicatie is een gratis eerste indruk, geen verduurzamingsadvies.
 * Daarom bevat de publieke versie bewust GEEN maatregelen met investering,
 * besparing of terugverdientijd, geen totale besparing, geen CO2-besparing en
 * geen rangorde van maatregelen — dat is het werk van een adviestraject. De
 * volledige berekening blijft wel bestaan: ze gaat ongewijzigd mee in de
 * interne leadmail naar SMV Advies (buildEmailParams in emailParams.js), zodat
 * SMV het vervolggesprek goed voorbereid kan voeren.
 *
 * De berekening zelf (calculations.js/constants.js) wordt hier niet
 * aangepast — dit is uitsluitend een presentatielaag.
 */

/**
 * Welk aandachtsgebied hoort bij welke maatregel uit berekenMaatregelen().
 * De teksten noemen bewust geen bedragen en geen volgorde, en leggen uit
 * waarom de juiste stap afhangt van meer dan energie.
 */
const AANDACHTSGEBIEDEN = {
  Dakisolatie: {
    id: 'dak',
    titel: 'Dak',
    toelichting:
      'Via het dak gaat in veel bedrijfspanden relatief veel warmte verloren. Of isoleren nu verstandig is, hangt af van de staat van het dak en wanneer daar onderhoud of vervanging gepland staat.',
  },
  'Gevel- / spouwmuurisolatie': {
    id: 'gevel',
    titel: 'Gevel',
    toelichting:
      'De gevel lijkt een verliespost. Of gevel- of spouwmuurisolatie zinvol is, hangt af van de bouwwijze en de staat van de gevel.',
  },
  'HR++ of triple beglazing': {
    id: 'beglazing',
    titel: 'Ramen en beglazing',
    toelichting:
      'Het glas lijkt energie te kosten. Vervangen is vaak het meest logisch op het moment dat kozijnen of ramen toch al aan vervanging toe zijn.',
  },
  Vloerisolatie: {
    id: 'vloer',
    titel: 'Vloer',
    toelichting:
      'De vloer lijkt niet of matig geïsoleerd. Of isoleren haalbaar is, hangt onder meer af van hoe goed de vloer bereikbaar is, bijvoorbeeld via een kruipruimte.',
  },
  'Overstap naar (volledige) warmtepomp': {
    id: 'verwarming',
    titel: 'Verwarming',
    toelichting:
      'De verwarming bepaalt een groot deel van het energieverbruik. Of en wanneer een andere oplossing verstandig is, hangt af van de leeftijd van de installatie en van de isolatie van het pand.',
  },
  'LED-verlichting + sensoren': {
    id: 'verlichting',
    titel: 'Verlichting',
    toelichting:
      'Verlichting is vaak een relatief eenvoudige stap. Hoe groot het effect is, hangt af van de huidige verlichting en de gebruikstijden in het pand.',
  },
}

export const MAX_AANDACHTSPUNTEN = 3

/**
 * Publieke teksten per band. De teksten in SCORE_BANDS (constants.js)
 * verwijzen naar "de maatregelen hieronder" en beloven besparing; die
 * maatregelen toont de publieke indicatie niet meer. SCORE_BANDS zelf blijft
 * ongewijzigd (de interne leadmail gebruikt ze nog) — dit is de publieke
 * weergave. Alleen de status van band 5 wijkt af: "grote kans op besparing"
 * is een claim die een indicatie niet kan waarmaken.
 */
const PUBLIEKE_BANDTEKST = {
  1: {
    desc: 'Uw pand scoort op basis van uw antwoorden al sterk op energiegebied. Of er nog iets verstandig is om te doen, hangt vooral af van onderhoud en timing.',
  },
  2: {
    desc: 'Uw pand presteert op basis van uw antwoorden bovengemiddeld. Er zijn nog aandachtspunten, maar niet alles hoeft nu.',
  },
  3: {
    desc: 'Uw pand presteert op basis van uw antwoorden gemiddeld. Er zijn duidelijke aandachtspunten; de vraag is welke stap wanneer verstandig is.',
  },
  4: {
    desc: 'Op basis van uw antwoorden lijkt er op meerdere plekken energie verloren te gaan. Juist dan is het belangrijk om de juiste volgorde te bepalen.',
  },
  5: {
    status: 'Veel energieverlies',
    desc: 'Op basis van uw antwoorden verbruikt dit pand vermoedelijk aanzienlijk meer energie dan nodig. Waar u het beste kunt beginnen, hangt ook af van onderhoud en geplande vervanging.',
  },
}

/** Wat de Energie Indicatie niet kan weten — de overgang naar het advies van SMV. */
export const WAT_DEZE_INDICATIE_NIET_WEET = [
  'hoe het onderhoud van uw pand ervoor staat;',
  'welke onderdelen binnenkort toch al vervangen moeten worden;',
  'wat er in een meerjarenonderhoudsplan (MJOP) staat;',
  'wat de technische staat van dak, gevel en installaties is;',
  'wanneer een investering logisch te combineren is met onderhoud dat al gepland staat;',
  'welke maatregelen elkaar beïnvloeden of samen moeten worden bekeken;',
  'wat voorlopig beter kan wachten;',
  'welke volgorde voor uw hele pand verstandig is.',
]

const BRON_TOELICHTING = {
  opgave: 'op basis van het verbruik dat u heeft opgegeven',
  kosten: 'geschaald naar de maandelijkse energiekosten die u heeft opgegeven',
  schatting: 'geschat op basis van de kenmerken van uw pand',
}

function stapVoor(bedrag) {
  if (bedrag < 5000) return 250
  if (bedrag < 20000) return 500
  return 1000
}

/**
 * Een afgeronde bandbreedte rond de geschatte jaarlijkse energiekosten, in
 * plaats van één exact bedrag: de invoer is globaal, dus een exact getal zou
 * meer precisie suggereren dan er is. `null` als er geen bruikbaar bedrag is.
 */
export function energiekostenBandbreedte(jaarKosten) {
  if (!Number.isFinite(jaarKosten) || jaarKosten <= 0) return null
  const stap = stapVoor(jaarKosten)
  const min = Math.max(0, Math.floor((jaarKosten * 0.85) / stap) * stap)
  const max = Math.ceil((jaarKosten * 1.15) / stap) * stap
  return { min, max }
}

/** De 2–3 belangrijkste aandachtsgebieden, zonder bedragen of rangnummers. */
export function aandachtspunten(maatregelen = []) {
  const gezien = new Set()
  const punten = []
  for (const maatregel of maatregelen) {
    const gebied = AANDACHTSGEBIEDEN[maatregel.naam]
    if (!gebied || gezien.has(gebied.id)) continue
    gezien.add(gebied.id)
    punten.push({ ...gebied })
    if (punten.length === MAX_AANDACHTSPUNTEN) break
  }
  return punten
}

/**
 * Bouwt de publieke uitkomst van de Energie Indicatie uit de volledige
 * interne berekening. Bevat uitsluitend: score, band, een
 * energiekostenbandbreedte met toelichting op de herkomst, en maximaal drie
 * aandachtspunten.
 */
export function bouwPubliekResultaat(resultaat) {
  return {
    score: resultaat.score,
    band: {
      band: resultaat.band.band,
      status: PUBLIEKE_BANDTEKST[resultaat.band.band]?.status ?? resultaat.band.status,
      desc: PUBLIEKE_BANDTEKST[resultaat.band.band]?.desc ?? resultaat.band.desc,
    },
    energiekosten: energiekostenBandbreedte(resultaat.huidigeKosten),
    energiekostenBron: BRON_TOELICHTING[resultaat.huidig?.bron] ?? BRON_TOELICHTING.schatting,
    aandachtspunten: aandachtspunten(resultaat.maatregelen),
  }
}
