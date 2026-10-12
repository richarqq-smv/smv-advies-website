import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { WachtwoordVeld } from '../components/auth/WachtwoordVeld'
import { supabase } from '../lib/supabaseClient'
import { vertaalAuthFout } from '../lib/auth/errors'
import { MIN_WACHTWOORD_LENGTE } from '../lib/auth/wachtwoord'
import { ROUTES } from '../lib/routes'

/**
 * Tweede helft van de wachtwoord-vergeten-flow (WachtwoordVergeten.jsx
 * stuurt hierheen via redirectTo). Supabase-js detecteert de
 * recovery-sessie automatisch uit de URL (detectSessionInUrl, standaard
 * aan — zie supabaseClient.js) en zet die via AuthProvider's bestaande
 * onAuthStateChange-listener. Deze pagina wacht dat kort af voordat ze
 * een ongeldige/verlopen link rapporteert, zodat een iets tragere
 * sessie-detectie niet voortijdig als "ongeldige link" wordt getoond.
 */
const WACHT_OP_HERSTELSESSIE_MS = 2500

export default function WachtwoordHerstellen() {
  const navigate = useNavigate()
  const [sessieStatus, setSessieStatus] = useState('laden') // 'laden' | 'geldig' | 'ongeldig'
  const [wachtwoord, setWachtwoord] = useState('')
  const [wachtwoordBevestiging, setWachtwoordBevestiging] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [gelukt, setGelukt] = useState(false)

  useEffect(() => {
    let actief = true

    async function controleer() {
      const { data } = await supabase.auth.getSession()
      if (!actief) return
      if (data.session) {
        setSessieStatus('geldig')
        return
      }
      // Geen sessie bij de eerste check: detectSessionInUrl kan nog bezig
      // zijn met het verwerken van de #access_token-hash uit de e-maillink.
      window.setTimeout(async () => {
        if (!actief) return
        const { data: opnieuw } = await supabase.auth.getSession()
        if (!actief) return
        setSessieStatus(opnieuw.session ? 'geldig' : 'ongeldig')
      }, WACHT_OP_HERSTELSESSIE_MS)
    }
    controleer()

    return () => {
      actief = false
    }
  }, [])

  async function submit(e) {
    e.preventDefault()
    setFout(null)
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
      const { error } = await supabase.auth.updateUser({ password: wachtwoord })
      if (error) throw error
      setGelukt(true)
      window.setTimeout(() => navigate(ROUTES.inloggen), 2500)
    } catch (err) {
      setFout(vertaalAuthFout(err))
    } finally {
      setBezig(false)
    }
  }

  return (
    <>
      <Seo title="Wachtwoord herstellen" description="Stel een nieuw wachtwoord in voor uw SMV Advies-account." noindex />

      <PageHero eyebrow="Account" title="Wachtwoord herstellen" description="Stel hier een nieuw wachtwoord in." />

      <Section tone="white" noTopPadding>
        <Container className="max-w-md">
          {sessieStatus === 'laden' ? (
            <p className="text-sm text-foreground-muted">Bezig met controleren van de link...</p>
          ) : sessieStatus === 'ongeldig' ? (
            <div role="alert" className="rounded-2xl border border-border bg-white p-6 text-sm shadow-sm sm:p-8">
              <p className="mb-0 font-medium text-primary">Deze link is ongeldig of verlopen.</p>
              <p className="mb-0 mt-2 text-foreground-muted">
                Vraag een nieuwe link aan via{' '}
                <Link to={ROUTES.wachtwoordVergeten} className="text-accent hover:underline">
                  Wachtwoord vergeten
                </Link>
                . Uw wachtwoord is niet gewijzigd.
              </p>
            </div>
          ) : gelukt ? (
            <div role="status" className="rounded-2xl border border-border bg-white p-6 text-sm shadow-sm sm:p-8">
              <p className="mb-0 font-medium text-primary">Wachtwoord gewijzigd.</p>
              <p className="mb-0 mt-2 text-foreground-muted">
                U wordt doorgestuurd naar het inlogscherm. Lukt dit niet automatisch?{' '}
                <Link to={ROUTES.inloggen} className="text-accent hover:underline">
                  Klik hier om in te loggen
                </Link>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              <WachtwoordVeld id="herstel-wachtwoord" label="Nieuw wachtwoord" autoComplete="new-password" required value={wachtwoord} onChange={setWachtwoord} />
              <WachtwoordVeld
                id="herstel-wachtwoord-bevestiging"
                label="Bevestig nieuw wachtwoord"
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
                {bezig ? 'Bezig...' : 'Wachtwoord instellen'}
              </Button>
            </form>
          )}
        </Container>
      </Section>
    </>
  )
}
