import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { adminListFacturen } from '../lib/klantOmgeving/api'
import { euro, formatDatumNl } from '../lib/klantOmgeving/offerte'
import { isFactuurVervallen } from '../lib/klantOmgeving/factuur'

function vandaagIso() {
  return new Date().toISOString().slice(0, 10)
}

const FILTERS = [
  { id: 'alle', label: 'Alle openstaand' },
  { id: 'niet_vervallen', label: 'Nog niet vervallen' },
  { id: 'vervallen', label: 'Vervallen' },
]

/**
 * Openstaand-overzicht (/admin/administratie/openstaand) — uitsluitend
 * facturen die daadwerkelijk nog een openstaande vordering zijn: status
 * `verzonden` (nog niet betaald) of `vervallen` (expliciet als zodanig
 * gemarkeerd, zie opdracht sectie 10 uit de Administratie-ronde). Een
 * `betaald`- of `geannuleerd`-factuur hoort hier nooit in thuis — een
 * `concept` ook niet, die is nooit verstuurd en dus geen vordering.
 *
 * "Vervallen" telt zowel de expliciete status als het afgeleide
 * isFactuurVervallen()-signaal (een verzonden factuur waarvan de
 * vervaldatum al voorbij is, maar die de admin nog niet apart als
 * "vervallen" heeft gemarkeerd) — zelfde optelling als de "Waarvan
 * vervallen"-regel op AdminAdministratie.jsx.
 */
export default function AdminOpenstaand() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [facturen, setFacturen] = useState([])
  const [filter, setFilter] = useState('alle')

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListFacturen({})
      .then((rows) => actief && setFacturen(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  const vandaag = vandaagIso()
  const openstaand = facturen
    .filter((f) => f.status === 'verzonden' || f.status === 'vervallen')
    .map((f) => ({ ...f, isVervallen: f.status === 'vervallen' || isFactuurVervallen(f, vandaag) }))
    .sort((a, b) => a.vervaldatum.localeCompare(b.vervaldatum))

  const vervallenLijst = openstaand.filter((f) => f.isVervallen)
  const nietVervallenLijst = openstaand.filter((f) => !f.isVervallen)
  const totaalOpenstaand = openstaand.reduce((som, f) => som + Number(f.totaal_incl_btw ?? 0), 0)
  const totaalVervallen = vervallenLijst.reduce((som, f) => som + Number(f.totaal_incl_btw ?? 0), 0)

  const zichtbaar = filter === 'vervallen' ? vervallenLijst : filter === 'niet_vervallen' ? nietVervallenLijst : openstaand

  return (
    <>
      <Seo title="Openstaand" description="Openstaande facturen, met vervaldatum en status." noindex />
      <PageHero eyebrow="Administratie" title="Openstaand" description="Verzonden facturen die nog niet betaald zijn." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <Button as="link" to={ROUTES.adminAdministratie} variant="ghost" size="sm" className="mb-5">
            <ArrowLeft size={16} /> Administratie
          </Button>

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
              <WarningCircle size={15} weight="fill" />
              {fout}
            </p>
          ) : (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">Aantal openstaand</p>
                  <p className="mt-1 text-2xl font-medium text-primary">{openstaand.length}</p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">Totaal openstaand</p>
                  <p className="mt-1 text-2xl font-medium text-primary">{euro(totaalOpenstaand)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">Waarvan vervallen</p>
                  <p className={`mt-1 text-2xl font-medium ${totaalVervallen > 0 ? 'text-error' : 'text-primary'}`}>{euro(totaalVervallen)}</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                      filter === f.id ? 'bg-primary text-white' : 'bg-muted text-foreground-muted hover:text-primary'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {zichtbaar.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Geen openstaande facturen in dit filter.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {zichtbaar.map((f) => (
                    <li key={f.factuur_id}>
                      <Link
                        to={ROUTES.adminFactuurDetail(f.factuur_id)}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm hover:border-accent hover:bg-muted"
                      >
                        <span className="font-medium text-primary">{f.factuurnummer}</span>
                        <span className="text-foreground-muted">{f.klanten?.naam || f.klanten?.bedrijfsnaam || 'Onbekende klant'}</span>
                        <span className="text-xs text-foreground-muted">Factuurdatum {formatDatumNl(f.factuurdatum)}</span>
                        <span className={f.isVervallen ? 'text-xs font-medium text-error' : 'text-xs text-foreground-muted'}>
                          Vervaldatum {formatDatumNl(f.vervaldatum)}
                          {f.isVervallen ? ' · vervallen' : ''}
                        </span>
                        <span className="text-primary">{euro(f.totaal_incl_btw)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  )
}
