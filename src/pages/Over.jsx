import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { ClosingCta } from '../components/home/ClosingCta'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

export default function Over() {
  return (
    <>
      <Seo
        title="Over ons"
        description="SMV Advies helpt mkb-ondernemers in de Hoeksche Waard om hun bedrijfspand stap voor stap te verduurzamen."
        structuredData={[getBreadcrumbSchema([{ name: 'Over ons', path: ROUTES.over }])]}
      />

      <PageHero
        eyebrow="Over SMV Advies"
        title="Steen en Mortel Verbetering — letterlijk én figuurlijk"
        description="SMV Advies helpt mkb-ondernemers in de Hoeksche Waard om hun bedrijfspand stap voor stap te verduurzamen. Onafhankelijk, dichtbij en met beide benen op de grond."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <h2 className="text-2xl text-primary sm:text-3xl">Ons verhaal</h2>
          <p className="mt-2 text-sm font-medium text-accent">Van steen en mortel naar toekomstbestendig</p>

          <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground-muted">
            <p>
              SMV Advies staat voor Steen en Mortel Verbetering. Die naam is bewust gekozen:
              verduurzaming draait bij ons niet om trends of technologische hypes, maar om het
              pand zelf. Waar zit het warmteverlies, welke maatregel levert het meeste op, en in
              welke volgorde pakt u dat het slimst aan?
            </p>
            <p>
              SMV Advies is gevestigd in Oud-Beijerland en werkt uitsluitend voor mkb-ondernemers
              in de Hoeksche Waard. Die keuze is bewust: we kennen de bedrijfspanden in deze
              regio, van de oudere winkelpanden in de dorpskernen tot de nieuwbouwbedrijfshallen
              op de lokale bedrijventerreinen. Die lokale kennis scheelt in de praktijk veel tijd
              en giswerk.
            </p>
            <p>
              SMV Advies verkoopt geen installaties, panelen of isolatiemateriaal en werkt niet op
              commissiebasis. Het advies dat u krijgt, is dus nooit gekleurd door een belang bij
              een bepaalde installateur of leverancier. Ons enige belang is dat uw pand minder
              energie kost, comfortabeler aanvoelt en klaar is voor de toekomst.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container className="max-w-3xl">
          <h2 className="text-2xl text-primary sm:text-3xl">Waarom SMV Advies bestaat</h2>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground-muted">
            <p>
              Veel mkb-ondernemers stellen verduurzaming uit. Niet omdat ze het niet belangrijk
              vinden, maar omdat het onoverzichtelijk is: welke maatregel eerst, welke subsidie is
              van toepassing, en welke installateur is te vertrouwen? SMV Advies is opgericht om
              die drempel weg te nemen.
            </p>
            <p>
              Goed advies begint bij de feiten, niet bij een verkooppraatje. Daarom beginnen we
              altijd met een nuchtere inventarisatie van uw pand, gevolgd door een helder
              stappenplan dat aansluit op uw budget en planning. Geen dikke rapporten vol jargon,
              maar een concreet overzicht waarmee u direct aan de slag kunt.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="max-w-3xl">
          <h2 className="text-2xl text-primary sm:text-3xl">Voor ondernemers met een eigen bedrijfspand</h2>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-foreground-muted">
            <p>
              SMV Advies richt zich op mkb-bedrijven met een eigen bedrijfspand in de Hoeksche
              Waard: kantoren, winkels, showrooms, werkplaatsen en bedrijfshallen. Of u nu net wilt
              weten waar u staat met een QuickScan, of volledige begeleiding zoekt van analyse tot
              en met de oplevering van de laatste maatregel: er is een pakket dat aansluit op uw
              situatie.
            </p>
            <p>SMV Advies is actief in de gehele Hoeksche Waard, met Oud-Beijerland als thuisbasis.</p>
            <p className="font-medium text-primary">
              We beginnen waar u staat. Elke stap, hoe klein ook, telt. Want Elke Stap Maakt
              Verschil.
            </p>
          </div>
        </Container>
      </Section>

      <ClosingCta />
    </>
  )
}
