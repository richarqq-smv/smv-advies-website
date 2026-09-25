import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { DossierWerkruimte } from '../components/klantOmgeving/DossierWerkruimte'
import { OfferteEditor } from '../components/klantOmgeving/OfferteEditor'
import { OffertesHistorie } from '../components/klantOmgeving/OffertesHistorie'
import { getDossier, listAdviespunten } from '../lib/klantOmgeving/api'

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
  // Verhoogd door OfferteEditor na een geslaagde opslag — laat
  // OffertesHistorie zichzelf herladen zonder dat beide componenten
  // elkaars interne state hoeven te kennen (zie OffertesHistorie.jsx).
  const [offerteRefresh, setOfferteRefresh] = useState(0)

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
    return () => {
      actief = false
    }
  }, [dossierId])

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
              <DossierWerkruimte dossier={dossier} adviespunten={adviespunten} mjopSnapshot={dossier.mjop_snapshot} onDossierChange={setDossier} />
              <OffertesHistorie dossierId={dossier.dossier_id} refreshSignal={offerteRefresh} />
              <OfferteEditor
                klant={dossier.klanten}
                contactpersoon={dossier.contactpersonen}
                pand={dossier.panden}
                dossier={dossier}
                onOpgeslagen={() => setOfferteRefresh((n) => n + 1)}
              />
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}
