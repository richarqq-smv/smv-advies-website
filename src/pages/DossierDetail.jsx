import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { DossierWerkruimte } from '../components/klantOmgeving/DossierWerkruimte'
import { OfferteEditor } from '../components/klantOmgeving/OfferteEditor'
import { OffertesHistorie } from '../components/klantOmgeving/OffertesHistorie'
import { checkIsAdmin, getDossier, listAdviespunten } from '../lib/klantOmgeving/api'
import { bepaalDossierRechten } from '../lib/klantOmgeving/rechten'

/**
 * Detailpagina voor één Dossier — bereikbaar voor de eigen klant (RLS:
 * is_member_of_klant) en voor een admin (RLS: is_admin()). Als de rij niet
 * zichtbaar is voor deze sessie geeft Supabase eenvoudigweg niets terug
 * (`notFound`-weergave hieronder), precies zoals RLS is bedoeld te werken.
 *
 * Advies en offertes zijn werk van de adviseur: de klant ziet alleen zijn
 * dossier (en de adviespunten zodra het advies is afgerond), zonder
 * bewerkknoppen of offerte-editor. bepaalDossierRechten() bepaalt wat
 * zichtbaar is; de database (0006_advies_en_dossier_alleen_adviseur.sql)
 * dwingt hetzelfde af, ook als iemand de UI omzeilt.
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
  const [isAdmin, setIsAdmin] = useState(false)
  // Verhoogd door OfferteEditor na een geslaagde opslag — laat
  // OffertesHistorie zichzelf herladen zonder dat beide componenten
  // elkaars interne state hoeven te kennen (zie OffertesHistorie.jsx).
  const [offerteRefresh, setOfferteRefresh] = useState(0)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setNietGevonden(false)
    // Een mislukte admin-check betekent "geen admin" — nooit extra rechten
    // bij twijfel.
    Promise.all([getDossier(dossierId), listAdviespunten(dossierId), checkIsAdmin().catch(() => false)])
      .then(([d, a, admin]) => {
        if (!actief) return
        setDossier(d)
        setAdviespunten(a)
        setIsAdmin(admin === true)
      })
      .catch(() => {
        if (actief) setNietGevonden(true)
      })
      .finally(() => {
        if (actief) setLaden(false)
      })
    return () => {
      actief = false
    }
  }, [dossierId])

  const rechten = bepaalDossierRechten({ isAdmin, status: dossier?.status })

  return (
    <>
      <Seo title="Adviesdossier" description="Bekijk en beheer het adviesdossier van dit pand." noindex />
      <PageHero eyebrow="Adviesdossier" title={dossier?.panden?.omschrijving || dossier?.panden?.adres || 'Adviesdossier'} description={dossier?.klanten ? `${dossier.klanten.naam || dossier.klanten.bedrijfsnaam}` : undefined} />
      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : nietGevonden || !dossier ? (
            <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
              Dit dossier bestaat niet, of u heeft er geen toegang toe.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <DossierWerkruimte
                dossier={dossier}
                adviespunten={adviespunten}
                mjopSnapshot={dossier.mjop_snapshot}
                onDossierChange={setDossier}
                magBewerken={rechten.magAdviesBewerken}
              />
              {rechten.magOffertesBeheren ? (
                <>
                  <OffertesHistorie dossierId={dossier.dossier_id} refreshSignal={offerteRefresh} />
                  <OfferteEditor
                    klant={dossier.klanten}
                    contactpersoon={dossier.contactpersonen}
                    pand={dossier.panden}
                    dossier={dossier}
                    onOpgeslagen={() => setOfferteRefresh((n) => n + 1)}
                  />
                </>
              ) : null}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
