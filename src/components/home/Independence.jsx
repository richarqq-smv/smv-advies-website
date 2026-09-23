import { Compass } from '@phosphor-icons/react'
import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Reveal } from '../ui/Reveal'

/**
 * Deliberately its own, prominent section rather than folded into UspStrip —
 * independence is SMV's single strongest differentiator, so it gets more
 * room than one bullet among four. Claims stay factual ("geen verkoop van
 * installaties") rather than absolute ("100% onafhankelijk"), which can't
 * be substantiated and isn't needed to make the point.
 */
export function Independence() {
  return (
    <Section tone="muted">
      <Container className="max-w-3xl text-center">
        <Reveal>
          <Compass size={32} weight="light" className="mx-auto text-accent" />
          <h2 className="mt-5 text-3xl text-primary sm:text-4xl">
            Wij verkopen geen zonnepanelen. Geen warmtepompen. Geen isolatie.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-foreground-muted">
            Wij verkopen onafhankelijk advies. Omdat we niet verdienen aan de installatie die u
            uiteindelijk kiest, kunnen we uw pand beoordelen vanuit één belang: wat voor ú
            technisch en financieel verstandig is.
          </p>
          <ul className="mt-8 flex flex-col items-center gap-3 text-sm font-medium text-primary sm:flex-row sm:justify-center sm:gap-8">
            <li>Geen installatieverkoop</li>
            <li>Geen vaste leverancier</li>
            <li>U bepaalt zelf wie uitvoert</li>
          </ul>
        </Reveal>
      </Container>
    </Section>
  )
}
