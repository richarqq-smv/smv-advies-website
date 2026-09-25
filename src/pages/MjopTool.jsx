import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { MjopTool as MjopToolWidget } from '../components/mjop/MjopTool'

/**
 * Intern adviesinstrument (MJOP & verduurzamingsplanning), bewust niet
 * publiek gepromoot: geen link in header/mobiele nav/footer/sitemap (zie
 * data/navigation.js en public/sitemap.xml, beide niet aangepast voor deze
 * route), en `noindex` hieronder zodat de pagina ook niet wordt geïndexeerd.
 * Alleen bereikbaar voor een ingelogde admin (RequireAuth + RequireAdmin in
 * App.jsx): de MJOP-analyse is onderdeel van het adviesproces van SMV, geen
 * klantproduct. Een klant of anonieme bezoeker wordt doorgestuurd naar
 * /inloggen respectievelijk /account.
 */
export default function MjopTool() {
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
          <MjopToolWidget />
        </Container>
      </Section>
    </>
  )
}
