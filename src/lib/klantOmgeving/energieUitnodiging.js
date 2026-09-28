import { ROUTES } from '../routes.js'
import { voegDossierContextToe } from './dossierNavigatie.js'

/**
 * "Klant informeren" (Energie/MJOP/Advies-werkronde, punt 7) — een
 * eenvoudige copy/link-flow in plaats van een nieuwe mailarchitectuur.
 * De bestaande EmailJS-templates (EMAILJS_TEMPLATE_LEAD/_CONFIRM, zie
 * emailParams.js) verwachten allebei een al ingevulde scan (`values` +
 * `result`) en zijn bedoeld als lead-melding aan SMV zelf / bevestiging
 * aan wie net heeft ingevuld — niet als "hier is een lege uitnodiging"
 * vooraf. Ze hergebruiken voor dit doel zou ofwel verzonnen scangegevens
 * vereisen (expliciet verboden), ofwel interne informatie (de volledige
 * `maatregelen_intern`-tekst) aan een nog niet bevestigde ontvanger
 * blootgeven. Vandaar bewust een kopieerbare link + korte tekst, die de
 * adviseur zelf verstuurt via het kanaal van zijn keuze (e-mail, WhatsApp,
 * telefoon) — geen nieuwe verzendarchitectuur, geen productie-mail vanuit
 * de applicatie zelf.
 *
 * Pure functies, geen I/O: `origin` (bijv. `window.location.origin`) wordt
 * altijd expliciet meegegeven in plaats van hier gelezen, zodat dit
 * bestand met de kale Node-testrunner getest kan worden.
 */
export function bouwEnergieIndicatieLink(origin, dossierId) {
  return `${origin}${voegDossierContextToe(ROUTES.energieIndicatie, dossierId)}`
}

export function bouwEnergieUitnodigingTekst({ klantNaam, link }) {
  const aanhef = klantNaam ? `Beste ${klantNaam},` : 'Beste,'
  return [
    aanhef,
    '',
    'Wilt u alvast de gratis Energie-indicatie van SMV Advies invullen? Daarmee kunnen we uw pand beter voorbereiden op het advies.',
    '',
    link,
    '',
    'Het kost slechts 5-7 minuten, en het resultaat wordt automatisch aan uw dossier gekoppeld.',
    '',
    'Met vriendelijke groet,',
    'SMV Advies',
  ].join('\n')
}
