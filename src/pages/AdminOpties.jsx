import { useEffect, useState } from 'react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Switch } from '../components/ui/Switch'
import { AdminTerugKnop } from '../components/admin/AdminTerugKnop'
import { listFeatureFlags, setFeatureFlag } from '../lib/klantOmgeving/api'
import { formatDatumNl } from '../lib/klantOmgeving/offerte'

/**
 * Opties-paneel (/admin/opties, Fase 6 — #10, projectplan "Klantwaarde-
 * uitbreidingen") — herbruikbare feature-flag-infrastructuur: elke rij
 * uit `feature_flags` (0055_opties_paneel.sql) wordt hier getoond als
 * een echt, functioneel schuifje. Omzetten vereist altijd eerst een
 * bevestiging (randvoorwaarde uit het projectplan: een schuifje dat per
 * ongeluk iets aanzet voor alle klanten tegelijk is een reëel risico) —
 * de Switch zelf wijzigt nooit meteen de echte status, alleen de
 * pending-bevestiging hieronder.
 */
export default function AdminOpties() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [flags, setFlags] = useState([])
  const [pending, setPending] = useState(null) // { sleutel, nieuweWaarde } of null
  const [bezig, setBezig] = useState(false)
  const [bevestigFout, setBevestigFout] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    listFeatureFlags()
      .then((rows) => actief && setFlags(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  async function bevestigen() {
    if (!pending) return
    setBezig(true)
    setBevestigFout(null)
    try {
      const bijgewerkt = await setFeatureFlag(pending.sleutel, pending.nieuweWaarde)
      setFlags((lijst) => lijst.map((f) => (f.sleutel === bijgewerkt.sleutel ? bijgewerkt : f)))
      setPending(null)
    } catch {
      setBevestigFout('Wijzigen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <>
      <Seo title="Opties" description="Experimentele functionaliteit aan- of uitzetten." noindex />
      <PageHero eyebrow="Beheer" title="Opties" description="Experimentele functionaliteit aan- of uitzetten — elke wijziging geldt direct voor alle klanten." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          <AdminTerugKnop />
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : flags.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen opties beschikbaar.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {flags.map((f) => (
                <li key={f.sleutel} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-primary">{f.naam}</p>
                      {f.omschrijving ? <p className="mt-1 text-sm text-foreground-muted">{f.omschrijving}</p> : null}
                      <p className="mt-2 text-xs text-foreground-muted">
                        {f.aan ? 'Aan' : 'Uit'} — laatst gewijzigd op {formatDatumNl(f.laatst_gewijzigd_op?.slice(0, 10))}
                      </p>
                    </div>
                    <Switch
                      checked={f.aan}
                      label={f.naam}
                      disabled={pending?.sleutel === f.sleutel && bezig}
                      onChange={(nieuweWaarde) => {
                        setBevestigFout(null)
                        setPending({ sleutel: f.sleutel, nieuweWaarde })
                      }}
                    />
                  </div>
                  {pending?.sleutel === f.sleutel ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
                      <span className="text-primary">
                        "{f.naam}" {pending.nieuweWaarde ? 'aanzetten' : 'uitzetten'}? Dit geldt direct voor alle klanten.
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={bevestigen} disabled={bezig}>
                          {bezig ? 'Bezig...' : `Ja, ${pending.nieuweWaarde ? 'aanzetten' : 'uitzetten'}`}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setPending(null)} disabled={bezig}>
                          Annuleren
                        </Button>
                      </div>
                      {bevestigFout ? (
                        <p role="alert" className="w-full text-sm font-medium text-error">
                          {bevestigFout}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  )
}
