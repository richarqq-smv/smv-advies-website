import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { ROUTES } from '../lib/routes'
import { adminListOffertes } from '../lib/klantOmgeving/api'
import { euro, formatDatumNl } from '../lib/klantOmgeving/offerte'

const STATUS_LABELS = {
  concept: 'Concept',
  verstuurd: 'Verstuurd',
  geaccepteerd: 'Geaccepteerd',
  afgewezen: 'Afgewezen',
  geannuleerd: 'Geannuleerd',
}

/**
 * Admin-breed offerteoverzicht (/admin/offertes, Administratie-ronde
 * 2026-09-28) — hergebruikt de al bestaande adminListOffertes() (eerder
 * alleen gebruikt door VandaagOverzicht.jsx). Geen tweede offerteweergave
 * of -beheer hier: "openen" navigeert naar het bestaande dossier, waar
 * OffertesHistorie.jsx (met de status-acties, en sinds deze ronde ook
 * "Factuur maken"/"Bekijk factuur") de daadwerkelijke offerte toont.
 */
export default function AdminOffertes() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [offertes, setOffertes] = useState([])

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListOffertes()
      .then((rows) => actief && setOffertes(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  return (
    <>
      <Seo title="Offertes" description="Overzicht van alle offertes." noindex />
      <PageHero eyebrow="Beheer" title="Offertes" description="Alle offertes, over alle klanten en dossiers heen." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : offertes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Nog geen offertes.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {offertes.map((o) => (
                <li key={o.id}>
                  <Link
                    to={ROUTES.dossier(o.dossiers?.dossier_id)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm hover:border-accent hover:bg-muted"
                  >
                    <span className="font-medium text-primary">{o.offerte_nummer}</span>
                    <span className="text-foreground-muted">{o.dossiers?.klanten?.naam || o.dossiers?.klanten?.bedrijfsnaam || 'Onbekende klant'}</span>
                    <span className="text-foreground-muted">{o.dossiers?.panden?.omschrijving || o.dossiers?.panden?.adres || 'Onbekend pand'}</span>
                    <span className="text-primary">{euro(o.totaal)}</span>
                    <span className="text-xs text-foreground-muted">{STATUS_LABELS[o.status] ?? o.status}</span>
                    <span className="text-xs text-foreground-muted">{formatDatumNl(o.offerte_datum)}</span>
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
