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
 * in plaats van een valse "verzonden"-bevestiging.
 */
export async function sendEmail(templateId, params) {
  if (!templateId || templateId.startsWith('ONTBREKEND_')) {
    throw new Error('Verzenden is nog niet geconfigureerd (EmailJS-template ontbreekt).')
  }
  ensureInit()
  try {
    return await emailjs.send(EMAILJS_SERVICE_ID, templateId, params)
  } catch {
    throw new Error('Verzenden is niet gelukt. Probeer het later opnieuw.')
  }
}
