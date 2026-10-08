import { useEffect, useMemo, useState } from 'react'
import { ArrowSquareOut, Plus, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { buildInsights } from '../../lib/mjop/linking'
import { buildEnergieInsights } from '../../lib/dossier/energieInsights'
import { adminListRvoSubsidieIndex, addDossierSubsidie } from '../../lib/klantOmgeving/api'
import {
  bepaalSubsidieSignalen,
  koppelRvoRegelingenAanDossier,
  sorteerSubsidieCheck,
  SUBSIDIE_CHECK_STATUSSEN,
  SUBSIDIE_CHECK_STATUS_LABELS,
} from '../../lib/dossier/subsidieCheck'

const RVO_BASIS_URL = 'https://www.rvo.nl'

const STATUS_BADGE = {
  [SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD]: 'bg-primary/10 text-primary',
  [SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT]: 'bg-accent/10 text-accent',
  [SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN]: 'bg-muted text-foreground-muted',
}

/**
 * Subsidiecheck (pakket-/subsidiearchitectuurronde, 2026-10-08) — toont
 * binnen dit dossier welke bestaande RVO-regelingen (rvo_subsidie_index,
 * admin-only naslag) de moeite waard zijn om nader te bekijken, op basis
 * van gegevens die al in dit dossier staan (pandtype, MJOP-/Energie-
 * advieslogica — zie subsidieCheck.js). GEEN nieuwe subsidiedatabase: een
 * regeling die de adviseur daadwerkelijk wil oppakken wordt via de
 * bestaande "Subsidie toevoegen"-actie (DossierSubsidies.jsx,
 * dossier_subsidies) vastgelegd — dit component roept hier bewust
 * dezelfde addDossierSubsidie() aan, geen tweede opslagpad.
 *
 * Expliciet onderscheid (opdracht §7): de badge hieronder is altijd
 * RVO-broninformatie + een signaalmatch (metadata, geen eligibility) óf
 * "al vastgelegd" (dan is het de echte, bestaande SMV-beoordeling uit
 * dossier_subsidies.status). Nooit een bedrag, percentage of
 * toekenningsclaim.
 */
export function SubsidieCheck({ dossierId, pand, mjopSnapshot, energieSnapshot, subsidies = [], magBeheren, onSubsidieToegevoegd }) {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [rvoItems, setRvoItems] = useState([])
  const [toonOverige, setToonOverige] = useState(false)
  const [toevoegenBezigId, setToevoegenBezigId] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListRvoSubsidieIndex()
      .then((rows) => actief && setRvoItems(rows))
      .catch(() => actief && setFout('RVO-regelingen konden niet worden geladen.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  // Hergebruikt uitsluitend de al bestaande, al geteste advieslogica — zelfde
  // functies als DossierWerkruimte.jsx al gebruikt voor dit dossier. Geen
  // nieuwe berekening, alleen de maatregelnamen eruit verzamelen.
  const gekoppeld = useMemo(() => {
    const mjopMaatregelNamen = (mjopSnapshot?.components ? buildInsights(mjopSnapshot) : []).flatMap(
      (insight) => insight.recommendations?.map((r) => r.measureName).filter(Boolean) ?? [],
    )
    const energieMaatregelNamen = buildEnergieInsights(energieSnapshot).map((i) => i.maatregelNaam)
    const signalen = bepaalSubsidieSignalen({ pand, mjopMaatregelNamen, energieMaatregelNamen })
    return sorteerSubsidieCheck(koppelRvoRegelingenAanDossier({ rvoItems, signalen, bestaandeSubsidies: subsidies }))
  }, [rvoItems, subsidies, mjopSnapshot, energieSnapshot, pand])

  const prominent = gekoppeld.filter((g) => g.status !== SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN)
  const overig = gekoppeld.filter((g) => g.status === SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN)

  async function toevoegenAlsTraject(item) {
    setToevoegenBezigId(item.id)
    try {
      const nieuw = await addDossierSubsidie(dossierId, { regelingNaam: item.titel })
      onSubsidieToegevoegd?.(nieuw)
    } catch {
      setFout('Toevoegen als subsidietraject is niet gelukt. Probeer het opnieuw.')
    } finally {
      setToevoegenBezigId(null)
    }
  }

  function Regel({ gekoppeldItem }) {
    const { item, status } = gekoppeldItem
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <a
            href={item.url ? `${RVO_BASIS_URL}${item.url}` : RVO_BASIS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-1.5 font-medium text-primary hover:text-accent hover:underline"
          >
            <span className="min-w-0 break-words">{item.titel}</span>
            <ArrowSquareOut size={14} className="mt-0.5 shrink-0 text-foreground-muted" />
          </a>
          {item.intro ? <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">{item.intro}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[status]}`}>
            {SUBSIDIE_CHECK_STATUS_LABELS[status]}
          </span>
          {magBeheren && status !== SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD ? (
            <Button type="button" variant="outline" size="sm" onClick={() => toevoegenAlsTraject(item)} disabled={toevoegenBezigId === item.id}>
              <Plus size={14} /> {toevoegenBezigId === item.id ? 'Bezig...' : 'Toevoegen als subsidietraject'}
            </Button>
          ) : null}
        </div>
      </li>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Subsidiecheck</p>
        <h4 className="text-base font-medium text-primary">Welke regelingen zijn het bekijken waard?</h4>
        <p className="mt-1 text-xs text-foreground-muted">
          Gebaseerd op het pandtype en de maatregelen die MJOP/Energie-indicatie voor dit dossier al aanwijzen. De badge hierboven komt uit de
          RVO-referentielijst (titel/sector, geen bedragen of percentages) of — zodra vastgelegd — uit de eigen SMV-beoordeling hieronder. Geen
          garantie op toekenning.
        </p>
      </div>

      {laden ? (
        <p className="text-sm text-foreground-muted">Bezig met laden...</p>
      ) : fout ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
          <WarningCircle size={15} weight="fill" />
          {fout}
        </p>
      ) : gekoppeld.length === 0 ? (
        <p className="text-sm text-foreground-muted">Nog geen RVO-referentielijst gesynchroniseerd.</p>
      ) : (
        <>
          {prominent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-3 text-center text-sm text-foreground-muted">
              Geen directe signaalmatch gevonden — bekijk desgewenst de overige regelingen hieronder.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {prominent.map((g) => (
                <Regel key={g.item.id} gekoppeldItem={g} />
              ))}
            </ul>
          )}

          {overig.length > 0 ? (
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setToonOverige((v) => !v)}>
                {toonOverige ? 'Verberg' : 'Toon'} overige regelingen ({overig.length})
              </Button>
              {toonOverige ? (
                <ul className="mt-2 flex flex-col gap-2">
                  {overig.map((g) => (
                    <Regel key={g.item.id} gekoppeldItem={g} />
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {!laden && !fout && gekoppeld.length > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <CheckCircle size={13} />
          RVO-regelingen zijn een referentielijst (metadata, geen rekentool) — bekijk de officiële pagina voor actuele voorwaarden en bedragen.
        </p>
      ) : null}
    </div>
  )
}
