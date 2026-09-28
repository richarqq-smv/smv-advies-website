import { useSearchParams } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { MjopTool as MjopToolWidget } from '../components/mjop/MjopTool'
import { ROUTES } from '../lib/routes'
import { leesDossierContext } from '../lib/klantOmgeving/dossierNavigatie'

/**
 * Intern adviesinstrument (MJOP & verduurzamingsplanning), bewust niet
 * publiek gepromoot: geen link in header/mobiele nav/footer/sitemap (zie
 * data/navigation.js en public/sitemap.xml, beide niet aangepast voor deze
 * route), en `noindex` hieronder zodat de pagina ook niet wordt geïndexeerd
 * als iemand de URL toch vindt. De route bestaat wel technisch en werkt
 * direct via de URL, inclusief refresh en prerendering — alleen niet als
 * onderdeel van de publieke contentstructuur.
 */
export default function MjopTool() {
  const [searchParams] = useSearchParams()
  const dossierId = leesDossierContext(searchParams)

  return (
    <>
      <Seo
        title="MJOP & verduurzamingsplanning"
        description="Intern adviesinstrument van SMV Advies: onderhoud, vervanging en verduurzaming van een bedrijfspand in één overzicht."
        noindex
      />

      <PageHero
        eyebrow="Intern adviesinstrument"
        title="MJOP & verduurzamingsplanning"
        description="Breng onderhoud, vervanging en verduurzaming van uw bedrijfspand samen in één overzicht. Een onderhoudsmoment kan ook een logisch moment zijn om verduurzaming mee te nemen. Deze tool helpt om die momenten overzichtelijk in beeld te brengen."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          {/* Alleen zichtbaar als deze pagina vanuit een Adviesdossier is geopend (Health Check-actie "Pand aanvullen"/"MJOP koppelen") — zie dossierNavigatie.js. */}
          {dossierId ? (
            <Button to={ROUTES.dossier(dossierId)} variant="ghost" size="sm" className="-ml-3 mb-6">
              <ArrowLeft size={16} />
              Terug naar dossier
            </Button>
          ) : null}
          <MjopToolWidget />
        </Container>
      </Section>
    </>
  )
}
