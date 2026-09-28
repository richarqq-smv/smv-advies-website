/**
 * Pure factuurlogica: statusovergangen, regelberekening, totalen en de
 * snapshotopbouw — geen I/O (zie api.js voor de Supabase-aanroep zelf).
 * Zelfde scheiding/patroon als lib/klantOmgeving/offerte.js — `euro`/
 * `rond2`/`formatDatumNl` zijn generieke, geld-/datumgerelateerde
 * hulpfuncties die al vanuit offerte.js door meerdere plekken in deze
 * applicatie worden hergebruikt (bijv. WatKanWachten.jsx,
 * DossierWerkruimte.jsx) — hier hetzelfde, geen tweede kopie.
 */
export { euro, rond2, formatDatumNl } from './offerte.js'
import { rond2, euro, formatDatumNl } from './offerte.js'

export const FACTUUR_STATUSSEN = [
  { id: 'concept', label: 'Concept' },
  { id: 'verzonden', label: 'Verzonden' },
  { id: 'betaald', label: 'Betaald' },
  { id: 'vervallen', label: 'Vervallen' },
  { id: 'geannuleerd', label: 'Geannuleerd' },
]
export const FACTUUR_STATUS_LABELS = Object.fromEntries(FACTUUR_STATUSSEN.map((s) => [s.id, s.label]))

/**
 * Moet exact overeenkomen met `toegestane_overgangen` in
 * bewaak_factuur_integriteit() (0014_facturen.sql) — hier als pure,
 * testbare data zodat zowel de UI (welke knoppen tonen) als api.js
 * (welke aanroep proberen) uit precies dezelfde bron putten. De database
 * blijft de enige echte handhaving (zelfde uitgangspunt als
 * OFFERTE_TOEGESTANE_OVERGANGEN in offerte.js).
 *
 * `betaald -> verzonden` is uitsluitend bedoeld voor de expliciete
 * "betaling corrigeren"-actie (zie corrigeerFactuurBetaling() in api.js),
 * niet voor een vrije statuskiezer — de UI toont deze overgang daarom
 * apart, niet tussen de normale statusknoppen (zie FactuurDetail.jsx).
 */
export const FACTUUR_TOEGESTANE_OVERGANGEN = {
  concept: ['verzonden', 'geannuleerd'],
  verzonden: ['betaald', 'vervallen', 'geannuleerd'],
  vervallen: ['betaald', 'geannuleerd'],
  betaald: ['verzonden'],
}

/** Of een statusovergang volgens FACTUUR_TOEGESTANE_OVERGANGEN geldig is — pure afgeleide, geen eigen bron van waarheid. */
export function magFactuurOvergangNaar(huidigeStatus, nieuweStatus) {
  return (FACTUUR_TOEGESTANE_OVERGANGEN[huidigeStatus] ?? []).includes(nieuweStatus)
}

/**
 * Of een factuur feitelijk over de vervaldatum heen is — uitsluitend een
 * UI-signalering (badge/filter), wijzigt NOOIT de opgeslagen `status`
 * zelf. Exact hetzelfde principe als `isVerlopen()` in
 * OffertesHistorie.jsx voor een offerte se `geldig_tot`: alleen een
 * `verzonden` factuur (nog niet betaald/geannuleerd/expliciet als
 * vervallen gemarkeerd) waarvan de vervaldatum al voorbij is, telt.
 * `vandaagIso` wordt altijd meegegeven (nooit hier bepaald via
 * `new Date()`), zodat deze functie puur en deterministisch getest kan
 * worden.
 */
export function isFactuurVervallen(factuur, vandaagIso) {
  return factuur.status === 'verzonden' && factuur.vervaldatum < vandaagIso
}

/**
 * Berekent de bedragen van één factuurregel volgens de vaste formule:
 * regelbedrag excl. btw = aantal * prijs excl. btw, btw = dat bedrag *
 * percentage, regelbedrag incl. btw = excl. btw + btw. Elke tussenstap
 * wordt afgerond op centen (rond2) — voorkomt drijvende-kommafouten bij
 * het optellen van meerdere regels.
 */
export function berekenFactuurRegel({ aantal, prijsExclBtw, btwPercentage }) {
  const regelbedragExclBtw = rond2(aantal * prijsExclBtw)
  const btwBedrag = rond2((regelbedragExclBtw * btwPercentage) / 100)
  const regelbedragInclBtw = rond2(regelbedragExclBtw + btwBedrag)
  return { regelbedragExclBtw, btwBedrag, regelbedragInclBtw }
}

/**
 * Telt de bedragen van alle factuurregels bij elkaar op tot de
 * factuurtotalen. Verwacht regels met al berekende
 * `regelbedragExclBtw`/`btwBedrag` (zie berekenFactuurRegel) — telt
 * uitsluitend op, herberekent niets, zodat een eenmaal opgeslagen regel
 * (met zijn eigen, op dat moment geldende prijs/btw-percentage) nooit
 * stilzwijgend verandert door deze functie opnieuw aan te roepen.
 */
export function berekenFactuurTotalen(regels = []) {
  const subtotaalExclBtw = rond2(regels.reduce((som, r) => som + (r.regelbedragExclBtw ?? 0), 0))
  const btwBedrag = rond2(regels.reduce((som, r) => som + (r.btwBedrag ?? 0), 0))
  const totaalInclBtw = rond2(subtotaalExclBtw + btwBedrag)
  return { subtotaalExclBtw, btwBedrag, totaalInclBtw }
}

/** yyyy-mm-dd, geschikt voor een Postgres `date`-kolom. */
function naarDatumString(datum) {
  return datum.toISOString().slice(0, 10)
}

/** Standaard vervaldatum: `termijnDagen` na `vanaf` (komt uit factuur_instellingen.standaard_betalingstermijn_dagen, zie api.js). */
export function standaardVervaldatum(vanaf, termijnDagen) {
  const datum = new Date(vanaf)
  datum.setDate(datum.getDate() + termijnDagen)
  return naarDatumString(datum)
}

/**
 * Bouwt de zelfstandige klant-snapshot voor een factuur — bevat de
 * daadwerkelijke waarden op dit moment, nooit een verwijzing naar een id
 * die later kan wijzigen. Zelfde vorm als het klant/contactpersoon-deel
 * van bouwOfferteSnapshot() in offerte.js (bewust geen pand-gegevens
 * hier: een factuur is per definitie aan een Klant gericht, niet aan een
 * Pand — dossier_id/offerte_id volstaan als losse, optionele
 * identiteitsverwijzing voor "welk werk hoorde hierbij").
 */
export function bouwFactuurKlantSnapshot({ klant, contactpersoon }) {
  return {
    klant: {
      naam: klant.naam ?? null,
      bedrijfsnaam: klant.bedrijfsnaam ?? null,
      email: klant.email ?? null,
      telefoon: klant.telefoon ?? null,
    },
    contactpersoon: contactpersoon
      ? {
          naam: contactpersoon.naam ?? null,
          rol: contactpersoon.rol ?? null,
          email: contactpersoon.email ?? null,
          telefoon: contactpersoon.telefoon ?? null,
        }
      : null,
  }
}

function heeftWaarde(v) {
  return typeof v === 'string' ? v.trim() !== '' : v != null
}

/** Puur veld-voor-veld (zelfde vorm als klantValidatie.js/planning.js): een leeg object betekent geldig. */
export function valideerFactuurRegel({ omschrijving, aantal, prijsExclBtw, btwPercentage } = {}) {
  const fouten = {}
  if (!heeftWaarde(omschrijving)) fouten.omschrijving = 'Vul een omschrijving in.'
  if (!(Number(aantal) > 0)) fouten.aantal = 'Vul een aantal groter dan 0 in.'
  if (!(Number(prijsExclBtw) >= 0)) fouten.prijsExclBtw = 'Vul een geldige prijs in.'
  if (!(Number(btwPercentage) >= 0)) fouten.btwPercentage = 'Vul een geldig btw-percentage in.'
  return fouten
}

/** Minimale validatie vóór het opslaan van een (nieuwe) factuur — geen dubbel werk met de databaseconstraints, alleen wat de UI vooraf al kan/moet tonen. */
export function valideerNieuweFactuur({ klantId, vervaldatum, regels = [] } = {}) {
  const fouten = {}
  if (!heeftWaarde(klantId)) fouten.klantId = 'Kies een klant.'
  if (!heeftWaarde(vervaldatum)) fouten.vervaldatum = 'Vul een vervaldatum in.'
  if (!Array.isArray(regels) || regels.length === 0) fouten.regels = 'Voeg minstens één factuurregel toe.'
  return fouten
}

/**
 * Zet een bestaande offerte om naar factuurregels ("Factuur maken" vanuit
 * een offerte, zie OffertesHistorie.jsx) — één regel voor het gekozen
 * pakket (het daadwerkelijk aangeboden offerte.bedrag, niet de
 * pakket-standaardprijs: dat kan bewust afwijken, zie
 * bedragWijktAfVanStandaardprijs() in offerte.js), plus één regel per
 * meerwerkregel. Btw-percentage komt van de offerte zelf
 * (offerte.btw_percentage) — nooit opnieuw verzonnen of van de huidige
 * BTW_PERCENTAGE-constante gepakt, want dat zou een oudere offerte met
 * een destijds andere geldende rate verkeerd kunnen overnemen.
 *
 * Puur: leest alleen van de meegegeven offerte, schrijft niets — het
 * daadwerkelijk aanmaken van de factuur (met een eigen, onafhankelijk
 * factuurnummer en snapshot) gebeurt in createFactuur() (api.js).
 */
export function bouwFactuurRegelsVanuitOfferte(offerte) {
  const btwPercentage = offerte.btw_percentage
  const pakketNaam = offerte.snapshot?.pakket?.naam
  const pakketRegel = {
    omschrijving: pakketNaam ? `${pakketNaam}${offerte.snapshot.pakket.subtitle ? ' — ' + offerte.snapshot.pakket.subtitle : ''}` : 'Dienstverlening SMV Advies',
    aantal: 1,
    eenheid: 'stuk',
    prijsExclBtw: offerte.bedrag,
    btwPercentage,
    ...berekenFactuurRegel({ aantal: 1, prijsExclBtw: offerte.bedrag, btwPercentage }),
  }
  const meerwerkRegels = (offerte.meerwerk ?? []).map((regel) => ({
    omschrijving: regel.omschrijving,
    aantal: regel.aantal,
    eenheid: 'uur',
    prijsExclBtw: regel.eenheidsprijs,
    btwPercentage,
    ...berekenFactuurRegel({ aantal: regel.aantal, prijsExclBtw: regel.eenheidsprijs, btwPercentage }),
  }))
  return [pakketRegel, ...meerwerkRegels]
}

/**
 * "Betreft" op het factuurdocument (SMV-sjabloon, factuursjabloon-ronde
 * 2026-09-28) — de omschrijving van de eerste factuurregel, want die is
 * per conventie altijd de hoofdregel (het pakket zelf, zie
 * bouwFactuurRegelsVanuitOfferte hierboven; bij een losstaand aangemaakte
 * factuur de eerst ingevoerde regel). Geen nieuw databaseveld: puur een
 * weergave-afleiding uit de al bestaande, bevroren regels — verandert dus
 * nooit met terugwerkende kracht.
 */
export function afgeleidBetreft(regels = []) {
  return regels[0]?.omschrijving ?? null
}

/**
 * Het btw-percentage voor de totaalregel op het factuurdocument
 * ("Btw (21%)", zie het SMV-sjabloon) — alleen tonen als alle regels
 * hetzelfde percentage hanteren (in de praktijk altijd het geval: één
 * offerte/factuur hanteert één geldend tarief, zie
 * bouwFactuurRegelsVanuitOfferte). Bij een (theoretische) afwijking `null`,
 * dan toont het document enkel "Btw" zonder percentage — nooit een
 * verzonnen of gemiddeld getal.
 */
export function afgeleidBtwPercentage(regels = []) {
  if (regels.length === 0) return null
  const eerste = regels[0]?.btwPercentage
  return regels.every((r) => r.btwPercentage === eerste) ? eerste : null
}

/**
 * Bouwt de `mailto:`-conceptmail voor "Factuur verzenden" (zie
 * FactuurDetail.jsx) — exact hetzelfde patroon als buildGesprekMailto() in
 * ResultsView.jsx: geen EmailJS-aanroep (geen verifieerbaar/geconfigureerd
 * template beschikbaar vanuit deze omgeving), de admin verstuurt zelf via
 * de eigen mailclient. Puur en testbaar: leest alleen van de meegegeven
 * factuur/instellingen, doet zelf geen I/O of statuswijziging.
 *
 * Bevat UITSLUITEND klantgerichte informatie (factuurnummer, bedrag,
 * vervaldatum, betalingsgegevens) — nooit interne velden zoals dossier_id,
 * commerciële kansen of interne notities (zie opdracht sectie 9).
 */
export function buildFactuurMailto(factuur, instellingen) {
  const klant = factuur.klant_snapshot?.klant
  const subject = `Factuur ${factuur.factuurnummer} — ${instellingen.bedrijfsnaam}`
  const body =
    `Beste${klant?.naam ? ' ' + klant.naam : ''},\n\n` +
    `Hierbij ontvangt u factuur ${factuur.factuurnummer} van ${instellingen.bedrijfsnaam}, ter attentie van ${klant?.bedrijfsnaam || klant?.naam || 'u'}.\n\n` +
    `Factuurbedrag: ${euro(factuur.totaal_incl_btw)}\nUiterste betaaldatum: ${formatDatumNl(factuur.vervaldatum)}\n\n` +
    `Wij verzoeken u het bedrag over te maken naar ${instellingen.iban ?? ''}${instellingen.tenaamstelling ? ' t.n.v. ' + instellingen.tenaamstelling : ''}, ` +
    `onder vermelding van het factuurnummer.\n\n${instellingen.betalingsvoorwaarden ?? ''}\n\nMet vriendelijke groet,\n${instellingen.bedrijfsnaam}`
  const naar = klant?.email ?? ''
  return `mailto:${naar}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
