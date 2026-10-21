import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

/**
 * Deliberately its own, prominent section rather than folded into UspStrip —
 * independence is SMV's single strongest differentiator, so it gets more
 * room than one bullet among four. Claims stay factual ("geen verkoop van
 * installaties") rather than absolute ("100% onafhankelijk"), which can't
 * be substantiated and isn't needed to make the point.
 *
 * Anti-slop-ronde (2026-10-21): links uitgelijnd i.p.v. gecentreerd met een
 * decoratief kompas-icoon erboven. De kop loopt over de volle breedte (zo
 * blijft hij op desktop twee regels), daaronder een split: uitleg links, de
 * drie feiten als lijst in volle inktkleur rechts.
 */
export function Independence() {
  return (
    <Section tone="white">
      <Container>
        <Reveal>
          <h2 className="text-3xl text-primary sm:text-4xl lg:text-5xl">
            Wij verkopen geen zonnepanelen. Geen warmtepompen. Geen isolatie.
          </h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-12">
            <p className="max-w-[52ch] text-lg leading-relaxed text-foreground lg:col-span-7">
              Wij verkopen onafhankelijk advies. Omdat we niet verdienen aan de installatie die u
              uiteindelijk kiest, kunnen we uw pand beoordelen vanuit één belang: wat voor ú
              technisch en financieel verstandig is.
            </p>
            <ul className="flex flex-col gap-2 text-lg font-medium text-primary lg:col-span-5">
              <li>Geen installatieverkoop</li>
              <li>Geen vaste leverancier</li>
              <li>U bepaalt zelf wie uitvoert</li>
            </ul>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
