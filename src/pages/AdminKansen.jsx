import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { AdminTerugKnop } from '../components/admin/AdminTerugKnop'
import { ROUTES } from '../lib/routes'
import { adminListCommercieleKansen } from '../lib/klantOmgeving/api'
import { VERVOLGSTAP_LABELS } from '../lib/klantOmgeving/commercieleKans'
import { formatDatumNl } from '../lib/klantOmgeving/offerte'

/**
 * Commerciële kansenoverzicht (/admin/kansen, Admin-ronde 2026-09-28) —
 * uitsluitend dossiers waarvoor daadwerkelijk een commerciële kans is
 * vastgelegd (adminListCommercieleKansen() geeft precies dat terug: elke
 * rij in dossier_commerciele_kansen, standaard op laatste wijziging). Geen
 * CRM-pipeline, geen kanban, geen automatische ranking — een eenvoudige
 * lijst, klik naar het bestaande dossier. Admin-only, zelfde RLS als de
 * rest van deze functie (0012_dossier_commerciele_kansen.sql).
 */
export default function AdminKansen() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [kansen, setKansen] = useState([])

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListCommercieleKansen()
      .then((rows) => actief && setKansen(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  return (
    <>
      <Seo title="Commerciële kansen" description="Dossiers met een vastgelegde interne commerciële kans." noindex />
      <PageHero eyebrow="Beheer" title="Commerciële kansen" description="Dossiers waarvoor een interne commerciële vervolgstap is vastgelegd." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <AdminTerugKnop />
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : kansen.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
              Nog geen commerciële kansen vastgelegd.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {kansen.map((k) => (
                <li key={k.dossier_id}>
                  <Link
                    to={ROUTES.dossier(k.dossier_id)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
                  >
                    <span className="font-medium text-primary">{k.dossiers?.klanten?.naam || k.dossiers?.klanten?.bedrijfsnaam || 'Onbekende klant'}</span>
                    <span className="text-foreground-muted">{k.dossiers?.panden?.omschrijving || k.dossiers?.panden?.adres || 'Onbekend pand'}</span>
                    <span className="text-primary">{VERVOLGSTAP_LABELS[k.vervolgstap] ?? k.vervolgstap}</span>
                    <span className="text-xs text-foreground-muted">Gewijzigd op {formatDatumNl(k.updated_at?.slice(0, 10))}</span>
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
