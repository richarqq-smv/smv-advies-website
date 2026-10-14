import { supabase } from './supabaseClient'

/**
 * Vervangt EmailJS (2026-10-14): verstuurt mail via de Supabase Edge
 * Function `send-email`, die op haar beurt Resend aanroept. De echte
 * Resend-sleutel staat uitsluitend server-side (Edge Function secret) —
 * deze functie hier stuurt nooit meer dan het mailtype + de platte
 * merge-velden naar onze eigen backend.
 */
export async function sendMail(type, params) {
  const { error } = await supabase.functions.invoke('send-email', { body: { type, params } })
  if (error) {
    throw new Error('Verzenden is niet gelukt. Probeer het later opnieuw.')
  }
}
