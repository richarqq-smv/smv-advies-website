import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { TextField } from '../components/ui/TextField'
import { Button } from '../components/ui/Button'
import { WachtwoordVeld } from '../components/auth/WachtwoordVeld'
import { supabase } from '../lib/supabaseClient'
import { vertaalAuthFout } from '../lib/auth/errors'
import { MIN_WACHTWOORD_LENGTE } from '../lib/auth/wachtwoord'
import { bewaarPendingKoppelcode } from '../lib/klantOmgeving/pendingKoppelcode'
import { ROUTES } from '../lib/routes'

export default function Registreren() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  // Koppelcode-eerst-variant (2026-10-16): vanaf /inloggen "Meld u hiermee
  // aan" — zelfde pagina, alleen een ander beginpunt. Geen nieuwe route
  // nodig: de querystring bepaalt of de klant eerst de koppelcode-stap
  // doorloopt vóór de gewone e-mail/wachtwoord-stap hieronder.
  const koppelModus = searchParams.get('koppelcode') === '1'
  const [koppelStap, setKoppelStap] = useState('gegevens') // 'gegevens' | 'account' — alleen relevant als koppelModus
  const [koppelcode, setKoppelcodeWaarde] = useState('')
  const [telefoon, setTelefoon] = useState('')

  const [naam, setNaam] = useState('')
  const [bedrijfsnaam, setBedrijfsnaam] = useState('')
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [wachtwoordBevestiging, setWachtwoordBevestiging] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [aangemeld, setAangemeld] = useState(false)

  function submitKoppelGegevens(e) {
    e.preventDefault()
    setFout(null)
    if (!koppelcode.trim()) {
      setFout('Vul de koppelcode in.')
      return
    }
    if (!naam.trim()) {
      setFout('Vul uw naam in.')
      return
    }
    setKoppelStap('account')
  }

  async function submit(e) {
    e.preventDefault()
    setFout(null)
    if (!koppelModus && !naam.trim()) {
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
      // achterlaat. In koppelModus geldt hetzelfde principe voor
      // koppel_klant_met_code(): die vereist al een ingelogde sessie (zie
      // 0048_klant_koppelcode.sql), dus de koppelcode kan hier nog niet
      // verzilverd worden — bewaarPendingKoppelcode() bewaart 'm tot na de
      // e-mailbevestiging, Account.jsx rondt de koppeling dan automatisch af.
      if (koppelModus) {
        bewaarPendingKoppelcode({ code: koppelcode.trim(), naam: naam.trim(), email: email.trim() || null, telefoon: telefoon.trim() || null })
      }
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
      <Seo
        title={koppelModus ? 'Aanmelden met koppelcode' : 'Account aanmaken'}
        description={
          koppelModus
            ? 'Rond uw account af met een koppelcode van SMV Advies.'
            : 'Maak een zakelijk SMV Advies-account aan om uw pand, MJOP en adviesdossier te beheren.'
        }
        noindex
      />

      <PageHero
        eyebrow="Account"
        title={koppelModus ? 'Aanmelden met koppelcode' : 'Zakelijk account aanmaken'}
        description={
          koppelModus
            ? 'Uw bedrijfsgegevens zijn al bij SMV Advies bekend. Vul de koppelcode in en maak daarna een e-mailadres en wachtwoord aan om in te loggen.'
            : 'Voor bedrijven die hun pand, onderhoudsplanning (MJOP) en adviesdossier bij SMV Advies willen beheren.'
        }
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-md">
          {aangemeld ? (
            <div role="status" className="rounded-2xl border border-border bg-white p-6 text-sm shadow-sm sm:p-8">
              <p className="mb-0 font-medium text-primary">Bijna klaar — controleer uw e-mail.</p>
              <p className="mb-0 mt-2 text-foreground-muted">
                We hebben een bevestigingslink gestuurd naar <strong className="text-primary">{email}</strong>. Klik op de link in die e-mail om uw
                account te activeren{koppelModus ? ', en log daarna in — uw account wordt dan automatisch aan uw koppelcode gekoppeld.' : ', en log daarna in.'}
              </p>
            </div>
          ) : koppelModus && koppelStap === 'gegevens' ? (
            <form onSubmit={submitKoppelGegevens} className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              <TextField id="reg-koppelcode" label="Koppelcode" required value={koppelcode} onChange={setKoppelcodeWaarde} />
              <TextField id="reg-koppel-naam" label="Naam" required value={naam} onChange={setNaam} />
              <TextField id="reg-koppel-telefoon" label="Telefoonnummer" type="tel" value={telefoon} onChange={setTelefoon} />

              {fout ? (
                <p role="alert" className="text-sm font-medium text-error">
                  {fout}
                </p>
              ) : null}

              <Button type="submit">Volgende</Button>

              <p className="text-sm text-foreground-muted">
                Geen koppelcode?{' '}
                <Link to={ROUTES.registreren} state={location.state} className="text-accent hover:underline">
                  Gewoon registreren
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              {koppelModus ? (
                <p className="text-sm text-foreground-muted">
                  Nog één stap: met dit e-mailadres en wachtwoord logt u voortaan in bij SMV Advies.
                </p>
              ) : (
                <>
                  <TextField id="reg-naam" label="Naam" required value={naam} onChange={setNaam} />
                  <TextField id="reg-bedrijfsnaam" label="Bedrijfsnaam" value={bedrijfsnaam} onChange={setBedrijfsnaam} />
                </>
              )}
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

              {koppelModus ? (
                <button
                  type="button"
                  onClick={() => {
                    setKoppelStap('gegevens')
                    setFout(null)
                  }}
                  className="text-left text-sm text-foreground-muted underline hover:text-accent"
                >
                  ← Terug
                </button>
              ) : (
                <p className="text-sm text-foreground-muted">
                  Heeft u al een account?{' '}
                  <Link to={ROUTES.inloggen} state={location.state} className="text-accent hover:underline">
                    Inloggen
                  </Link>
                </p>
              )}
            </form>
          )}
        </Container>
      </Section>
    </>
  )
}
