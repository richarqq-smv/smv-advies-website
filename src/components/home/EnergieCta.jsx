import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { ROUTES } from '../../lib/routes'
import { trackEvent } from '../../lib/analytics'

const TOOL_STEPS = ['Uw pand', 'Staat van het pand', 'Energieverbruik', 'Uw rapport']

/**
 * Anti-slop-ronde (2026-10-21): links uitgelijnde split i.p.v. gecentreerd
 * blok met een rij icoontjes; de vier onderdelen van de tool staan als
 * echte, geordende lijst in leesbare tekst naast de uitleg.
 */
export function EnergieCta() {
  return (
    <Section tone="muted">
      <Container>
        <Reveal className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h2 className="text-3xl text-primary sm:text-4xl">Nog niet zeker waar u staat?</h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-foreground">
              Beantwoord in enkele minuten een paar vragen over uw pand en ontvang direct een eerste
              indicatie van de grootste besparingskansen.
            </p>
            <div className="mt-8">
              <Button
                to={ROUTES.energieIndicatie}
                onClick={() => trackEvent('cta_click', { cta: 'energie_indicatie', location: 'energie_cta' })}
              >
                Start de gratis energie-indicatie
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="text-base font-semibold text-primary">Zo werkt de indicatie</p>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-lg text-foreground marker:text-foreground-muted">
              {TOOL_STEPS.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ol>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
