import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, DownloadSimple } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import { DossierWerkruimte } from '../components/klantOmgeving/DossierWerkruimte'
import { DossierHealthCheck } from '../components/klantOmgeving/DossierHealthCheck'
import { EnergieSnapshot } from '../components/klantOmgeving/EnergieSnapshot'
import { EnergieUitnodiging } from '../components/klantOmgeving/EnergieUitnodiging'
import { CommercieleKansSectie } from '../components/klantOmgeving/CommercieleKansSectie'
import { OfferteEditor } from '../components/klantOmgeving/OfferteEditor'
import { OffertesHistorie } from '../components/klantOmgeving/OffertesHistorie'
import { getDossier, listAdviespunten, getOffertesVoorDossier, checkIsAdmin } from '../lib/klantOmgeving/api'
import { bouwDossierHealthCheck } from '../lib/klantOmgeving/dossierHealthCheck'
import { bepaalDossierOverzichtRoute } from '../lib/klantOmgeving/dossierNavigatie'
import { triggerDossierJsonDownload } from '../lib/klantOmgeving/dossierExport'
import { buildInsights } from '../lib/mjop/linking'
import { buildEnergieInsights } from '../lib/dossier/energieInsights'

/**
 * Detailpagina voor één Dossier — bereikbaar voor de eigen klant (RLS:
 * is_member_of_klant) en voor een admin (RLS: is_admin()). Geen eigen
 * autorisatielogica hier: als de rij niet zichtbaar is voor deze sessie
 * geeft Supabase eenvoudigweg niets terug (`notFound`-weergave hieronder),
 * precies zoals RLS is bedoeld te werken.
 *
 * Bewust niet opgenomen in scripts/prerender.mjs: het dossier_id bestaat
 * pas na aanmaken in de database, en de inhoud is per definitie
 * klant-specifiek — geen SEO-waarde, geen statisch te genereren pad (zelfde
 * afweging als een toekomstige /blog/:slug-achtige dynamische route zonder
 * vooraf bekende lijst). Werkt gewoon via client-side routing.
 */
export default function DossierDetail() {
  const { dossierId } = useParams()
  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [dossier, setDossier] = useState(null)
  const [adviespunten, setAdviespunten] = useState([])
  // Werkfase Fase 3: een offerte is nu ook zichtbaar voor de eigen klant
  // (zie App.jsx/offertes_select_klant), maar aanmaken/status wijzigen/
  // verwijderen blijft uitsluitend admin (RLS staat dat toch al alleen aan
  // is_admin() toe) — deze vlag bepaalt alleen of de UI die knoppen/het
  // formulier überhaupt toont, zodat een klant geen bedieningselementen
  // ziet die voor hem toch altijd zouden falen.
  const [isAdmin, setIsAdmin] = useState(false)
  // Verhoogd door OfferteEditor na een geslaagde opslag — laat
  // OffertesHistorie zichzelf herladen zonder dat beide componenten
  // elkaars interne state hoeven te kennen (zie OffertesHistorie.jsx).
  const [offerteRefresh, setOfferteRefresh] = useState(0)
  // Werkfase Fase 6 — Health Check: een eigen, lichte offertes-lezing naast
  // die van OffertesHistorie (die blijft zelfstandig, met zijn eigen
  // beheeracties) — puur om de OFFERTE-categorie feitelijk te kunnen
  // beoordelen. Zelfde RLS (offertes_select_klant/offertes_select_admin),
  // dus nooit meer zichtbaar dan wat deze sessie al mag zien.
  const [offertesVoorHealthCheck, setOffertesVoorHealthCheck] = useState([])

  useEffect(() => {
    let actief = true
    setLaden(true)
    setNietGevonden(false)
    Promise.all([getDossier(dossierId), listAdviespunten(dossierId)])
      .then(([d, a]) => {
        if (!actief) return
        setDossier(d)
        setAdviespunten(a)
      })
      .catch(() => {
        if (actief) setNietGevonden(true)
      })
      .finally(() => {
        if (actief) setLaden(false)
      })
    // Losse aanroep, niet in dezelfde Promise.all: mag nooit de dossierweergave
    // blokkeren of op "niet gevonden" laten uitkomen als deze faalt — bij een
    // fout blijft isAdmin simpelweg false (veiligste kant: dan toont de UI
    // minder, nooit meer, bedieningselementen dan waar deze sessie recht op heeft).
    checkIsAdmin()
      .then((admin) => actief && setIsAdmin(Boolean(admin)))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [dossierId])

  useEffect(() => {
    let actief = true
    getOffertesVoorDossier(dossierId)
      .then((rows) => actief && setOffertesVoorHealthCheck(rows))
      .catch(() => {}) // Health Check faalt bij een leesfout gewoon veilig terug naar "geen offertes bekend", blokkeert nooit de rest van de pagina.
    return () => {
      actief = false
    }
  }, [dossierId, offerteRefresh])

  // Zelfde regellogica als DossierWerkruimte.jsx gebruikt om kandidaten te
  // bepalen (buildInsights/buildEnergieInsights, beide pure functies) —
  // hier alleen geteld, niet opnieuw geïmplementeerd, om de Health Check
  // te kunnen zeggen hoeveel automatische signalen nog geen adviespunt zijn.
  const openSignalenAantal = useMemo(() => {
    if (!dossier) return null
    const mjopInsights = dossier.mjop_snapshot?.components ? buildInsights(dossier.mjop_snapshot) : []
    const gebruikteComponentIds = new Set(adviespunten.filter((a) => a.signaal_bevroren).map((a) => a.signaal_bevroren.componentId))
    const openMjop = mjopInsights.filter((i) => !gebruikteComponentIds.has(i.componentId)).length

    const energieInsights = buildEnergieInsights(dossier.energie_snapshot)
    const gebruikteEnergieIds = new Set(
      adviespunten.filter((a) => a.signaal_bevroren?.herkomst === 'energie').map((a) => a.signaal_bevroren.energieMaatregelId),
    )
    const openEnergie = energieInsights.filter((i) => !gebruikteEnergieIds.has(i.energieMaatregelId)).length

    return openMjop + openEnergie
  }, [dossier, adviespunten])

  const healthCheck = useMemo(() => {
    if (!dossier) return null
    return bouwDossierHealthCheck({
      klant: dossier.klanten,
      contactpersoon: dossier.contactpersonen,
      pand: dossier.panden,
      energieSnapshot: dossier.energie_snapshot,
      mjopSnapshot: dossier.mjop_snapshot,
      adviespunten,
      offertes: offertesVoorHealthCheck,
      openSignalenAantal,
      dossierId: dossier.dossier_id,
    })
  }, [dossier, adviespunten, offertesVoorHealthCheck, openSignalenAantal])

  return (
    <>
      <Seo title="Adviesdossier" description="Bekijk en beheer het adviesdossier van dit pand." noindex />
      <PageHero eyebrow="Adviesdossier" title={dossier?.panden?.omschrijving || dossier?.panden?.adres || 'Adviesdossier'} description={dossier?.klanten ? `${dossier.klanten.naam || dossier.klanten.bedrijfsnaam}` : undefined} />
      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          {/*
            UX-ronde: duidelijke terugknop naar het dossieroverzicht. Dat
            overzicht is voor een klant Account.jsx (/account, panden/
            dossiers) en voor een admin AdminDossiers.jsx (/admin/dossiers,
            "Klanten & dossiers") — vandaar op isAdmin, dezelfde vlag die
            hieronder ook al bepaalt welke bedieningselementen zichtbaar
            zijn. Geen browser-history
            (geen navigate(-1)): een rechtstreekse link naar een dossier
            (bijv. vanuit een e-mail) heeft geen geschiedenis om naar terug
            te gaan, en zou anders op een willekeurige, mogelijk verkeerde
            pagina kunnen uitkomen.
          */}
          <Button to={bepaalDossierOverzichtRoute(isAdmin)} variant="ghost" size="sm" className="-ml-3 mb-6">
            <ArrowLeft size={16} />
            Terug naar dossiers
          </Button>
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : nietGevonden || !dossier ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
              Dit dossier bestaat niet, of u heeft er geen toegang toe.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => triggerDossierJsonDownload({ dossier, adviespunten, offertes: offertesVoorHealthCheck })}
                >
                  <DownloadSimple size={15} /> Dossier exporteren (JSON)
                </Button>
                {isAdmin ? (
                  <Button as="link" to={ROUTES.klantgesprek(dossier.dossier_id)} variant="outline" size="sm">
                    Klaar voor klantgesprek
                  </Button>
                ) : null}
              </div>
              {healthCheck ? <DossierHealthCheck healthCheck={healthCheck} /> : null}
              <DossierWerkruimte
                dossier={dossier}
                adviespunten={adviespunten}
                mjopSnapshot={dossier.mjop_snapshot}
                energieSnapshot={dossier.energie_snapshot}
                onDossierChange={setDossier}
                magBeheren={isAdmin}
              />
              {isAdmin && !dossier.energie_snapshot ? (
                <EnergieUitnodiging dossierId={dossier.dossier_id} klant={dossier.klanten} />
              ) : null}
              <EnergieSnapshot snapshot={dossier.energie_snapshot} />
              {/* Anchor voor de Health Check-offerteactie hieronder ("Offerte bekijken") — geen routewijziging nodig, dit staat al op dezelfde pagina. */}
              <div id="offertes-sectie" className="flex flex-col gap-6">
                <OffertesHistorie
                  dossierId={dossier.dossier_id}
                  refreshSignal={offerteRefresh}
                  magBeheren={isAdmin}
                  klant={dossier.klanten}
                  contactpersoon={dossier.contactpersonen}
                />
                {/*
                  Werkfase Fase 3: alleen admin ziet/gebruikt het opstelformulier
                  — een klant mag offertes uitsluitend bekijken (RLS staat een
                  klant sowieso geen INSERT toe, offertes_insert_admin vereist
                  is_admin(); dit verbergt alleen het formulier dat voor een
                  klant toch altijd zou falen).
                */}
                {isAdmin ? (
                  <OfferteEditor
                    klant={dossier.klanten}
                    contactpersoon={dossier.contactpersonen}
                    pand={dossier.panden}
                    dossier={dossier}
                    onOpgeslagen={() => setOfferteRefresh((n) => n + 1)}
                  />
                ) : null}
              </div>
              {/*
                Admin-ronde (2026-09-28): uitsluitend interne
                admininformatie — nooit voor een klant. Zowel de UI-gate
                hier (isAdmin) als de databasegrens (admin-only RLS,
                0012_dossier_commerciele_kansen.sql) sluiten een klant
                buiten, zie CommercieleKansSectie.jsx.
              */}
              {isAdmin ? <CommercieleKansSectie dossierId={dossier.dossier_id} /> : null}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
