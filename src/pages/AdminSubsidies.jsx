import { useEffect, useState } from 'react'
import { ArrowSquareOut, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { AdminTerugKnop } from '../components/admin/AdminTerugKnop'
import { adminListRvoSubsidieIndex, adminGetRvoSyncStatus } from '../lib/klantOmgeving/api'

const RVO_BASIS_URL = 'https://www.rvo.nl'

function formatSyncDatum(timestamp) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * RVO-subsidie-naslag (/admin/subsidies, onderzoeksronde 2026-10-07) —
 * puur-lezende weergave van rvo_subsidie_index, een maandelijks (1e van
 * de maand, 03:00 UTC) automatisch gesynchroniseerde referentielijst
 * van actuele RVO-subsidie/financieringspagina's. Bron:
 * rvo.nl/api/v1/opendata/subsidies — exact de brondata achter RVO's
 * eigen "Subsidie- en financieringswijzer".
 *
 * Bewust GEEN percentages/bedragen (die staan niet in de brondata, zie
 * de syncstatusmelding hieronder) — dit is een doorzoekbare vindplaats
 * met directe link naar de officiële RVO-pagina, geen rekentool.
 *
 * De syncstatus (laatste rij uit rvo_sync_log) staat altijd bovenaan
 * zichtbaar — ook bij een mislukte sync, zodat nooit stil voorbijgaat
 * dat de lijst mogelijk verouderd is. Een mislukte sync raakt de lijst
 * zelf nooit aan (zie rvo_sync_vervang_index in de migratie): de laatst
 * bekende goede data blijft gewoon zichtbaar.
 */
export default function AdminSubsidies() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [items, setItems] = useState([])
  const [syncStatus, setSyncStatus] = useState(null)
  const [zoekterm, setZoekterm] = useState('')

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    Promise.all([adminListRvoSubsidieIndex(), adminGetRvoSyncStatus()])
      .then(([rows, status]) => {
        if (!actief) return
        setItems(rows)
        setSyncStatus(status)
      })
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  const gefilterdeItems = items.filter((item) => {
    const q = zoekterm.trim().toLowerCase()
    if (!q) return true
    const velden = [item.titel, item.intro, ...(item.sectoren ?? []), ...(item.doelgroepen ?? []), ...(item.tags ?? [])]
    return velden.some((v) => (v ?? '').toString().toLowerCase().includes(q))
  })

  return (
    <>
      <Seo title="Subsidies" description="Referentielijst van actuele RVO-subsidie- en financieringspagina's." noindex />
      <PageHero
        eyebrow="Beheer"
        title="Subsidies"
        description="Maandelijks gesynchroniseerde referentielijst van actuele RVO-subsidiepagina's — vindplaats en link naar de officiële regeling, geen percentages of bedragen (die staan alleen op de RVO-pagina zelf)."
      />
      <Section tone="white" noTopPadding>
        <Container wide>
          <AdminTerugKnop />

          {!laden && syncStatus ? (
            <div
              className={`mb-6 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
                syncStatus.status === 'success' ? 'border-border bg-muted/40 text-foreground-muted' : 'border-error-bg bg-error-bg text-error'
              }`}
            >
              {syncStatus.status === 'success' ? (
                <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-accent" />
              ) : (
                <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0" />
              )}
              <span className="min-w-0 break-words">
                {syncStatus.status === 'success' ? (
                  <>
                    Laatst gesynchroniseerd op {formatSyncDatum(syncStatus.gestart_op)} — {syncStatus.aantal_items} item(s).
                  </>
                ) : (
                  <>
                    Laatste synchronisatie ({formatSyncDatum(syncStatus.gestart_op)}) is mislukt: {syncStatus.foutmelding}. De lijst hieronder toont de
                    laatst bekende goede data.
                  </>
                )}
              </span>
            </div>
          ) : null}

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
              Nog geen data gesynchroniseerd.
            </p>
          ) : (
            <>
              <input
                type="search"
                placeholder="Zoek op titel, sector of doelgroep"
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                className="mb-4 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              />
              {gefilterdeItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">Geen items gevonden.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {gefilterdeItems.map((item) => (
                    <li key={item.id} className="rounded-lg border border-border bg-white px-4 py-3 text-sm">
                      <a
                        href={item.url ? `${RVO_BASIS_URL}${item.url}` : RVO_BASIS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start justify-between gap-2 font-medium text-primary hover:text-accent hover:underline"
                      >
                        <span className="min-w-0 break-words">{item.titel}</span>
                        <ArrowSquareOut size={15} className="mt-0.5 shrink-0 text-foreground-muted" />
                      </a>
                      {item.intro ? <p className="mt-1.5 line-clamp-2 text-xs text-foreground-muted">{item.intro}</p> : null}
                      {(item.sectoren?.length ?? 0) > 0 || (item.doelgroepen?.length ?? 0) > 0 ? (
                        <p className="mt-2 text-xs text-foreground-muted">{[...(item.sectoren ?? []), ...(item.doelgroepen ?? [])].join(' · ')}</p>
                      ) : null}
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
