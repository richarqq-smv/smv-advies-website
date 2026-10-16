import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { ROUTES } from '../../lib/routes'
import { trackEvent } from '../../lib/analytics'

export function DecisionCta() {
  return (
    <Section tone="white">
      <Container>
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl text-primary sm:text-3xl">Twijfelt u welk pakket past?</h2>
          <p className="mt-3 text-base leading-relaxed text-foreground-muted">
            De gratis energie-indicatie geeft in een paar minuten een beeld van het potentieel van
            uw pand. Aan de hand daarvan adviseren we welk pakket het beste past.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              to={ROUTES.energieIndicatie}
              onClick={() => trackEvent('cta_click', { cta: 'energie_indicatie', location: 'decision_cta' })}
            >
              Start de gratis energie-indicatie
            </Button>
            <Button to={ROUTES.contact} variant="ghost" onClick={() => trackEvent('cta_click', { cta: 'contact', location: 'decision_cta' })}>
              Stel uw vraag
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
