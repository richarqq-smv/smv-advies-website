import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { ROUTES } from '../lib/routes'
import { adminListFacturen } from '../lib/klantOmgeving/api'
import { FACTUUR_STATUSSEN, FACTUUR_STATUS_LABELS, euro, formatDatumNl, isFactuurVervallen } from '../lib/klantOmgeving/factuur'

// "Alle" plus de vijf echte statussen — vervallen is hier zowel de
// expliciete status als, via isFactuurVervallen(), het afgeleide signaal
// voor een verzonden factuur waarvan de vervaldatum al voorbij is (zie
// FACTUUR_TOEGESTANE_OVERGANGEN/isFactuurVervallen in factuur.js).
const FILTERS = [{ id: 'alle', label: 'Alle' }, ...FACTUUR_STATUSSEN]

/**
 * Facturenoverzicht (/admin/facturen, Administratie-ronde 2026-09-28) —
 * admin-breed, met dezelfde filter-op-status-aanpak als de bestaande
 * AdminKansen.jsx. Geen aparte factuurweergave hier: "openen" navigeert
 * naar FactuurDetail.jsx (/admin/facturen/:id), waar ook de status-acties
 * en de print-/PDF-weergave staan.
 */
export default function AdminFacturen() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [facturen, setFacturen] = useState([])
  const [statusFilter, setStatusFilter] = useState('alle')

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListFacturen(statusFilter === 'alle' ? {} : { status: statusFilter })
      .then((rows) => actief && setFacturen(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [statusFilter])

  const vandaagIso = new Date().toISOString().slice(0, 10)

  return (
    <>
      <Seo title="Facturen" description="Overzicht van alle facturen." noindex />
      <PageHero eyebrow="Beheer" title="Facturen" description="Alle facturen, over alle klanten en dossiers heen." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-4xl">
          <div className="mb-5 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  statusFilter === f.id ? 'bg-primary text-white' : 'bg-muted text-foreground-muted hover:text-primary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : facturen.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Geen facturen gevonden.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {facturen.map((f) => (
                <li key={f.factuur_id}>
                  <Link
                    to={ROUTES.adminFactuurDetail(f.factuur_id)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
                  >
                    <span className="font-medium text-primary">{f.factuurnummer}</span>
                    <span className="text-foreground-muted">{f.klanten?.naam || f.klanten?.bedrijfsnaam || 'Onbekende klant'}</span>
                    <span className="text-foreground-muted">{f.dossiers?.panden?.omschrijving || f.dossiers?.panden?.adres || '—'}</span>
                    <span className="text-primary">{euro(f.totaal_incl_btw)}</span>
                    <span className="text-xs text-foreground-muted">
                      {FACTUUR_STATUS_LABELS[f.status] ?? f.status}
                      {isFactuurVervallen(f, vandaagIso) ? <span className="ml-1 font-medium text-error">Vervallen</span> : null}
                    </span>
                    <span className="text-xs text-foreground-muted">{formatDatumNl(f.factuurdatum)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  )
}
