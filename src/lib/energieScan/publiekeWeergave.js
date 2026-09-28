/**
 * Publieke presentatie van een Energie Indicatie-resultaat (Fase 6 —
 * commerciële productimplementatie). De onderliggende berekening
 * (lib/energieScan/calculations.js) blijft ongewijzigd en blijft de
 * volledige data leveren — dit bestand bepaalt uitsluitend wat daarvan
 * publiek getoond mag worden: geen investering/besparing/terugverdientijd
 * per maatregel, geen totale besparing, geen CO₂-cijfer. Dezelfde
 * beperking geldt voor zowel de publieke resultaatweergave
 * (components/energieIndicatie/ResultsView.jsx) als de automatische
 * bevestigingsmail aan de klant (zie hooks/useEnergieScan.js) — één bron,
 * niet twee onafhankelijk onderhouden implementaties die uit elkaar
 * kunnen groeien. De interne leadmail naar SMV Advies zelf gebruikt dit
 * bestand niet en blijft de volledige, ongewijzigde berekening bevatten
 * (zie emailParams.js's buildMaatregelenTekstIntern).
 *
 * Geen import van calculations.js: dat bestand importeert zelf
 * `from './constants'` zonder extensie, wat de kale Node-testrunner niet
 * kan oplossen (zelfde, herhaaldelijk aangetroffen beperking als bij
 * energieAdapter.js/energieInsights.js) — de euro()-formatter hieronder is
 * daarom een letterlijke 1-op-1 kopie, geen nieuwe notatie.
 */

/** Aantal aandachtspunten dat publiek getoond wordt — bewust 3 (sluit aan bij de bestaande "top 3" uit de klantmail van vóór Fase 6), niet de volledige lijst. */
export const PUBLIEKE_AANDACHTSPUNTEN_MAX = 3

function euro(n) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL')
}

/**
 * De belangrijkste aandachtspunten, zonder bedragen: alleen naam en
 * toelichting, in dezelfde volgorde als de calculator ze al rangschikt
 * (op besparingspotentieel) — dat rangschikken zelf is geen nieuwe
 * publieke informatie, alleen de onderliggende cijfers worden verborgen.
 */
export function buildPubliekeAandachtspunten(maatregelen) {
  if (!Array.isArray(maatregelen)) return []
  return maatregelen.slice(0, PUBLIEKE_AANDACHTSPUNTEN_MAX).map((m) => ({
    naam: m.naam,
    toelichting: m.toelichting,
  }))
}

/**
 * Een globale kostenbandbreedte rond de geschatte huidige energiekosten,
 * i.p.v. één precies bedrag — voorkomt een schijn van precisie die een
 * gratis, indicatieve tool niet waar kan maken. ±15%, afgerond op
 * vijfhonderdtallen zodat de bandbreedte zelf ook niet vals precies oogt.
 */
export function buildKostenBandbreedte(huidigeKosten) {
  if (huidigeKosten == null) return null
  const laag = Math.max(0, Math.round((huidigeKosten * 0.85) / 500) * 500)
  const hoog = Math.round((huidigeKosten * 1.15) / 500) * 500
  return { laag, hoog }
}

/** Leesbare tekst voor de bandbreedte, of `null` als er geen kostenindicatie is. */
export function formatKostenBandbreedte(huidigeKosten) {
  const band = buildKostenBandbreedte(huidigeKosten)
  if (!band) return null
  return `${euro(band.laag)} – ${euro(band.hoog)} / jaar`
}

/**
 * Vaste, begrijpelijke uitleg over de grenzen van de indicatie (Fase 6,
 * sectie 5) — geen technische overdrijving, gewoon wat de scan wel en niet
 * beoordeelt.
 */
export const WAT_WEET_DEZE_INDICATIE_NIET = [
  'Onderhoud en geplande vervanging van installaties of bouwdelen',
  'Een meerjarenonderhoudsplan (MJOP) voor het hele pand',
  'De actuele technische staat van uw pand',
  'Natuurlijke investeringsmomenten, bijvoorbeeld bij een toch al geplande vervanging',
  'Afhankelijkheden tussen maatregelen onderling',
  'Wat op korte termijn kan wachten en wat niet',
  'Welke volgorde voor uw hele bedrijfspand verstandig is',
]

/**
 * Tekstversie van de publieke aandachtspunten, voor de automatische
 * bevestigingsmail aan de klant (EMAILJS_TEMPLATE_CONFIRM) — dezelfde
 * beperking als de publieke resultaatweergave, geen bedragen per
 * maatregel.
 */
export function buildPubliekeMaatregelenTekst(maatregelen) {
  const punten = buildPubliekeAandachtspunten(maatregelen)
  if (punten.length === 0) return 'Er zijn voor uw pand geen specifieke aandachtspunten gevonden.'
  return punten.map((p, i) => `${i + 1}. ${p.naam}\n   ${p.toelichting}`).join('\n')
}
