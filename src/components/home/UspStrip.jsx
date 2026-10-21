import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { Reveal } from '../ui/Reveal'
import { USPS } from '../../data/usps'

/**
 * Anti-slop-ronde (2026-10-21): geen rij van vier identieke kaartjes met een
 * icoon erboven en een haarlijn erboven meer (taste-skill: icon-cards +
 * hairline). De vier punten staan nu als een 2×2-lijst in grotere, serif
 * tussenkoppen met de uitleg in volle inktkleur; ruimte doet het werk dat
 * de lijntjes deden. (`usp.icon` blijft in data/usps.js staan voor wie het
 * elders nodig heeft, maar wordt hier bewust niet meer getoond.)
 */
export function UspStrip() {
  return (
    <Section tone="muted">
      <Container>
        <SectionHeading title="Waarom SMV Advies" className="mb-12" />

        <ul className="grid gap-x-16 gap-y-12 md:grid-cols-2">
          {USPS.map((usp, index) => (
            <Reveal as="li" key={usp.title} delay={index * 70}>
              <h3 className="text-2xl text-primary">{usp.title}</h3>
              <p className="mt-3 max-w-[48ch] text-base leading-relaxed text-foreground">{usp.description}</p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
