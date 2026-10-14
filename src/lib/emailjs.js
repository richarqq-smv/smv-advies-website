/**
 * Overgebleven e-mailadresconstanten na de overstap van EmailJS naar
 * Resend (2026-10-14, zie supabase/functions/send-email + lib/sendMail.js).
 * De EmailJS-SDK, public keys en template-ID's zijn verwijderd — het
 * daadwerkelijke versturen gebeurt nu server-side. Deze twee waarden
 * blijven hier staan omdat ze ook in de *emailParams.js-bestanden worden
 * gebruikt om platte merge-velden op te bouwen (de Edge Function bepaalt
 * zelf, los daarvan, de echte ontvanger — zie BUSINESS_EMAIL/
 * MJOP_RECIPIENT_EMAIL in supabase/functions/send-email/index.ts).
 */
export const BUSINESS_EMAIL = 'info@smv-advies.nl'
export const MJOP_RECIPIENT_EMAIL = 'Richard@smv-advies.nl'
