import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { STEPS } from '../../data/steps'

export function HowItWorks() {
  return (
    <Section tone="white">
      <Container>
        <SectionHeading
          title="Vier stappen naar helderheid"
          description="Een vast, transparant traject. U weet vooraf wat u kunt verwachten."
          className="mb-12"
        />

        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.number} delay={index * 70} className="list-none">
              <span aria-hidden="true" className="font-heading text-4xl text-accent">
                {step.number}
              </span>
              <h3 className="mt-3 text-base font-semibold text-primary">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{step.description}</p>
              <p className="mt-3 text-xs font-medium tracking-wide text-foreground-muted/70 uppercase">
                {step.duration}
              </p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
