/**
 * Pure data-assembly voor een adviesrapport (.docx), op basis van de drie
 * bestaande klanttemplates (Basis/QuickScan, Premium, Gold — zie
 * src/assets/rapportTemplates/). Bouwt uitsluitend een gestructureerd
 * data-object; vult zelf geen document, roept geen AI aan, verzint geen
 * bedragen of teksten die niet uit het dossier komen (randvoorwaarden
 * 3-4). Ontbrekende informatie wordt expliciet gemarkeerd in
 * `ontbrekendeVelden`, nooit stilzwijgend leeg gelaten of geraden.
 *
 * Gebruikt uitsluitend DEFINITIEVE adviespunten, nooit automatische
 * signalen/kandidaten (randvoorwaarde 5) — de aanroeper geeft dus altijd
 * het resultaat van listAdviespunten() door, nooit buildInsights()/
 * buildEnergieInsights().
 */
import { STATUSES } from '../mjop/constants.js'

export const PAKKET_RAPPORT_LABELS = {
  basis: 'Basis Pakket — QuickScan',
  premium: 'Premium Pakket — Volledige analyse',
  gold: 'Gold Pakket — Volledige ontzorging',
}

function formatDatum(input) {
  const datum = input ? new Date(input) : new Date()
  if (Number.isNaN(datum.getTime())) return null
  return datum.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatEuro(bedrag) {
  if (bedrag == null) return null
  return '€ ' + Number(bedrag).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatEuroRange(laag, hoog) {
  const laagTekst = formatEuro(laag)
  const hoogTekst = formatEuro(hoog)
  if (laagTekst && hoogTekst && Number(laag) !== Number(hoog)) return `${laagTekst} – ${hoogTekst}`
  return laagTekst ?? hoogTekst
}

/**
 * Klantnaam/pandadres voor de metatabel — dezelfde brongegevens als
 * dossierExport.js, hier alleen samengevoegd tot leesbare tekst i.p.v.
 * losse objecten. Bedrijfsnaam gaat voor persoonsnaam als aanhef
 * (zakelijke context), met de contactpersoon als aanvulling.
 */
function bouwKlantgegevens(dossier) {
  const klant = dossier?.klanten ?? null
  const contact = dossier?.contactpersonen ?? null
  const pand = dossier?.panden ?? null

  const klantnaam = klant?.bedrijfsnaam || klant?.naam || contact?.naam || null
  const adresregel = pand?.adres || null
  const plaatsregel = [pand?.postcode, pand?.plaats].filter(Boolean).join(' ') || null
  const pandadres = [adresregel, plaatsregel].filter(Boolean).join(', ') || null

  return { klantnaam, pandadres }
}

/**
 * Bedrijfsgegevens van SMV zelf voor de metatabel — uit `instellingen`
 * (factuur_instellingen/Administratie Instellingen, zelfde bron als
 * Offerte/Factuur), nooit uit de statische data/company.js. Alleen de
 * velden die relevant zijn om het adviesbureau te kunnen identificeren/
 * bereiken; financieel-administratieve velden (IBAN, btw-id, KvK,
 * betalingsvoorwaarden e.d.) horen hier niet thuis — die zijn specifiek
 * voor facturatie, niet voor een adviesrapport.
 */
function bouwBedrijfsgegevens(instellingen) {
  const bedrijfsnaam = instellingen?.bedrijfsnaam || null
  const adresregel = instellingen?.adres || null
  const plaatsregel = [instellingen?.postcode, instellingen?.plaats].filter(Boolean).join(' ') || null
  const bedrijfsadres = [adresregel, plaatsregel].filter(Boolean).join(', ') || null
  const bedrijfsTelefoon = instellingen?.telefoon || null
  const bedrijfsEmail = instellingen?.email || null

  return { bedrijfsnaam, bedrijfsadres, bedrijfsTelefoon, bedrijfsEmail }
}

function sorteerAdviespunten(adviespunten) {
  return [...adviespunten].sort((a, b) => {
    const prioA = a.prioriteit ?? 99
    const prioB = b.prioriteit ?? 99
    if (prioA !== prioB) return prioA - prioB
    const terugA = a.terugverdientijd_jaren ?? Infinity
    const terugB = b.terugverdientijd_jaren ?? Infinity
    return terugA - terugB
  })
}

function bouwMaatregelRegel(advies, index) {
  return {
    nummer: index + 1,
    onderwerp: advies.onderwerp,
    investering: formatEuroRange(advies.investering_laag, advies.investering_hoog),
    besparing: advies.besparing_euro != null ? `${formatEuro(advies.besparing_euro)}/jaar` : null,
    terugverdientijd: advies.terugverdientijd_jaren != null ? `${advies.terugverdientijd_jaren} jaar` : null,
    prioriteit: advies.prioriteit ?? null,
  }
}

function groepeerOpStatus(adviespunten) {
  const groups = {}
  Object.keys(STATUSES).forEach((status) => {
    groups[status] = []
  })
  adviespunten.forEach((advies) => {
    if (groups[advies.advies_status]) groups[advies.advies_status].push(advies)
  })
  return groups
}

/**
 * Regelgebaseerde samenvatting uit de definitieve adviespunten — zelfde
 * voorzichtige, niet-opdringerige toon als buildAdviesSummary() in
 * lib/mjop/linking.js, maar gebaseerd op bevestigd advies i.p.v.
 * automatische MJOP-signalen (die twee bronnen mogen niet door elkaar
 * lopen, randvoorwaarde 5/6).
 */
export function bouwSamenvatting(adviespunten) {
  if (!adviespunten || adviespunten.length === 0) {
    return ['Voor dit dossier is nog geen definitief advies vastgelegd.']
  }

  const groups = groepeerOpStatus(adviespunten)
  const paragraphs = []
  const labelsFor = (list) => list.map((a) => a.onderwerp.toLowerCase()).join(', ')

  if (groups.nu_onderzoeken.length > 0) {
    paragraphs.push(`Op basis van het advies is het op dit moment vooral zinvol om ${labelsFor(groups.nu_onderzoeken)} nader te onderzoeken.`)
  }
  if (groups.meenemen_bij_vervanging.length > 0) {
    paragraphs.push(`Voor ${labelsFor(groups.meenemen_bij_vervanging)} adviseren wij dit mee te nemen bij een volgend onderhouds- of vervangingsmoment.`)
  }
  if (groups.later_beoordelen.length > 0) {
    paragraphs.push(`${labelsFor(groups.later_beoordelen)} vragen op dit moment nog geen directe actie, maar verdienen het om op een later moment opnieuw te worden beoordeeld.`)
  }
  if (groups.geen_actie_nodig.length > 0) {
    paragraphs.push(`Voor ${labelsFor(groups.geen_actie_nodig)} is op dit moment geen actie nodig.`)
  }
  if (groups.onvoldoende_informatie.length > 0) {
    paragraphs.push(`Voor ${labelsFor(groups.onvoldoende_informatie)} is nog aanvullende informatie nodig om een advies te bepalen.`)
  }
  if (paragraphs.length === 0) {
    paragraphs.push('Op basis van het vastgelegde advies is er op dit moment geen duidelijke aanleiding voor actie.')
  }

  paragraphs.push('Dit overzicht ondersteunt de beoordeling van de adviseur en vervangt geen technische inspectie.')
  return paragraphs
}

// Vaste rijen/labels/eis-tekst uit de Premium/Gold-rapporttemplate — zie
// 0027_dossiers_bouwkundige_analyse.sql. "Installaties" heeft in de
// template vaste "n.v.t."-waarden en wordt hier niet gevuld.
const BOUWDEEL_RIJEN = [
  { key: 'gevel', label: 'Gevel (spouwmuur)' },
  { key: 'dak', label: 'Dak' },
  { key: 'vloer', label: 'Vloer / bodem' },
  { key: 'beglazing', label: 'Beglazing' },
]

/** Bouwt de 4 vaste bouwkundige-analyse-rijen uit dossier.bouwkundige_analyse — ontbrekende waarden blijven leeg, nooit geschat. */
function bouwBouwkundigeAnalyse(bouwkundigeAnalyse) {
  const bron = bouwkundigeAnalyse ?? {}
  return BOUWDEEL_RIJEN.map((rij) => {
    const ingevuld = bron[rij.key] ?? {}
    const waarde = ingevuld.waarde ? `${ingevuld.waarde} ${ingevuld.eenheid ?? ''}`.trim() : null
    return {
      label: rij.label,
      waarde,
      beoordeling: ingevuld.beoordeling || null,
      opmerking: ingevuld.opmerking || null,
    }
  })
}

function formatTaakDeadline(deadline) {
  if (!deadline) return null
  const datum = new Date(deadline)
  if (Number.isNaN(datum.getTime())) return null
  return datum.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Bouwt de subsidiebegeleidingsplan-rijen uit dossier_taken (categorie='subsidie') — puur weergave, geen eigen bron van waarheid. */
function bouwSubsidieStappen(subsidieTaken) {
  return [...(subsidieTaken ?? [])]
    .sort((a, b) => (a.volgorde ?? 0) - (b.volgorde ?? 0))
    .map((taak, index) => ({
      stap: index + 1,
      actie: taak.omschrijving,
      verantwoordelijke: taak.verantwoordelijke || null,
      deadline: formatTaakDeadline(taak.deadline),
    }))
}

/**
 * Bouwt de volledige, sjabloon-onafhankelijke data voor één adviesrapport.
 * `pakketId` bepaalt uitsluitend het label in de metatabel — de adviseur
 * kiest dit expliciet (geen automatische afleiding, zie randvoorwaarde
 * 13 en de commerciële-kans-analyse in dit dossier).
 *
 * `instellingen` is optioneel (factuur_instellingen) — ontbreekt die, dan
 * blijven de bedrijfsgegevensvelden in de metatabel gewoon leeg, net zoals
 * elk ander ontbrekend veld hier al stilzwijgend leeg blijft.
 *
 * `ontbrekendeVelden` somt op wat niet automatisch gevuld kon worden, zodat
 * de adviseur dit bewust kan aanvullen vóór het document de deur uit gaat
 * — nooit een verzonnen waarde in plaats daarvan.
 */
export function bouwAdviesrapportData({ dossier, adviespunten = [], pakketId, adviseurNaam = null, datum = null, subsidieTaken = [], instellingen = null }) {
  const { klantnaam, pandadres } = bouwKlantgegevens(dossier)
  const { bedrijfsnaam, bedrijfsadres, bedrijfsTelefoon, bedrijfsEmail } = bouwBedrijfsgegevens(instellingen)
  const gesorteerd = sorteerAdviespunten(adviespunten)
  const maatregelen = gesorteerd.map(bouwMaatregelRegel)
  const samenvatting = bouwSamenvatting(adviespunten)
  const bouwkundigeAnalyse = bouwBouwkundigeAnalyse(dossier?.bouwkundige_analyse)
  const subsidieStappen = bouwSubsidieStappen(subsidieTaken)

  const ontbrekendeVelden = []
  if (!klantnaam) ontbrekendeVelden.push('klantnaam')
  if (!pandadres) ontbrekendeVelden.push('pandadres')
  if (!adviseurNaam) ontbrekendeVelden.push('adviseur')
  if (adviespunten.length === 0) ontbrekendeVelden.push('adviespunten')
  maatregelen.forEach((regel) => {
    if (regel.investering == null) ontbrekendeVelden.push(`maatregel ${regel.nummer}: investering`)
    if (regel.besparing == null) ontbrekendeVelden.push(`maatregel ${regel.nummer}: besparing`)
    if (regel.terugverdientijd == null) ontbrekendeVelden.push(`maatregel ${regel.nummer}: terugverdientijd`)
    if (regel.prioriteit == null) ontbrekendeVelden.push(`maatregel ${regel.nummer}: prioriteit`)
  })
  if ((pakketId === 'premium' || pakketId === 'gold') && bouwkundigeAnalyse.every((r) => !r.waarde)) {
    ontbrekendeVelden.push('bouwkundige analyse (Rc/U-waarden)')
  }
  if (pakketId === 'gold' && subsidieStappen.length === 0) {
    ontbrekendeVelden.push('subsidiebegeleidingsplan')
  }

  return {
    meta: {
      klantnaam,
      pandadres,
      datumRapport: formatDatum(datum),
      adviseur: adviseurNaam,
      pakket: PAKKET_RAPPORT_LABELS[pakketId] ?? null,
      bedrijfsnaam,
      bedrijfsadres,
      bedrijfsTelefoon,
      bedrijfsEmail,
    },
    samenvatting,
    maatregelen,
    bouwkundigeAnalyse,
    subsidieStappen,
    ontbrekendeVelden,
  }
}
