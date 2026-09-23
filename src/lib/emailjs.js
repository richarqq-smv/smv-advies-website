import emailjs from '@emailjs/browser'

/**
 * EmailJS-configuratie voor de energie-indicatietool. Service-ID,
 * templates en public key komen 1-op-1 uit de originele leadmagnet
 * (SMV_Advies_Energietool_index3.html, LEAD_CONFIG) en blijven ongewijzigd.
 * BUSINESS_EMAIL is de ontvanger voor de interne leadmail — bewust
 * info@smv-advies.nl (niet meer het oude smvadvies@gmail.com), conform de
 * definitieve e-mailadresverdeling.
 */
export const EMAILJS_PUBLIC_KEY = 'vZrGJyT3MGqMxD9P2'
export const EMAILJS_SERVICE_ID = 'service_oit2hux'
export const EMAILJS_TEMPLATE_LEAD = 'template_wyw4bfj' // interne leadmail naar SMV Advies
export const EMAILJS_TEMPLATE_CONFIRM = 'template_v8tzw3c' // automatische bevestiging naar de lead
export const BUSINESS_EMAIL = 'info@smv-advies.nl'

/**
 * MJOP-tool (/MJOP-Tool, intern): een eigen template, met de merge-velden
 * uit src/lib/mjop/emailParams.js en Richard@smv-advies.nl als vaste
 * ontvanger (ingesteld in de template zelf). De service-ID-tekst
 * `service_oit2hux` bestaat hier toevallig (opnieuw aangemaakt) onder een
 * ANDER EmailJS-account dan de energie-indicatietemplates, dus dit
 * template heeft zijn eigen public key nodig — zonder die override zou
 * EmailJS het account van de oude templates raadplegen en het nieuwe
 * template niet vinden ("The template ID not found"), wat tijdens het
 * testen ook exact zo bleek. sendEmail() geeft deze publicKey expliciet
 * mee aan emailjs.send() (los van de globale ensureInit() hieronder), dus
 * de bestaande energie-indicatiemails blijven op hun eigen, ongewijzigde
 * account/key verlopen.
 */
export const EMAILJS_TEMPLATE_MJOP = 'template_5koc1ge'
export const EMAILJS_PUBLIC_KEY_MJOP = '94qfMTUrAn5q0DQQv'
export const MJOP_RECIPIENT_EMAIL = 'Richard@smv-advies.nl'

let initialized = false
function ensureInit() {
  if (!initialized) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY })
    initialized = true
  }
}

/**
 * Verstuurt één EmailJS-template. Gooit met een gebruiksvriendelijke
 * Nederlandse melding bij elke fout (ontbrekend template-ID, netwerkfout
 * of afwijzing door EmailJS) zodat aanroepers een echte foutstatus tonen
 * in plaats van een valse "verzonden"-bevestiging. `publicKey` is optioneel
 * en overschrijft alleen déze aanroep (bijv. voor een template dat onder
 * een ander EmailJS-account hoort dan de globale ensureInit()-sleutel).
 */
export async function sendEmail(templateId, params, publicKey) {
  if (!templateId || templateId.startsWith('ONTBREKEND_')) {
    throw new Error('Verzenden is nog niet geconfigureerd (EmailJS-template ontbreekt).')
  }
  ensureInit()
  try {
    return await emailjs.send(EMAILJS_SERVICE_ID, templateId, params, publicKey)
  } catch {
    throw new Error('Verzenden is niet gelukt. Probeer het later opnieuw.')
  }
}
