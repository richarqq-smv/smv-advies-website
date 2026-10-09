import { useEffect, useState } from 'react'
import { ArrowLeft, DownloadSimple, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { adminListFacturen, adminListKosten } from '../lib/klantOmgeving/api'
import { euro, formatDatumNl } from '../lib/klantOmgeving/offerte'
import { FACTUUR_STATUS_LABELS } from '../lib/klantOmgeving/factuur'
import { BTW_PERIODE_TYPES, berekenBtwOverzicht, berekenBtwPeriode, formatBtwPeriodeLabel } from '../lib/klantOmgeving/btwOverzicht'
import { KOSTEN_CATEGORIE_LABELS } from '../lib/klantOmgeving/kosten'
import { triggerBtwAangifteCsvDownload } from '../lib/klantOmgeving/btwExport'

function vandaagIso() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * BTW-overzicht (/admin/administratie/btw, opdracht sectie 12+13) —
 * periodeselector (maand/kwartaal/jaar, met een los ankerdatum-veld om ook
 * een eerdere periode te kunnen bekijken) plus een expliciete lijst van
 * elke onderliggende factuur en kostenpost: nooit alleen het eindtotaal
 * tonen zonder herleidbare herkomst. "BTW-aangifte voorbereiden" doet geen
 * automatische indiening bij de Belastingdienst en claimt dat ook nergens
 * — het is uitsluitend een controleerbaar exportbestand (CSV) voor de
 * eigen administratie/boekhouder, met een expliciete waarschuwing om de
 * bedragen eerst te controleren.
 */
export default function AdminBtw() {
  const [periodeType, setPeriodeType] = useState('kwartaal')
  const [anker, setAnker] = useState(vandaagIso())
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [facturen, setFacturen] = useState([])
  const [kosten, setKosten] = useState([])

  const periode = berekenBtwPeriode(periodeType, anker)
  const periodeLabel = formatBtwPeriodeLabel(periodeType, anker)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    Promise.all([adminListFacturen({ vanaf: periode.vanaf, tot: periode.tot }), adminListKosten({ vanaf: periode.vanaf, tot: periode.tot })])
      .then(([f, k]) => {
        if (!actief) return
        setFacturen(f)
        setKosten(k)
      })
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [periode.vanaf, periode.tot])

  const overzicht = berekenBtwOverzicht({ facturen, kosten })

  return (
    <>
      <Seo title="Btw-overzicht" description="Btw-overzicht per periode, met onderliggende facturen en kosten." noindex />
      <PageHero eyebrow="Administratie" title="Btw-overzicht" description="Omzet, kosten en btw-saldo per periode, met elke onderliggende transactie." />
      <Section tone="white" noTopPadding>
        <Container wide>
          <Button as="link" to={ROUTES.adminAdministratie} variant="ghost" size="sm" className="mb-5">
            <ArrowLeft size={16} /> Administratie
          </Button>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {BTW_PERIODE_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPeriodeType(t.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    periodeType === t.id ? 'bg-primary text-white' : 'bg-muted text-foreground-muted hover:text-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground-muted">
              Periode bevat
              <input
                type="date"
                value={anker}
                onChange={(e) => setAnker(e.target.value)}
                className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
              />
            </label>
          </div>

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
              <WarningCircle size={15} weight="fill" />
              {fout}
            </p>
          ) : (
            <>
              <div className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg text-primary">{periodeLabel}</h2>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Regel label="Omzet excl. btw" waarde={euro(overzicht.omzetExclBtw)} />
                  <Regel label="Btw verkoop (verschuldigd)" waarde={euro(overzicht.btwVerkoop)} />
                  <Regel label="Kosten excl. btw" waarde={euro(overzicht.kostenExclBtw)} />
                  <Regel label="Btw aftrekbaar" waarde={euro(overzicht.btwAftrekbaar)} />
                  <Regel label="Saldo" waarde={euro(overzicht.saldo)} nadruk />
                </dl>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-3 text-sm text-foreground-muted">
                    <span className="font-medium text-primary">Controleer de bedragen voordat u de aangifte indient.</span> Deze knop dient
                    geen aangifte in bij de Belastingdienst — hij levert alleen een exportbestand voor uw eigen administratie of boekhouder.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => triggerBtwAangifteCsvDownload({ periodeLabel, overzicht, facturen: overzicht.facturenMeegeteld, kosten })}
                  >
                    <DownloadSimple size={15} /> BTW-aangifte voorbereiden (CSV)
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold tracking-[0.1em] text-accent uppercase">Facturen in deze periode</h3>
                {overzicht.facturenMeegeteld.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Geen facturen meegeteld in deze periode.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {overzicht.facturenMeegeteld.map((f) => (
                      <li key={f.factuur_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm">
                        <span className="font-medium text-primary">{f.factuurnummer}</span>
                        <span className="text-xs text-foreground-muted">{FACTUUR_STATUS_LABELS[f.status] ?? f.status}</span>
                        <span className="text-xs text-foreground-muted">{formatDatumNl(f.factuurdatum)}</span>
                        <span className="text-primary">{euro(f.subtotaal_excl_btw)} excl. btw</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold tracking-[0.1em] text-accent uppercase">Kosten in deze periode</h3>
                {kosten.length === 0 ? (
                  <p className="text-sm text-foreground-muted">Geen kosten in deze periode.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {kosten.map((k) => (
                      <li key={k.kosten_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm">
                        <span className="font-medium text-primary">
                          {k.leverancier} — {k.omschrijving}
                        </span>
                        <span className="text-xs text-foreground-muted">{KOSTEN_CATEGORIE_LABELS[k.categorie] ?? k.categorie}</span>
                        <span className="text-xs text-foreground-muted">{formatDatumNl(k.datum)}</span>
                        <span className="text-primary">{euro(k.bedrag_excl_btw)} excl. btw</span>
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

function Regel({ label, waarde, nadruk = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className={nadruk ? 'text-lg font-medium text-primary' : 'text-sm text-primary'}>{waarde}</dd>
    </div>
  )
}
