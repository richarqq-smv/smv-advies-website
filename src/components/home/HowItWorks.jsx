import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'
import { STEPS } from '../../data/steps'

/**
 * Anti-slop-ronde (2026-10-21): de grote gouden "01–04" en het kleine
 * hoofdletterlabel met de duur zijn weg (beide gemarkeerd door de
 * taste-skill-inspector als decoratieve nummering/micro-label). De volgorde
 * zit nu in een echte <ol> en in de positie; de compositie is een split
 * (kop links, stappen als lijst in grotere tekst rechts) zodat deze sectie
 * niet nóg een vier-koloms rij naast UspStrip is.
 */
export function HowItWorks() {
  return (
    <Section tone="white">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <h2 className="text-3xl text-primary sm:text-4xl">Vier stappen naar helderheid</h2>
          <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-foreground">
            Een vast, transparant traject. U weet vooraf wat u kunt verwachten.
          </p>
        </div>

        <ol className="flex flex-col gap-10 lg:col-span-7">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.number} delay={index * 70}>
              <h3 className="text-2xl text-primary">{step.title}</h3>
              <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-foreground">{step.description}</p>
              <p className="mt-2 text-sm text-foreground-muted">Duur: {step.duration}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
