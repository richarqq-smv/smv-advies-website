import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, DownloadSimple, FileText, Receipt, Archive } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { Accordion } from '../components/ui/Accordion'
import { ROUTES } from '../lib/routes'
import { DossierWerkruimte } from '../components/klantOmgeving/DossierWerkruimte'
import { DossierHealthCheck } from '../components/klantOmgeving/DossierHealthCheck'
import { EnergieSnapshot } from '../components/klantOmgeving/EnergieSnapshot'
import { EnergieUitnodiging } from '../components/klantOmgeving/EnergieUitnodiging'
import { CommercieleKansSectie } from '../components/klantOmgeving/CommercieleKansSectie'
import { OfferteEditor } from '../components/klantOmgeving/OfferteEditor'
import { OffertesHistorie } from '../components/klantOmgeving/OffertesHistorie'
import { AdviesrapportGenerator } from '../components/klantOmgeving/AdviesrapportGenerator'
import { OpnamesSectie } from '../components/klantOmgeving/OpnamesSectie'
import { PakketControle } from '../components/klantOmgeving/PakketControle'
import { BouwkundigeAnalyse } from '../components/klantOmgeving/BouwkundigeAnalyse'
import { DossierTaken } from '../components/klantOmgeving/DossierTaken'
import { DossierSubsidies } from '../components/klantOmgeving/DossierSubsidies'
import { TelefonischeAfspraakSectie } from '../components/klantOmgeving/TelefonischeAfspraakSectie'
import {
  getDossier,
  listAdviespunten,
  getOffertesVoorDossier,
  getFacturenVoorDossier,
  getDocumentenVoorDossier,
  getDocumentDownloadUrl,
  checkIsAdmin,
  archiveerDossier,
} from '../lib/klantOmgeving/api'
import { magDossierArchiveren } from '../lib/klantOmgeving/dossierArchief'
import { bouwDossierHealthCheck } from '../lib/klantOmgeving/dossierHealthCheck'
import { bepaalDossierOverzichtRoute } from '../lib/klantOmgeving/dossierNavigatie'
import { triggerDossierJsonDownload } from '../lib/klantOmgeving/dossierExport'
import { euro, formatDatumNl } from '../lib/klantOmgeving/offerte'
import { FACTUUR_STATUS_LABELS } from '../lib/klantOmgeving/factuur'
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
  const navigate = useNavigate()
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
  // Klantreis-ronde: documenten/facturen die al aan dit dossier gekoppeld
  // zijn zichtbaar maken op de dossierpagina zelf — hergebruikt de
  // bestaande, al RLS-beveiligde queries (zelfde functies als /account),
  // hier alleen gefilterd op dossier_id. Uitsluitend lezen: uploaden/
  // verwijderen blijft gecentraliseerd op /account, geen tweede upload-UI.
  const [documentenVoorDossier, setDocumentenVoorDossier] = useState([])
  const [facturenVoorDossier, setFacturenVoorDossier] = useState([])
  const [downloadFoutId, setDownloadFoutId] = useState(null)
  // Dossier-archiveren (zelfde inline-bevestigingspatroon als AdminDossiers.jsx
  // zijn prullenbakknop — geen los modal-systeem, hergebruikt de bestaande
  // gearchiveerd_op-architectuur (archiveerDossier() in api.js).
  const [archiveerBevestiging, setArchiveerBevestiging] = useState(false)
  const [archiveerBezig, setArchiveerBezig] = useState(false)
  const [archiveerFout, setArchiveerFout] = useState(false)

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

  useEffect(() => {
    let actief = true
    getDocumentenVoorDossier(dossierId)
      .then((rows) => actief && setDocumentenVoorDossier(rows))
      .catch(() => {}) // Zelfde veilige stiltefout als hierboven — blokkeert nooit de rest van de pagina.
    getFacturenVoorDossier(dossierId)
      .then((rows) => actief && setFacturenVoorDossier(rows))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [dossierId, offerteRefresh])

  async function downloaden(document) {
    setDownloadFoutId(null)
    try {
      const url = await getDocumentDownloadUrl(document.storage_path)
      window.open(url, '_blank', 'noopener')
    } catch {
      setDownloadFoutId(document.document_id)
    }
  }

  /**
   * Zet uitsluitend `gearchiveerd_op` (zie archiveerDossier() in api.js) —
   * geen delete, geen cascade. Alle gekoppelde data (adviespunten,
   * offertes, facturen, documenten, planning, dossier_taken, opnames)
   * blijft gewoon aan dit dossier_id hangen; die tabellen worden hier niet
   * aangeraakt. Na succes naar het bestaande Archief, waar het dossier nu
   * zichtbaar is met een herstelknop.
   */
  async function naarArchief() {
    setArchiveerFout(false)
    setArchiveerBezig(true)
    try {
      await archiveerDossier(dossier.dossier_id)
      navigate(ROUTES.archief)
    } catch {
      setArchiveerFout(true)
      setArchiveerBezig(false)
    }
  }

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
                {isAdmin && magDossierArchiveren(dossier) ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setArchiveerBevestiging(true)}>
                    <Archive size={15} /> Naar archief
                  </Button>
                ) : null}
              </div>

              {archiveerBevestiging ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
                  <span className="text-primary">
                    Dossier naar archief verplaatsen? Het dossier wordt niet verwijderd — het verdwijnt uit het actieve overzicht, blijft volledig
                    bewaard (inclusief advies, offertes, facturen, documenten en overige gekoppelde gegevens) en kan later worden hersteld.
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={naarArchief} disabled={archiveerBezig}>
                      {archiveerBezig ? 'Bezig...' : 'Ja, naar archief'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setArchiveerBevestiging(false)} disabled={archiveerBezig}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              ) : null}
              {archiveerFout ? (
                <p role="alert" className="text-sm font-medium text-error">
                  Archiveren is niet gelukt. Probeer het opnieuw.
                </p>
              ) : null}
              {healthCheck ? (
                <Accordion title="Voortgang" defaultOpen>
                  <DossierHealthCheck healthCheck={healthCheck} />
                </Accordion>
              ) : null}
              <PakketControle dossier={dossier} onDossierChange={setDossier} magBeheren={isAdmin} />
              <Accordion title="Adviesdossier · Advies" defaultOpen>
                <DossierWerkruimte
                  dossier={dossier}
                  adviespunten={adviespunten}
                  mjopSnapshot={dossier.mjop_snapshot}
                  energieSnapshot={dossier.energie_snapshot}
                  onDossierChange={setDossier}
                  magBeheren={isAdmin}
                />
              </Accordion>
              {isAdmin && dossier.pakket_id !== 'basis' ? (
                <Accordion title="Bouwkundige analyse · Rc/U-waarden">
                  <BouwkundigeAnalyse dossier={dossier} onDossierChange={setDossier} magBeheren={isAdmin} />
                </Accordion>
              ) : null}
              {isAdmin ? <OpnamesSectie dossierId={dossier.dossier_id} /> : null}
              {isAdmin ? <AdviesrapportGenerator dossier={dossier} adviespunten={adviespunten} /> : null}
              {isAdmin && dossier.pakket_id === 'gold' ? (
                <Accordion title="Subsidies">
                  <DossierSubsidies
                    dossierId={dossier.dossier_id}
                    magBeheren={isAdmin}
                    adviespunten={adviespunten}
                    documenten={documentenVoorDossier}
                  />
                </Accordion>
              ) : null}
              {isAdmin && dossier.pakket_id === 'gold' ? (
                <Accordion title="Subsidiebegeleiding & oplevering">
                  <DossierTaken
                    dossierId={dossier.dossier_id}
                    pakketId={dossier.pakket_id}
                    magBeheren={isAdmin}
                    adviespunten={adviespunten}
                    documenten={documentenVoorDossier}
                  />
                </Accordion>
              ) : null}
              <Accordion title="Energie-indicatie">
                {isAdmin && !dossier.energie_snapshot ? (
                  <div className="mb-6">
                    <EnergieUitnodiging dossierId={dossier.dossier_id} klant={dossier.klanten} />
                  </div>
                ) : null}
                <EnergieSnapshot snapshot={dossier.energie_snapshot} />
              </Accordion>
              {/*
                Telefonische-afspraakplanner (2026-10-05) — zichtbaar voor
                klant én admin (zelfde reden als de rest van deze pagina:
                RLS/RPC's zijn de echte grens, niet isAdmin hier). Geeft
                zichzelf niets terug voor een niet-zakelijk pand
                (isZakelijkPand in het component), maar dat is uitsluitend
                UI-gemak — zie boek_telefonische_afspraak() voor de
                daadwerkelijke, server-side afgedwongen zakelijke gate.
              */}
              <TelefonischeAfspraakSectie dossierId={dossier.dossier_id} gebruikstype={dossier.panden?.gebruikstype} />
              <DocumentenBijDossier documenten={documentenVoorDossier} downloaden={downloaden} downloadFoutId={downloadFoutId} />
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
              <FacturenBijDossier facturen={facturenVoorDossier} isAdmin={isAdmin} />
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

/**
 * Documenten die aan dit dossier gekoppeld zijn — uploaden/verwijderen
 * blijft uitsluitend op /account (Mijn documenten), dit is een read-only
 * spiegel van dezelfde rijen (getDocumentenVoorDossier hergebruikt exact
 * dezelfde `documenten`-tabel/RLS/storage-flow, alleen gefilterd op
 * dossier_id i.p.v. klant_id). Zichtbaar voor admin én de eigen klant.
 */
function DocumentenBijDossier({ documenten, downloaden, downloadFoutId }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Documenten</p>
      <h3 className="mb-4 text-xl text-primary">Documenten bij dit dossier</h3>
      {documenten.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Er zijn nog geen documenten aan dit dossier gekoppeld.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documenten.map((d) => (
            <li key={d.document_id} className="rounded-lg border border-border bg-white px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="shrink-0 text-foreground-muted" />
                  <div className="min-w-0">
                    <p className="font-medium break-words text-primary">{d.bestandsnaam}</p>
                    <p className="text-xs text-foreground-muted">
                      {formatDatumNl(d.created_at?.slice(0, 10))}
                      {d.omschrijving ? ` · ${d.omschrijving}` : ''}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => downloaden(d)}>
                  <DownloadSimple size={15} /> Downloaden
                </Button>
              </div>
              {downloadFoutId === d.document_id ? (
                <p role="alert" className="mt-1.5 text-xs font-medium text-error">
                  Downloaden is niet gelukt. Probeer het opnieuw.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Facturen die al aan dit dossier gekoppeld zijn — hergebruikt
 * getFacturenVoorDossier (RLS: facturen_select_klant/facturen_select_admin),
 * zelfde functie die OffertesHistorie.jsx al gebruikt om "Factuur maken" te
 * verbergen. Doorklikroute verschilt per rol: de eigen klant gebruikt
 * /account/facturen/:id, admin /admin/facturen/:id — dezelfde twee routes
 * die Account.jsx/AdminFacturen.jsx al gebruiken, geen nieuwe.
 */
function FacturenBijDossier({ facturen, isAdmin }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Facturen</p>
      <h3 className="mb-4 text-xl text-primary">Facturen bij dit dossier</h3>
      {facturen.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Nog geen facturen voor dit dossier.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {facturen.map((f) => (
            <li key={f.factuur_id}>
              <Link
                to={isAdmin ? ROUTES.adminFactuurDetail(f.factuur_id) : ROUTES.mijnFactuur(f.factuur_id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm hover:border-accent hover:bg-muted"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium text-primary">
                  <Receipt size={16} className="shrink-0 text-foreground-muted" />
                  <span className="truncate">{f.factuurnummer}</span>
                </span>
                <span className="text-xs text-foreground-muted">{FACTUUR_STATUS_LABELS[f.status] ?? f.status}</span>
                <span className="text-xs text-foreground-muted">Vervalt {formatDatumNl(f.vervaldatum)}</span>
                <span className="text-primary">{euro(f.totaal_incl_btw)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
