import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, Printer } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { adminListAdviespunten } from '../lib/klantOmgeving/api'
import { groepeerAdviespunten } from '../lib/dossier/adviesresultaat'
import { formatDatumNl } from '../lib/klantOmgeving/offerte'
import { triggerIcsDownload } from '../lib/klantOmgeving/icsExport'

/**
 * "Wat kan wachten?" (werkfase Fase 8) — dossier-overstijgende, prominente
 * weergave van alle adviespunten van alle OPEN dossiers, gegroepeerd op de
 * vijf bestaande adviesstatussen (lib/mjop/constants.js STATUSES). Geen
 * nieuwe status toegevoegd — groepeerAdviespunten() (al bestaand, getest)
 * blijft de enige bron van de groepering/volgorde. Admin-only: dit is
 * praktijkoverzicht voor Richard, geen klantfunctie.
 */
export default function WatKanWachten() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [adviespunten, setAdviespunten] = useState([])

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    adminListAdviespunten()
      .then((rows) => actief && setAdviespunten(rows))
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  const { groepen } = useMemo(() => {
    // Alleen open dossiers: een afgerond dossier heeft zijn advies al
    // definitief vastgelegd, "wat kan wachten" is dan geen open vraag meer.
    const openAdviespunten = adviespunten.filter((a) => a.dossiers?.status === 'open')
    return groepeerAdviespunten(openAdviespunten.map((a) => ({ ...a, adviesStatus: a.advies_status, adviespuntId: a.adviespunt_id })))
  }, [adviespunten])

  const totaal = groepen.reduce((som, g) => som + g.aantal, 0)

  // Werkfase Fase 9 — .ics-export, browser-native, geen externe agenda-API.
  // Alleen adviespunten met een structureel herbeoordelenDatum leveren een
  // kalenderitem op (zie icsExport.js) — vrije-tekstwaarden zonder datum
  // worden bewust overgeslagen, niet geraden.
  const icsItems = useMemo(
    () =>
      groepen
        .flatMap((g) => g.adviespunten)
        .map((a) => ({
          adviespuntId: a.adviespuntId,
          onderwerp: a.onderwerp,
          herbeoordelenDatum: a.herbeoordelen_datum,
          toelichting: a.toelichting,
          klantNaam: a.dossiers?.klanten?.naam || a.dossiers?.klanten?.bedrijfsnaam,
          pandNaam: a.dossiers?.panden?.omschrijving || a.dossiers?.panden?.adres,
        })),
    [groepen],
  )
  const heeftIcsItems = icsItems.some((i) => i.herbeoordelenDatum)

  return (
    <>
      <Seo title="Wat kan wachten?" description="Overzicht van adviespunten per status, over alle open dossiers." noindex />
      <PageHero eyebrow="SMV Assistent" title="Wat kan wachten?" description="Niet alles hoeft vandaag — maar het moet wel duidelijk zijn waarom iets kan wachten." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : totaal === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
              Geen adviespunten in open dossiers.
            </p>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap justify-end gap-2 print:hidden">
                {heeftIcsItems ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => triggerIcsDownload(icsItems, 'smv-herbeoordelingen.ics')}>
                    <CalendarPlus size={16} /> Herbeoordelingen exporteren (.ics)
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" size="sm" onClick={() => window.print()}>
                  <Printer size={16} /> Afdrukken
                </Button>
              </div>
              {groepen.map((groep) =>
                groep.aantal === 0 ? null : (
                  <div key={groep.status}>
                    <h2 className="mb-3 text-lg text-primary">
                      {groep.label} <span className="font-mono text-sm font-normal text-foreground-muted">({groep.aantal})</span>
                    </h2>
                    <ul className="flex flex-col gap-2">
                      {groep.adviespunten.map((a) => {
                        const dossier = a.dossiers
                        const vervangingsmoment = a.signaal_bevroren?.relevantYear ?? null
                        return (
                          <li key={a.adviespuntId} className="rounded-lg border border-border bg-white px-4 py-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="font-medium text-primary">{a.onderwerp}</p>
                              {dossier ? (
                                <Link to={ROUTES.dossier(dossier.dossier_id)} className="text-xs font-medium text-accent hover:underline">
                                  {dossier.klanten?.naam || dossier.klanten?.bedrijfsnaam || 'Onbekende klant'} ·{' '}
                                  {dossier.panden?.omschrijving || dossier.panden?.adres || 'Onbekend pand'}
                                </Link>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-foreground-muted">{a.toelichting}</p>
                            <p className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-foreground-muted">
                              {vervangingsmoment ? <span>Gepland vervangingsmoment: {vervangingsmoment}</span> : null}
                              {a.herbeoordelen_datum ? <span>Herbeoordelen op: {formatDatumNl(a.herbeoordelen_datum)}</span> : null}
                              {a.herbeoordelen_bij ? <span>Herbeoordelen: {a.herbeoordelen_bij}</span> : null}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ),
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
