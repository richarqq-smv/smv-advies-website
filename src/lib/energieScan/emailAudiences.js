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
 * Merge-velden voor de interne leadmail naar SMV Advies zelf — volledige
 * berekening, ongewijzigd door Fase 6. `to_email` wordt hier nog
 * meegegeven voor historische/debug-duidelijkheid, maar de Edge Function
 * (supabase/functions/send-email/index.ts, buildEnergieLeadEmail) bepaalt
 * de daadwerkelijke ontvanger altijd zelf, server-side, en negeert dit
 * veld — een aanroeper kan de ontvanger dus nooit via de request zelf
 * instellen.
 */
export function buildInterneLeadParams(emailParams, businessEmail) {
  return { ...emailParams, to_email: businessEmail, maatregelen: emailParams.maatregelen_intern }
}

/**
 * Merge-velden voor de automatische bevestigingsmail aan de klant zelf —
 * Fase 6: dezelfde beperking als de publieke resultaatweergave.
 * `maatregelen_intern`/`totale_besparing`/`co2_besparing` worden hier
 * expliciet leeggemaakt, als tweede verdedigingslaag bovenop de Edge
 * Function zelf: buildEnergieConfirmEmail() in
 * supabase/functions/send-email/index.ts rendert deze velden sowieso al
 * niet in de klant-HTML, maar deze client-side override zorgt dat er ook
 * geen onbedoelde interne cijfers worden meegestuurd als de Edge Function
 * ooit zou veranderen.
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
