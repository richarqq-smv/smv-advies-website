import { useEffect, useState } from 'react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { adminListDossiers, adminListOffertes, adminListAdviespunten, adminListCommercieleKansen, listAfspraken } from '../lib/klantOmgeving/api'
import { VandaagOverzicht } from '../components/klantOmgeving/VandaagOverzicht'
import { groepeerAdviespunten } from '../lib/dossier/adviesresultaat'
import { AFSPRAAK_TYPE_LABELS, datumNaarIso, telAfsprakenOpDag, vindEerstvolgendeAfspraak } from '../lib/klantOmgeving/planning'
import { formatDatumNl } from '../lib/klantOmgeving/offerte'

/**
 * Admin Dashboard (/admin) — sinds de Admin-ronde (2026-09-28) het
 * centrale start-/navigatiepunt van de adminomgeving, geen analytics-
 * dashboard: alleen "waar sta ik vandaag" (Vandaag voor SMV, al bestaand
 * en hierheen verhuisd vanaf de oude /admin) en duidelijke kaarten naar de
 * bestaande onderdelen. Geen nieuwe metrics, geen score, geen ranking —
 * elke telling hieronder is puur een aantal, nooit een beoordeling.
 *
 * De klanten-/dossierslijst zelf staat sinds deze ronde op
 * AdminDossiers.jsx (/admin/dossiers) — dat was voorheen de inhoud van
 * deze pagina.
 */
export default function Admin() {
  const [laden, setLaden] = useState(true)
  const [dossiers, setDossiers] = useState([])
  const [offertes, setOffertes] = useState([])
  const [watKanWachtenAantal, setWatKanWachtenAantal] = useState(null)
  const [kansenAantal, setKansenAantal] = useState(null)
  const [afsprakenVandaag, setAfsprakenVandaag] = useState(null)
  const [eerstvolgendeAfspraak, setEerstvolgendeAfspraak] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)

    const vandaag = datumNaarIso(new Date())
    // Twee weken vooruit is ruim genoeg voor een betrouwbare "eerstvolgende
    // afspraak" zonder de hele toekomstige planning te hoeven ophalen.
    const tot = datumNaarIso(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))

    Promise.all([adminListDossiers(), adminListOffertes()])
      .then(([d, o]) => {
        if (!actief) return
        setDossiers(d)
        setOffertes(o)
      })
      .finally(() => actief && setLaden(false))

    // Losse, onafhankelijke aanroepen: elke kaart faalt zelfstandig veilig
    // terug naar "geen telling bekend" (null → kaart toont geen getal, wel
    // nog steeds de CTA) in plaats van het hele dashboard te blokkeren.
    adminListAdviespunten()
      .then((rows) => {
        if (!actief) return
        const openRows = rows.filter((a) => a.dossiers?.status === 'open')
        const { groepen } = groepeerAdviespunten(openRows.map((a) => ({ ...a, adviesStatus: a.advies_status, adviespuntId: a.adviespunt_id })))
        setWatKanWachtenAantal(groepen.reduce((som, g) => som + g.aantal, 0))
      })
      .catch(() => {})

    adminListCommercieleKansen()
      .then((rows) => actief && setKansenAantal(rows.length))
      .catch(() => {})

    listAfspraken({ vanaf: vandaag, tot })
      .then((rows) => {
        if (!actief) return
        setAfsprakenVandaag(telAfsprakenOpDag(rows, vandaag))
        setEerstvolgendeAfspraak(vindEerstvolgendeAfspraak(rows, vandaag))
      })
      .catch(() => {})

    return () => {
      actief = false
    }
  }, [])

  return (
    <>
      <Seo title="SMV Admin" description="Overzicht van klanten, dossiers, planning en openstaande acties." noindex />
      <PageHero eyebrow="Beheer" title="SMV Admin" description="Overzicht van klanten, dossiers, planning en openstaande acties." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : (
            <div className="flex flex-col gap-8">
              <VandaagOverzicht dossiers={dossiers} offertes={offertes} />

              <div>
                <h2 className="mb-3 text-lg text-primary">Onderdelen</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DashboardKaart
                    titel="Planning"
                    omschrijving="Afspraken, bezoeken en gesprekken."
                    cta="Open planning"
                    to={ROUTES.adminPlanning}
                  >
                    {afsprakenVandaag !== null ? (
                      <p className="text-sm text-foreground-muted">
                        {afsprakenVandaag} {afsprakenVandaag === 1 ? 'afspraak' : 'afspraken'} vandaag
                      </p>
                    ) : null}
                    {eerstvolgendeAfspraak ? (
                      <p className="text-sm text-foreground-muted">
                        Eerstvolgende: {formatDatumNl(eerstvolgendeAfspraak.datum)} {eerstvolgendeAfspraak.starttijd.slice(0, 5)} —{' '}
                        {AFSPRAAK_TYPE_LABELS[eerstvolgendeAfspraak.type] ?? eerstvolgendeAfspraak.type}
                      </p>
                    ) : null}
                  </DashboardKaart>

                  <DashboardKaart
                    titel="Klanten & dossiers"
                    omschrijving="Beheer klanten, panden en adviesdossiers."
                    cta="Open klanten & dossiers"
                    to={ROUTES.adminDossiers}
                  />

                  <DashboardKaart titel="Wat kan wachten" omschrijving="Adviespunten per status, over alle open dossiers." cta="Bekijk openstaande punten" to={ROUTES.watKanWachten}>
                    {watKanWachtenAantal !== null ? (
                      <p className="text-sm text-foreground-muted">
                        {watKanWachtenAantal} {watKanWachtenAantal === 1 ? 'openstaand punt' : 'openstaande punten'}
                      </p>
                    ) : null}
                  </DashboardKaart>

                  <DashboardKaart titel="Archief" omschrijving="Gearchiveerde dossiers, veilig bewaard." cta="Open archief" to={ROUTES.archief} />

                  {/*
                    Deel 1 (bouwprompt): "als het tonen van deze kaart de
                    architectuur onnodig complex maakt, mag de eerste versie
                    alleen via Klanten & dossiers toegankelijk zijn" — dat
                    bleek hier niet nodig (adminListCommercieleKansen() is
                    net zo'n lichte telling als de andere kaarten), dus de
                    kaart staat gewoon op het Dashboard. Uitsluitend een
                    telling, nooit omzet/score/ranking (zie commercieleKans.js).
                  */}
                  <DashboardKaart titel="Commerciële kansen" omschrijving="Interne vervolgstappen per dossier." cta="Bekijk kansen" to={ROUTES.adminKansen}>
                    {kansenAantal !== null ? (
                      <p className="text-sm text-foreground-muted">
                        {kansenAantal} {kansenAantal === 1 ? 'dossier' : 'dossiers'}
                      </p>
                    ) : null}
                  </DashboardKaart>
                </div>
              </div>
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}

function DashboardKaart({ titel, omschrijving, cta, to, children }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg text-primary">{titel}</h3>
        <p className="mt-1 text-sm text-foreground-muted">{omschrijving}</p>
      </div>
      {children ? <div className="flex flex-col gap-0.5">{children}</div> : null}
      <div className="mt-auto pt-1">
        <Button to={to} variant="outline" size="sm">
          {cta}
        </Button>
      </div>
    </div>
  )
}
