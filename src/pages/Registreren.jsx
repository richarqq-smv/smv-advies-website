import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { WachtwoordVeld } from '../components/auth/WachtwoordVeld'
import { supabase } from '../lib/supabaseClient'
import { vertaalAuthFout } from '../lib/auth/errors'
import { ROUTES } from '../lib/routes'

const MIN_WACHTWOORD_LENGTE = 8

export default function Registreren() {
  const [naam, setNaam] = useState('')
  const [bedrijfsnaam, setBedrijfsnaam] = useState('')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [wachtwoordBevestiging, setWachtwoordBevestiging] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [aangemeld, setAangemeld] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setFout(null)
    if (!naam.trim()) {
      setFout('Vul uw naam in.')
      return
    }
    if (wachtwoord.length < MIN_WACHTWOORD_LENGTE) {
      setFout(`Het wachtwoord moet minimaal ${MIN_WACHTWOORD_LENGTE} tekens lang zijn.`)
      return
    }
    if (wachtwoord !== wachtwoordBevestiging) {
      setFout('De wachtwoorden komen niet overeen.')
      return
    }
    setBezig(true)
    try {
      // naam/bedrijfsnaam gaan mee als auth-metadata; het echte Klant-/
      // Contactpersoon-record ontstaat pas bewust bij de eerste keer
      // inloggen, via registreer_klant() (zie DATABASE_ARCHITECTURE.md) —
      // niet hier, zodat een nooit-bevestigd account geen wees-Klant
      // achterlaat.
      const { error } = await supabase.auth.signUp({
        email,
        password: wachtwoord,
        options: { data: { naam, bedrijfsnaam } },
      })
      if (error) throw error
      setAangemeld(true)
    } catch (err) {
      setFout(vertaalAuthFout(err))
    } finally {
      setBezig(false)
    }
  }

  return (
    <>
      <Seo title="Account aanmaken" description="Maak een zakelijk SMV Advies-account aan om uw pand, MJOP en adviesdossier te beheren." noindex />

      <PageHero
        eyebrow="Account"
        title="Zakelijk account aanmaken"
        description="Voor bedrijven die hun pand, onderhoudsplanning (MJOP) en adviesdossier bij SMV Advies willen beheren."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-md">
          {aangemeld ? (
            <div role="status" className="rounded-2xl border border-border bg-white p-6 text-sm shadow-sm sm:p-8">
              <p className="mb-0 font-medium text-primary">Bijna klaar — controleer uw e-mail.</p>
              <p className="mb-0 mt-2 text-foreground-muted">
                We hebben een bevestigingslink gestuurd naar <strong className="text-primary">{email}</strong>. Klik op de link in die e-mail om uw
                account te activeren, en log daarna in.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              <TextField id="reg-naam" label="Naam" required value={naam} onChange={setNaam} />
              <TextField id="reg-bedrijfsnaam" label="Bedrijfsnaam" value={bedrijfsnaam} onChange={setBedrijfsnaam} />
              <TextField id="reg-email" label="E-mailadres" type="email" autoComplete="email" required value={email} onChange={setEmail} />
              <WachtwoordVeld id="reg-wachtwoord" label="Wachtwoord" autoComplete="new-password" required value={wachtwoord} onChange={setWachtwoord} />
              <WachtwoordVeld
                id="reg-wachtwoord-bevestiging"
                label="Bevestig wachtwoord"
                autoComplete="new-password"
                required
                value={wachtwoordBevestiging}
                onChange={setWachtwoordBevestiging}
              />

              {fout ? (
                <p role="alert" className="text-sm font-medium text-error">
                  {fout}
                </p>
              ) : null}

              <Button type="submit" disabled={bezig}>
                {bezig ? 'Bezig...' : 'Account aanmaken'}
              </Button>

              <p className="text-sm text-foreground-muted">
                Heeft u al een account?{' '}
                <Link to={ROUTES.inloggen} className="text-accent hover:underline">
                  Inloggen
                </Link>
              </p>
            </form>
          )}
        </Container>
      </Section>
    </>
  )
}
