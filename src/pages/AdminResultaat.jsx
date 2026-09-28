import { useEffect, useState } from 'react'
import { ArrowLeft, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { adminListFacturen, adminListKosten } from '../lib/klantOmgeving/api'
import { euro } from '../lib/klantOmgeving/offerte'
import { BTW_PERIODE_TYPES, berekenBtwOverzicht, berekenBtwPeriode, formatBtwPeriodeLabel, vorigePeriodeAnker } from '../lib/klantOmgeving/btwOverzicht'

function vandaagIso() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Resultaatoverzicht (/admin/administratie/resultaat) — een eenvoudig
 * intern managementoverzicht (omzet - kosten = resultaat), GEEN fiscale
 * winstberekening: geen afschrijvingen, geen reserveringen, geen
 * correcties. Zelfde periodeselector als het bestaande BTW-overzicht
 * (maand/kwartaal/jaar + ankerdatum, AdminBtw.jsx) voor een consistente
 * gebruikservaring, hier aangevuld met de vorige-periode-vergelijking via
 * vorigePeriodeAnker() (btwOverzicht.js).
 */
export default function AdminResultaat() {
  const [periodeType, setPeriodeType] = useState('kwartaal')
  const [anker, setAnker] = useState(vandaagIso())
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [facturen, setFacturen] = useState([])
  const [kosten, setKosten] = useState([])

  const periode = berekenBtwPeriode(periodeType, anker)
  const periodeLabel = formatBtwPeriodeLabel(periodeType, anker)
  const vorigeAnker = vorigePeriodeAnker(periodeType, anker)
  const vorigePeriode = berekenBtwPeriode(periodeType, vorigeAnker)
  const vorigePeriodeLabel = formatBtwPeriodeLabel(periodeType, vorigeAnker)

  // Eén brede fetch die beide periodes dekt (huidige periode ligt altijd
  // ná de vorige) — zelfde "één fetch, meerdere periodes client-side
  // afgeleid"-aanpak als AdminAdministratie.jsx/AdminOmzet.jsx.
  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    Promise.all([
      adminListFacturen({ vanaf: vorigePeriode.vanaf, tot: periode.tot }),
      adminListKosten({ vanaf: vorigePeriode.vanaf, tot: periode.tot }),
    ])
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
  }, [vorigePeriode.vanaf, periode.tot])

  const huidigeFacturen = facturen.filter((f) => f.factuurdatum >= periode.vanaf && f.factuurdatum <= periode.tot)
  const huidigeKosten = kosten.filter((k) => k.datum >= periode.vanaf && k.datum <= periode.tot)
  const huidig = berekenBtwOverzicht({ facturen: huidigeFacturen, kosten: huidigeKosten })
  const huidigResultaat = huidig.omzetExclBtw - huidig.kostenExclBtw

  const vorigeFacturen = facturen.filter((f) => f.factuurdatum >= vorigePeriode.vanaf && f.factuurdatum <= vorigePeriode.tot)
  const vorigeKosten = kosten.filter((k) => k.datum >= vorigePeriode.vanaf && k.datum <= vorigePeriode.tot)
  const vorig = berekenBtwOverzicht({ facturen: vorigeFacturen, kosten: vorigeKosten })
  const vorigResultaat = vorig.omzetExclBtw - vorig.kostenExclBtw

  const verschil = huidigResultaat - vorigResultaat

  return (
    <>
      <Seo title="Resultaat" description="Eenvoudig managementoverzicht: omzet, kosten en resultaat per periode." noindex />
      <PageHero eyebrow="Administratie" title="Resultaat" description="Omzet minus kosten, excl. btw — een interne managementweergave, geen jaarrekening." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
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
                <dl className="flex flex-col gap-1">
                  <Regel label="Omzet excl. btw" waarde={euro(huidig.omzetExclBtw)} />
                  <Regel label="Kosten excl. btw" waarde={euro(huidig.kostenExclBtw)} />
                  <Regel label="Resultaat" waarde={euro(huidigResultaat)} nadruk />
                </dl>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-accent uppercase">Vergelijking met {vorigePeriodeLabel}</p>
                  <dl className="flex flex-col gap-1">
                    <Regel label={`Resultaat ${vorigePeriodeLabel}`} waarde={euro(vorigResultaat)} />
                    <Regel
                      label="Verschil"
                      waarde={`${verschil >= 0 ? '+' : ''}${euro(verschil)}`}
                      nadrukKleur={verschil > 0 ? 'text-primary' : verschil < 0 ? 'text-error' : undefined}
                    />
                  </dl>
                </div>
              </div>

              <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-foreground-muted">
                Resultaat = omzet excl. btw (verzonden/betaald/vervallen facturen) minus geregistreerde kosten excl. btw, in deze periode.
                Dit is een eenvoudige interne managementweergave, geen officiële jaarrekening of fiscale winstberekening — als niet alle
                kosten al zijn geregistreerd (zie Kosten), is het resultaat hierboven navenant te hoog.
              </p>
            </>
          )}
        </Container>
      </Section>
    </>
  )
}

function Regel({ label, waarde, nadruk = false, nadrukKleur }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className={nadrukKleur ?? (nadruk ? 'text-lg font-medium text-primary' : 'text-sm text-primary')}>{waarde}</dd>
    </div>
  )
}
