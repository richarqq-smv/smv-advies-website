import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

const FACTS = [
  { label: 'Oud-Beijerland', sublabel: 'Thuisbasis' },
  { label: 'Hoeksche Waard', sublabel: 'Werkgebied' },
  { label: 'Geen commissie', sublabel: 'Onafhankelijk advies' },
]

export function RegionalBand() {
  return (
    <Section tone="muted">
      <Container className="max-w-3xl text-center">
        <h2 className="sr-only">Regionale expertise</h2>
        <Reveal>
          <blockquote className="font-heading text-2xl leading-snug text-primary sm:text-3xl">
            "Steen en Mortel Verbetering: verduurzaming draait bij ons niet om trends, maar om het
            pand zelf."
          </blockquote>
          <p className="mt-6 text-base leading-relaxed text-foreground-muted">
            SMV Advies is gevestigd in Oud-Beijerland en werkt uitsluitend voor mkb-ondernemers in
            de Hoeksche Waard, van winkelpanden in de dorpskernen tot bedrijfshallen op de lokale
            bedrijventerreinen. Die lokale kennis scheelt in de praktijk veel tijd en giswerk.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {FACTS.map((fact) => (
            <div key={fact.label}>
              <p className="text-sm font-semibold text-primary">{fact.label}</p>
              <p className="text-xs text-foreground-muted">{fact.sublabel}</p>
            </div>
          ))}
        </Reveal>
      </Container>
    </Section>
  )
}
