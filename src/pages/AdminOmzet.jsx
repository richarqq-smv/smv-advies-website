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
import { FACTUUR_STATUS_LABELS } from '../lib/klantOmgeving/factuur'
import { berekenBtwOverzicht, berekenBtwPeriode, formatBtwPeriodeLabel } from '../lib/klantOmgeving/btwOverzicht'

function vandaagIso() {
  return new Date().toISOString().slice(0, 10)
}

const OMZET_STATUSSEN = new Set(['verzonden', 'betaald', 'vervallen'])

/**
 * Omzetoverzicht (/admin/administratie/omzet, klikbaar vanaf de Omzet-
 * kaart op /admin/administratie) — zelfde ankerdatum-idioom als het
 * bestaande BTW-overzicht (AdminBtw.jsx), hier op jaarniveau: één fetch
 * per jaar van de ankerdatum, waaruit maand/jaar-totalen, de
 * maandopbouw, de opbouw per klant én de volledige factuurlijst client-
 * side worden afgeleid (zelfde "één brede fetch"-aanpak als
 * AdminAdministratie.jsx).
 *
 * Geannuleerde/concept-facturen tellen nooit mee in een omzetcijfer
 * (berekenBtwOverzicht filtert al op verzonden/betaald/vervallen, zie
 * btwOverzicht.js) — ze blijven wel gewoon zichtbaar in de factuurlijst
 * onderaan, met hun eigen statuslabel, zodat nooit de indruk ontstaat dat
 * ze "verdwenen" zijn.
 */
export default function AdminOmzet() {
  const [anker, setAnker] = useState(vandaagIso())
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [facturen, setFacturen] = useState([])

  const jaarPeriode = berekenBtwPeriode('jaar', anker)
  const maandPeriode = berekenBtwPeriode('maand', anker)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListFacturen({ vanaf: jaarPeriode.vanaf, tot: jaarPeriode.tot })
      .then((rows) => actief && setFacturen(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [jaarPeriode.vanaf, jaarPeriode.tot])

  const maandFacturen = facturen.filter((f) => f.factuurdatum >= maandPeriode.vanaf && f.factuurdatum <= maandPeriode.tot)
  const maandOverzicht = berekenBtwOverzicht({ facturen: maandFacturen })
  const jaarOverzicht = berekenBtwOverzicht({ facturen })

  const jaar = Number(jaarPeriode.vanaf.slice(0, 4))
  const perMaand = Array.from({ length: 12 }, (_, maandIndex0) => {
    const label = new Date(jaar, maandIndex0, 1).toLocaleDateString('nl-NL', { month: 'long' })
    const maandStr = String(maandIndex0 + 1).padStart(2, '0')
    const facturenInMaand = facturen.filter((f) => f.factuurdatum.slice(0, 7) === `${jaar}-${maandStr}` && OMZET_STATUSSEN.has(f.status))
    const omzetExclBtw = facturenInMaand.reduce((som, f) => som + Number(f.subtotaal_excl_btw ?? 0), 0)
    return { label, omzetExclBtw, aantal: facturenInMaand.length }
  })

  const perKlant = Object.values(
    facturen
      .filter((f) => OMZET_STATUSSEN.has(f.status))
      .reduce((groepen, f) => {
        const naam = f.klanten?.naam || f.klanten?.bedrijfsnaam || 'Onbekende klant'
        if (!groepen[f.klant_id]) groepen[f.klant_id] = { naam, omzetExclBtw: 0, aantal: 0 }
        groepen[f.klant_id].omzetExclBtw += Number(f.subtotaal_excl_btw ?? 0)
        groepen[f.klant_id].aantal += 1
        return groepen
      }, {}),
  ).sort((a, b) => b.omzetExclBtw - a.omzetExclBtw)

  const factuurlijst = [...facturen].sort((a, b) => b.factuurdatum.localeCompare(a.factuurdatum))

  return (
    <>
      <Seo title="Omzet" description="Omzetoverzicht per maand, per klant en per factuur." noindex />
      <PageHero eyebrow="Administratie" title="Omzet" description="Omzet excl. btw, gebaseerd op daadwerkelijk verstuurde facturen." />
      <Section tone="white" noTopPadding>
        <Container wide>
          <Button as="link" to={ROUTES.adminAdministratie} variant="ghost" size="sm" className="mb-5">
            <ArrowLeft size={16} /> Administratie
          </Button>

          <label className="mb-5 flex items-center gap-2 text-sm text-foreground-muted">
            Periode bevat
            <input
              type="date"
              value={anker}
              onChange={(e) => setAnker(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </label>

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
              <WarningCircle size={15} weight="fill" />
              {fout}
            </p>
          ) : (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">{formatBtwPeriodeLabel('maand', anker)}</p>
                  <p className="mt-2 text-2xl font-medium text-primary">{euro(maandOverzicht.omzetExclBtw)}</p>
                  <p className="text-sm text-foreground-muted">excl. btw · {maandOverzicht.facturenMeegeteld.length} facturen</p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">{formatBtwPeriodeLabel('jaar', anker)}</p>
                  <p className="mt-2 text-2xl font-medium text-primary">{euro(jaarOverzicht.omzetExclBtw)}</p>
                  <p className="text-sm text-foreground-muted">excl. btw · {jaarOverzicht.facturenMeegeteld.length} facturen</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold tracking-[0.1em] text-accent uppercase">Omzet per maand — {jaar}</h3>
                <ul className="flex flex-col gap-1">
                  {perMaand.map((m) => (
                    <li key={m.label} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-white px-4 py-2 text-sm">
                      <span className="text-primary capitalize">{m.label}</span>
                      <span className="text-xs text-foreground-muted">{m.aantal} {m.aantal === 1 ? 'factuur' : 'facturen'}</span>
                      <span className="font-medium text-primary">{euro(m.omzetExclBtw)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold tracking-[0.1em] text-accent uppercase">Omzet per klant — {jaar}</h3>
                {perKlant.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Geen omzet in dit jaar.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {perKlant.map((k) => (
                      <li key={k.naam} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-white px-4 py-2 text-sm">
                        <span className="text-primary">{k.naam}</span>
                        <span className="text-xs text-foreground-muted">{k.aantal} {k.aantal === 1 ? 'factuur' : 'facturen'}</span>
                        <span className="font-medium text-primary">{euro(k.omzetExclBtw)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold tracking-[0.1em] text-accent uppercase">Facturen — {jaar}</h3>
                <p className="mb-2 text-xs text-foreground-muted">
                  Alleen facturen met status verzonden, betaald of vervallen tellen mee in de omzet hierboven. Concept en geannuleerd staan
                  hier ter referentie, niet meegeteld.
                </p>
                {factuurlijst.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Geen facturen in dit jaar.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {factuurlijst.map((f) => (
                      <li key={f.factuur_id}>
                        <Link
                          to={ROUTES.adminFactuurDetail(f.factuur_id)}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm hover:border-accent hover:bg-muted"
                        >
                          <span className="font-medium text-primary">{f.factuurnummer}</span>
                          <span className="text-foreground-muted">{f.klanten?.naam || f.klanten?.bedrijfsnaam || 'Onbekende klant'}</span>
                          <span className="text-xs text-foreground-muted">{FACTUUR_STATUS_LABELS[f.status] ?? f.status}</span>
                          <span className="text-xs text-foreground-muted">{formatDatumNl(f.factuurdatum)}</span>
                          <span className={OMZET_STATUSSEN.has(f.status) ? 'text-primary' : 'text-foreground-muted line-through'}>
                            {euro(f.subtotaal_excl_btw)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </Container>
      </Section>
    </>
  )
}
