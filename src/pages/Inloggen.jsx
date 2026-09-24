import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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

export default function Inloggen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setFout(null)
    setBezig(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord })
      if (error) throw error
      // Na de klant-/adminomgeving (volgende stap) hier redirecten naar de
      // juiste bestemming op basis van rol; tot die tijd terug naar waar de
      // gebruiker vandaan kwam, of de homepage.
      navigate(location.state?.van ?? ROUTES.home)
    } catch (err) {
      setFout(vertaalAuthFout(err))
    } finally {
      setBezig(false)
    }
  }

  return (
    <>
      <Seo title="Inloggen" description="Log in op uw SMV Advies-account." noindex />

      <PageHero eyebrow="Account" title="Inloggen" description="Log in om uw bedrijf, panden en dossiers te beheren." />

      <Section tone="white" noTopPadding>
        <Container className="max-w-md">
          <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <TextField id="login-email" label="E-mailadres" type="email" autoComplete="email" required value={email} onChange={setEmail} />
            <WachtwoordVeld id="login-wachtwoord" label="Wachtwoord" autoComplete="current-password" required value={wachtwoord} onChange={setWachtwoord} />

            {fout ? (
              <p role="alert" className="text-sm font-medium text-error">
                {fout}
              </p>
            ) : null}

            <Button type="submit" disabled={bezig}>
              {bezig ? 'Bezig...' : 'Inloggen'}
            </Button>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Link to={ROUTES.wachtwoordVergeten} className="text-accent hover:underline">
                Wachtwoord vergeten?
              </Link>
              <Link to={ROUTES.registreren} className="text-accent hover:underline">
                Nog geen account? Aanmaken
              </Link>
            </div>
          </form>
        </Container>
      </Section>
    </>
  )
}
