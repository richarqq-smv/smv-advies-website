/**
 * Vertaalt Supabase Auth-foutmeldingen naar begrijpelijke Nederlandse
 * tekst. Nooit de ruwe Supabase-foutmelding tonen aan de gebruiker —
 * die is Engelstalig, kan technisch jargon bevatten, en zou soms
 * (bijv. "invalid credentials" vs. "user not found") meer prijsgeven
 * over of een e-mailadres bestaat dan gewenst.
 */
export function vertaalAuthFout(error) {
  const msg = error?.message ?? ''

  if (msg.includes('Invalid login credentials')) return 'E-mailadres of wachtwoord onjuist.'
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Er bestaat al een account met dit e-mailadres.'
  }
  if (msg.includes('Password should be at least')) return 'Het wachtwoord is te kort.'
  if (msg.includes('Email not confirmed')) return 'Bevestig eerst uw e-mailadres via de link die we u gestuurd hebben.'
  if (msg.includes('Email link is invalid or has expired') || msg.includes('Token has expired')) {
    return 'Deze link is verlopen of al gebruikt. Vraag een nieuwe aan via "Wachtwoord vergeten".'
  }
  if (msg.includes('Auth session missing')) {
    return 'Deze link is ongeldig. Vraag een nieuwe aan via "Wachtwoord vergeten".'
  }
  if (msg.includes('rate limit') || msg.includes('Too many requests')) {
    return 'Te veel pogingen. Probeer het over een paar minuten opnieuw.'
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Er is geen verbinding mogelijk. Controleer uw internetverbinding.'
  }
  return 'Er ging iets mis. Probeer het opnieuw.'
}
