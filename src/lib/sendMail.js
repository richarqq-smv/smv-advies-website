import { supabase } from './supabaseClient'

/**
 * Vervangt EmailJS (2026-10-14): verstuurt mail via de Supabase Edge
 * Function `send-email`, die op haar beurt Resend aanroept. De echte
 * Resend-sleutel staat uitsluitend server-side (Edge Function secret) —
 * deze functie hier stuurt nooit meer dan het mailtype + de platte
 * merge-velden naar onze eigen backend.
 *
 * `turnstileToken` (ronde 2026-10-17): verplicht sinds de Edge Function
 * elke aanroep tegen Cloudflare Turnstile verifieert (zie
 * verifyTurnstile() in supabase/functions/send-email/index.ts) — zonder
 * geldig token wijst de functie het verzoek af vóórdat er iets via Resend
 * verstuurd wordt. Zie components/ui/TurnstileWidget.jsx voor hoe een
 * aanroeper aan dat token komt.
 */
export async function sendMail(type, params, turnstileToken) {
  const { error } = await supabase.functions.invoke('send-email', { body: { type, params, turnstileToken } })
  if (error) {
    throw new Error('Verzenden is niet gelukt. Probeer het later opnieuw.')
  }
}
