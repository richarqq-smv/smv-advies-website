import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { ROUTES } from '../../lib/routes'
import { COMPANY } from '../../data/company'

export function ClosingCta() {
  return (
    <Section tone="primary">
      <Container>
        <Reveal className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl text-white sm:text-4xl">Klaar voor de eerste stap?</h2>
            <p className="mt-3 max-w-[50ch] text-white/70">
              Begin vrijblijvend met de gratis energie-indicatie of neem direct contact op.{' '}
              {COMPANY.responseTime}.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button to={ROUTES.energieIndicatie}>Start de energie-indicatie</Button>
            <Button to={ROUTES.contact} variant="outline" className="border-white/30 text-white hover:bg-white/10">
              Neem contact op
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
