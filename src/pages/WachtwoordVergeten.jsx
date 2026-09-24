import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabaseClient'
import { vertaalAuthFout } from '../lib/auth/errors'
import { ROUTES } from '../lib/routes'

export default function WachtwoordVergeten() {
  const [email, setEmail] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [verzonden, setVerzonden] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setFout(null)
    setBezig(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      setVerzonden(true)
    } catch (err) {
      setFout(vertaalAuthFout(err))
    } finally {
      setBezig(false)
    }
  }

  return (
    <>
      <Seo title="Wachtwoord vergeten" description="Vraag een nieuwe wachtwoordlink aan voor uw SMV Advies-account." noindex />

      <PageHero
        eyebrow="Account"
        title="Wachtwoord vergeten"
        description="Vul uw e-mailadres in, dan sturen we een link om een nieuw wachtwoord in te stellen."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-md">
          {verzonden ? (
            // Bewust neutraal geformuleerd, ongeacht of het e-mailadres
            // daadwerkelijk bestaat — voorkomt account-enumeratie.
            <div role="status" className="rounded-2xl border border-border bg-white p-6 text-sm shadow-sm sm:p-8">
              <p className="mb-0 font-medium text-primary">E-mail verzonden.</p>
              <p className="mb-0 mt-2 text-foreground-muted">
                Als er een account bestaat bij <strong className="text-primary">{email}</strong>, ontvangt u een link om een nieuw wachtwoord in te
                stellen.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              <TextField id="reset-email" label="E-mailadres" type="email" autoComplete="email" required value={email} onChange={setEmail} />

              {fout ? (
                <p role="alert" className="text-sm font-medium text-error">
                  {fout}
                </p>
              ) : null}

              <Button type="submit" disabled={bezig}>
                {bezig ? 'Bezig...' : 'Link versturen'}
              </Button>

              <p className="text-sm text-foreground-muted">
                <Link to={ROUTES.inloggen} className="text-accent hover:underline">
                  Terug naar inloggen
                </Link>
              </p>
            </form>
          )}
        </Container>
      </Section>
    </>
  )
}
