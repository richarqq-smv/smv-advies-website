import {
  BOUWJAAR_SCORE,
  CO2_PER_M3_GAS,
  DAK_FACTOR,
  ELEKPRIJS,
  GAS_BASIS_BOUWJAAR,
  GASPRIJS,
  GEVEL_FACTOR,
  GLAS_FACTOR,
  GLAS_SCORE,
  ISOLATIE_FACTOR,
  KWALITEIT_SCORE,
  SCORE_BANDS,
  TYPE_ELEK_KWH_M2,
  TYPE_GAS_FACTOR,
  VERWARMING_SCORE,
  VLOER_FACTOR,
} from './constants'

/** Average of the three insulation multiplier factors (gevel/dak/vloer). */
export function gemIsolatieFactor(values) {
  const factors = [values.isolatie_gevel, values.isolatie_dak, values.isolatie_vloer].map(
    (v) => ISOLATIE_FACTOR[v] ?? ISOLATIE_FACTOR.onbekend,
  )
  return (factors[0] + factors[1] + factors[2]) / 3
}

/** Duurzaamheidsscore, 0-100. */
export function berekenDuurzaamheidsscore(values) {
  const isolatieAvg =
    (KWALITEIT_SCORE[values.isolatie_gevel] + KWALITEIT_SCORE[values.isolatie_dak] + KWALITEIT_SCORE[values.isolatie_vloer]) / 3
  const glas = GLAS_SCORE[values.beglazing]
  const verwarming = VERWARMING_SCORE[values.verwarming]
  const bouwjaar = BOUWJAAR_SCORE[values.bouwjaar]
  const score = isolatieAvg * 0.35 + glas * 0.2 + verwarming * 0.25 + bouwjaar * 0.2
  return Math.max(0, Math.min(100, Math.round(score)))
}

export function getScoreBand(score) {
  return SCORE_BANDS.find((b) => score >= b.min)
}

function schatGasVerbruik(values) {
  const basis = GAS_BASIS_BOUWJAAR[values.bouwjaar]
  const isolatieFactor = gemIsolatieFactor(values)
  const typeFactor = TYPE_GAS_FACTOR[values.pandtype]
  return values.oppervlakte * basis * isolatieFactor * typeFactor
}

function schatElekVerbruik(values) {
  return values.oppervlakte * TYPE_ELEK_KWH_M2[values.pandtype]
}

/**
 * Bepaalt het huidige verbruik: opgegeven waarden krijgen voorrang; als
 * zowel gas als elektra ontbreken maar de maandkosten wel zijn ingevuld,
 * wordt de schatting naar die kosten geschaald (geclampt 0.4x-2.5x).
 */
export function bepaalHuidigVerbruik(values) {
  const gas = values.gasverbruik
  const elek = values.elekverbruik

  const gasGeschat = schatGasVerbruik(values)
  const elekGeschat = schatElekVerbruik(values)

  if (gas == null && elek == null && values.energiekosten) {
    const jaarKosten = values.energiekosten * 12
    const geschatteKosten = gasGeschat * GASPRIJS + elekGeschat * ELEKPRIJS
    let schaal = geschatteKosten > 0 ? jaarKosten / geschatteKosten : 1
    schaal = Math.max(0.4, Math.min(2.5, schaal))
    return { gas: gasGeschat * schaal, elek: elekGeschat * schaal, bron: 'kosten' }
  }

  return {
    gas: gas != null && gas > 0 ? gas : gasGeschat,
    elek: elek != null && elek > 0 ? elek : elekGeschat,
    bron: gas != null || elek != null ? 'opgave' : 'schatting',
  }
}

/** Geometrische schattingen (dak/gevel/vloer/glas-oppervlak), vierkante plattegrond aangenomen. */
export function geometrie(values) {
  const verd = Math.max(1, Number(values.verdiepingen))
  const footprint = values.oppervlakte / verd
  const zijde = Math.sqrt(footprint)
  const vloerhoogte = 3.5
  const omtrek = 4 * zijde
  const gevelBruto = omtrek * verd * vloerhoogte
  const gevelNetto = gevelBruto * 0.8

  const glasAandeel = values.pandtype === 'kantoor' || values.pandtype === 'winkel' ? 0.28 : 0.15
  const glasOppervlak = gevelBruto * glasAandeel

  return { dak: footprint, vloer: footprint, gevel: gevelNetto, glas: glasOppervlak }
}

/** De 6 kandidaat-maatregelen, gefilterd op relevantie en minimaal besparingsbedrag, top 5. */
export function berekenMaatregelen(values, huidig) {
  const geo = geometrie(values)
  const isolatieAvgFactor = gemIsolatieFactor(values)
  const maatregelen = []

  const dakM3 = geo.dak * DAK_FACTOR[values.isolatie_dak]
  maatregelen.push({
    naam: 'Dakisolatie',
    toelichting:
      'Isoleer het dak — de plek waar bedrijfspanden doorgaans de meeste warmte verliezen. Relatief snel te realiseren met directe impact.',
    besparingM3: dakM3,
    investeringLaag: geo.dak * 35,
    investeringHoog: geo.dak * 55,
    relevant: values.isolatie_dak !== 'goed',
  })

  const gevelM3 = geo.gevel * GEVEL_FACTOR[values.isolatie_gevel]
  maatregelen.push({
    naam: 'Gevel- / spouwmuurisolatie',
    toelichting:
      'Isoleer de buitenmuren om warmteverlies via de gevel terug te dringen en tocht en koude wanden te verminderen.',
    besparingM3: gevelM3,
    investeringLaag: geo.gevel * 85,
    investeringHoog: geo.gevel * 130,
    relevant: values.isolatie_gevel !== 'goed',
  })

  const glasM3 = geo.glas * GLAS_FACTOR[values.beglazing]
  maatregelen.push({
    naam: 'HR++ of triple beglazing',
    toelichting:
      'Vervang enkel, dubbel of verouderd glas door hoogrendementsglas. Vermindert warmteverlies én verhoogt comfort merkbaar.',
    besparingM3: glasM3,
    investeringLaag: geo.glas * 420,
    investeringHoog: geo.glas * 580,
    relevant: values.beglazing !== 'triple' && values.beglazing !== 'hrpp',
  })

  const vloerM3 = geo.vloer * VLOER_FACTOR[values.isolatie_vloer]
  maatregelen.push({
    naam: 'Vloerisolatie',
    toelichting:
      'Isoleer de begane grondvloer tegen koudeverlies naar kruipruimte of grond — met name in oudere panden vaak nog een gemiste kans.',
    besparingM3: vloerM3,
    investeringLaag: geo.vloer * 28,
    investeringHoog: geo.vloer * 42,
    relevant: values.isolatie_vloer !== 'goed',
  })

  const wpBasis = 0.55
  const wpAanpassing = (isolatieAvgFactor - 1.0) * -0.3
  let wpPercentage = Math.max(0.45, Math.min(0.65, wpBasis + wpAanpassing))
  let wpRelevant = true
  if (values.verwarming === 'volledige_wp') wpRelevant = false
  if (values.verwarming === 'hybride_wp') wpPercentage *= 0.45
  if (values.verwarming === 'stadsverwarming') wpRelevant = false
  const wpM3 = huidig.gas * wpPercentage
  maatregelen.push({
    naam: 'Overstap naar (volledige) warmtepomp',
    toelichting:
      'Vervang het gasverwarmingssysteem door een warmtepomp. Werkt het best in combinatie met goede isolatie en levert de grootste stap richting een gasloos pand.',
    besparingM3: wpM3,
    investeringLaag: values.oppervlakte * 55,
    investeringHoog: values.oppervlakte * 95,
    relevant: wpRelevant,
  })

  const ledBesparingKwh = huidig.elek * 0.15
  maatregelen.push({
    naam: 'LED-verlichting + sensoren',
    toelichting:
      'Vervang bestaande verlichting door LED met aanwezigheids- en daglichtsensoren. Lage investering, snelle terugverdientijd — een prima quick win.',
    besparingKwh: ledBesparingKwh,
    investeringLaag: values.oppervlakte * 7,
    investeringHoog: values.oppervlakte * 12,
    relevant: true,
    isElektrisch: true,
  })

  maatregelen.forEach((m) => {
    m.besparingEuro = m.isElektrisch ? m.besparingKwh * ELEKPRIJS : Math.max(0, m.besparingM3) * GASPRIJS
    const investeringMid = (m.investeringLaag + m.investeringHoog) / 2
    m.terugverdientijd = m.besparingEuro > 0 ? investeringMid / m.besparingEuro : null
  })

  return maatregelen
    .filter((m) => m.relevant && m.besparingEuro > 15)
    .sort((a, b) => b.besparingEuro - a.besparingEuro)
    .slice(0, 5)
}

/**
 * Runs the full scan for a given (validated) set of answers. Pure
 * function — no DOM, no side effects — so it can be unit-tested and
 * reused outside the wizard if needed.
 */
export function berekenResultaat(values) {
  const score = berekenDuurzaamheidsscore(values)
  const band = getScoreBand(score)
  const huidig = bepaalHuidigVerbruik(values)
  const maatregelen = berekenMaatregelen(values, huidig)

  const huidigeKosten = huidig.gas * GASPRIJS + huidig.elek * ELEKPRIJS
  const totaleBesparing = maatregelen.reduce((sum, m) => sum + m.besparingEuro, 0)
  const totaleBesparingM3 = maatregelen.reduce((sum, m) => sum + (m.besparingM3 || 0), 0)
  const co2 = totaleBesparingM3 * CO2_PER_M3_GAS

  return { score, band, huidig, maatregelen, huidigeKosten, totaleBesparing, co2 }
}

export function euro(n) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL')
}

export function euroRange(a, b) {
  return '€ ' + Math.round(a).toLocaleString('nl-NL') + ' – € ' + Math.round(b).toLocaleString('nl-NL')
}

export function jaren(n) {
  if (n == null) return '—'
  if (n < 1) return Math.round(n * 12) + ' mnd'
  return (Math.round(n * 10) / 10).toLocaleString('nl-NL') + ' jr'
}
