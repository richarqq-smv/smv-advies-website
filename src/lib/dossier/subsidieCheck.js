/**
 * Subsidiecheck (pakket-/subsidiearchitectuurronde, 2026-10-08) — koppelt
 * de bestaande RVO-referentielijst (rvo_subsidie_index) aan een dossier,
 * puur als weergavefilter/ordening. GEEN nieuwe opslag, GEEN tweede
 * subsidiedatabase: dossiergebonden subsidie-informatie blijft in
 * dossier_subsidies (0035_dossier_subsidies.sql), de RVO-referenties
 * blijven in rvo_subsidie_index (0036_rvo_subsidie_index.sql). Dit bestand
 * voegt alleen een pure, client-side koppeling tussen de twee toe.
 *
 * Neemt bewust kant-en-klare maatregelnamen aan (`mjopMaatregelNamen`/
 * `energieMaatregelNamen`) in plaats van zelf buildInsights()/
 * buildEnergieInsights() aan te roepen: lib/mjop/linking.js importeert
 * zonder bestandsextensie (`from './constants'`), wat de kale
 * node--test-runner niet kan oplossen (zelfde bekende, documenteerde
 * beperking als lib/energieScan/calculations.js — zie
 * energieInsights.js's moduledoc). De aanroeper (SubsidieCheck.jsx, onder
 * Vite) berekent die lijsten met de bestaande, ongewijzigde functies.
 *
 * Verzint zelf geen bedragen, percentages of eligibility: een regeling
 * krijgt uitsluitend één van drie weergavestatussen (zie
 * SUBSIDIE_CHECK_STATUSSEN), nooit "niet relevant" — met alleen RVO-
 * metadata en een handvol dossiersignalen is er onvoldoende basis om dat
 * met zekerheid te stellen (opdracht §7).
 */

/** Verzamelt de zoeksignalen voor dit dossier: pandtype + alle al-berekende MJOP-/Energie-maatregelnamen. Puur verzamelen, geen nieuwe regel. */
export function bepaalSubsidieSignalen({ pand, mjopMaatregelNamen = [], energieMaatregelNamen = [] } = {}) {
  const signalen = new Set()
  if (pand?.gebruikstype) signalen.add(String(pand.gebruikstype).toLowerCase())
  mjopMaatregelNamen.forEach((naam) => naam && signalen.add(String(naam).toLowerCase()))
  energieMaatregelNamen.forEach((naam) => naam && signalen.add(String(naam).toLowerCase()))
  return Array.from(signalen)
}

/** Platte, doorzoekbare tekst van één RVO-item — titel/intro/sectoren/onderwerpen/doelgroepen/tags. */
function rvoItemTekst(item) {
  return [item.titel, item.intro, ...(item.sectoren ?? []), ...(item.onderwerpen ?? []), ...(item.doelgroepen ?? []), ...(item.tags ?? [])]
    .filter((v) => typeof v === 'string' && v.trim())
    .join(' ')
    .toLowerCase()
}

/** Woorden van 3+ tekens, om toevallige een-/twee-letter-matches (bv. "nl", kale afkortingen zonder context) te vermijden. */
function bevatSignaal(tekst, signalen) {
  return signalen.some((signaal) => signaal.length > 2 && tekst.includes(signaal))
}

export const SUBSIDIE_CHECK_STATUSSEN = {
  VASTGELEGD: 'vastgelegd',
  MOGELIJK_RELEVANT: 'mogelijk_relevant',
  TE_BEOORDELEN: 'te_beoordelen',
}

export const SUBSIDIE_CHECK_STATUS_LABELS = {
  [SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD]: 'Al vastgelegd in dit dossier',
  [SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT]: 'Mogelijk relevant',
  [SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN]: 'Te beoordelen',
}

/**
 * Koppelt elk RVO-item aan dit dossier. Een regeling die al als
 * dossier_subsidies-rij bestaat (zelfde titel, hoofdletter-/spatie-
 * ongevoelig) krijgt status "vastgelegd" — dat is dan SMV-beoordeling,
 * geen RVO-broninformatie meer. De rest krijgt "mogelijk_relevant"
 * (signaalmatch) of "te_beoordelen" (geen match, niet per se irrelevant).
 */
export function koppelRvoRegelingenAanDossier({ rvoItems = [], signalen = [], bestaandeSubsidies = [] } = {}) {
  const bestaandPerTitel = new Map(bestaandeSubsidies.map((s) => [s.regeling_naam.trim().toLowerCase(), s]))

  return rvoItems.map((item) => {
    const bestaand = bestaandPerTitel.get(item.titel.trim().toLowerCase()) ?? null
    let status = SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN
    if (bestaand) status = SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD
    else if (bevatSignaal(rvoItemTekst(item), signalen)) status = SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT

    return { item, bestaandeSubsidie: bestaand, status }
  })
}

const SORTVOLGORDE = {
  [SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD]: 0,
  [SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT]: 1,
  [SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN]: 2,
}

/** Vastgelegd eerst, dan mogelijk relevant, dan de rest — stabiel binnen elke groep (alfabetisch op titel). */
export function sorteerSubsidieCheck(gekoppeld) {
  return [...gekoppeld].sort((a, b) => {
    const volgordeVerschil = SORTVOLGORDE[a.status] - SORTVOLGORDE[b.status]
    if (volgordeVerschil !== 0) return volgordeVerschil
    return a.item.titel.localeCompare(b.item.titel)
  })
}
