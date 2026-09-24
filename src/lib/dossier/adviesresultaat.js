/**
 * Pure groepeerfunctie voor het Adviesresultaat-scherm (ontwerpdocument "Het
 * adviesresultaat van SMV Advies"). Zet de bestaande `dossier.adviespunten`
 * om naar de vijf statusgroepen, in de daar vastgelegde, bewuste volgorde —
 * geen nieuwe opslag, geen nieuwe advieslogica, uitsluitend een leesweergave
 * van al bestaande data.
 *
 * Volgorde is inhoudelijk gekozen, niet gelijk aan de key-volgorde van
 * STATUSES in lib/mjop/constants.js: "onvoldoende_informatie" staat vroeg
 * (hoort bij "eerst weten wat verstandig is", niet bij "later"), niet aan
 * het eind zoals de voorbeeldstructuur uit de opdracht.
 */
import { STATUSES } from '../mjop/constants.js'

export const ADVIESRESULTAAT_VOLGORDE = [
  'nu_onderzoeken',
  'onvoldoende_informatie',
  'meenemen_bij_vervanging',
  'later_beoordelen',
  'geen_actie_nodig',
]

/**
 * Groepeert adviespunten per status, in de vaste volgorde hierboven. Muteert
 * de meegegeven array/adviespunten niet — elke groep krijgt een nieuwe array
 * via `filter()`. Een lege of ontbrekende `adviespunten`-lijst levert vijf
 * groepen met `aantal: 0` op, nooit een crash.
 */
export function groepeerAdviespunten(adviespunten = []) {
  const groepen = ADVIESRESULTAAT_VOLGORDE.map((status) => {
    const punten = adviespunten.filter((advies) => advies.adviesStatus === status)
    return { status, label: STATUSES[status].label, aantal: punten.length, adviespunten: punten }
  })
  return { groepen, totaal: adviespunten.length }
}
