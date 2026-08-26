import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { USPS } from '../../data/usps'

export function UspStrip() {
  return (
    <Section tone="muted">
      <Container>
        <SectionHeading title="Waarom SMV Advies" className="mb-10" />

        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {USPS.map((usp, index) => (
            <Reveal as="li" key={usp.title} delay={index * 70} className="border-t border-border pt-6">
              <usp.icon size={26} weight="light" className="text-accent" />
              <h3 className="mt-4 text-base font-semibold text-primary">{usp.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{usp.description}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
