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

/**
 * Anti-slop-ronde (2026-10-21): split op de gedeelde linkerrand (kop links,
 * herkenbare situaties rechts) i.p.v. een smalle gecentreerde kolom die op
 * een eigen, vierde linkerrand van de pagina begon.
 */
export function ProblemRecognition() {
  return (
    <Section tone="white">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-5">
          <h2 className="text-3xl text-primary sm:text-4xl">
            U weet dat u iets moet doen. Maar waar begint u?
          </h2>
        </Reveal>

        <div className="lg:col-span-7">
          <ul className="flex flex-col gap-4">
            {HERKENBARE_SITUATIES.map((situatie, index) => (
              <Reveal as="li" key={situatie} delay={index * 60} className="flex items-start gap-3">
                <CheckCircle size={20} weight="light" aria-hidden="true" className="mt-1 shrink-0 text-accent" />
                <span className="text-lg leading-relaxed text-foreground">{situatie}</span>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={HERKENBARE_SITUATIES.length * 60}>
            <p className="mt-10 text-lg font-semibold text-primary">Daar begint ons advies.</p>
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
