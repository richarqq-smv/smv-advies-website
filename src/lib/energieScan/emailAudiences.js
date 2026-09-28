/**
 * Verdeelt de gedeelde `buildEmailParams()`-output (zie emailParams.js)
 * over de twee verschillende ontvangers van de Energie Indicatie-e-mails
 * (Fase 6). Losstaand bestand, niet in emailParams.js zelf: emailParams.js
 * importeert `euro/euroRange/jaren` uit calculations.js, dat zelf weer
 * `from './constants'` zonder extensie importeert — onoplosbaar voor de
 * kale Node-testrunner (zelfde, herhaaldelijk aangetroffen beperking als
 * elders in dit project). Deze twee functies zelf hebben die afhankelijkheid
 * niet nodig en blijven hier daarom rechtstreeks testbaar.
 */
import { formatKostenBandbreedte } from './publiekeWeergave.js'

/**
 * Merge-velden voor de interne leadmail naar SMV Advies zelf
 * (EMAILJS_TEMPLATE_LEAD) — volledige berekening, ongewijzigd door Fase 6.
 */
export function buildInterneLeadParams(emailParams, businessEmail) {
  return { ...emailParams, to_email: businessEmail, maatregelen: emailParams.maatregelen_intern }
}

/**
 * Merge-velden voor de automatische bevestigingsmail aan de klant zelf
 * (EMAILJS_TEMPLATE_CONFIRM) — Fase 6: dezelfde beperking als de publieke
 * resultaatweergave. `maatregelen_intern` wordt hier expliciet leeggemaakt
 * (niet alleen ongebruikt gelaten): zonder die override zou het gewoon
 * meespreaden vanuit `emailParams` en, als het externe sjabloon dat veld
 * ooit zou gebruiken, alsnog de volledige interne berekening versturen. Wij
 * kunnen het sjabloon zelf niet inzien of aanpassen (extern, bij EmailJS) —
 * dit is de enige plek binnen deze codebase waar we dat risico kunnen
 * beperken: door de waarde zelf nooit mee te geven.
 */
export function buildKlantBevestigingParams(emailParams, result, klantEmail) {
  return {
    ...emailParams,
    to_email: klantEmail,
    maatregelen: emailParams.maatregelen_klant,
    maatregelen_intern: '',
    huidige_kosten: formatKostenBandbreedte(result.huidigeKosten) ?? '',
    totale_besparing: '',
    co2_besparing: '',
  }
}
