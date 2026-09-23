import { CheckCircle } from '@phosphor-icons/react'
import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

const HERKENBARE_SITUATIES = [
  'Uw energierekening stijgt, en u weet niet precies waardoor.',
  'U overweegt zonnepanelen, maar weet niet of dit nu de beste investering is.',
  'U wilt isoleren, maar weet niet waar de grootste winst zit.',
  'U krijgt verschillende offertes en weet niet goed wat u moet vergelijken.',
  'U wilt verduurzamen, maar heeft geen tijd om alles zelf uit te zoeken.',
  'U wilt weten welke maatregelen zich daadwerkelijk terugverdienen.',
]

export function ProblemRecognition() {
  return (
    <Section tone="white">
      <Container className="max-w-3xl">
        <Reveal>
          <h2 className="text-3xl text-primary sm:text-4xl">
            U weet dat u iets moet doen. Maar waar begint u?
          </h2>
        </Reveal>

        <ul className="mt-10 flex flex-col gap-4">
          {HERKENBARE_SITUATIES.map((situatie, index) => (
            <Reveal as="li" key={situatie} delay={index * 60} className="flex items-start gap-3">
              <CheckCircle size={20} weight="light" className="mt-0.5 shrink-0 text-accent" />
              <span className="text-base leading-relaxed text-foreground-muted">{situatie}</span>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={HERKENBARE_SITUATIES.length * 60}>
          <p className="mt-10 text-lg font-semibold text-primary">Daar begint ons advies.</p>
        </Reveal>
      </Container>
    </Section>
  )
}
