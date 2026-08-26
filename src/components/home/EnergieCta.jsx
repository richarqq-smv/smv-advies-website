import { ClipboardText, House, Lightning, Ruler } from '@phosphor-icons/react'
import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { ROUTES } from '../../lib/routes'

const TOOL_STEPS = [
  { icon: House, label: 'Uw pand' },
  { icon: Ruler, label: 'Staat van het pand' },
  { icon: Lightning, label: 'Energieverbruik' },
  { icon: ClipboardText, label: 'Uw rapport' },
]

export function EnergieCta() {
  return (
    <Section tone="muted">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl text-primary sm:text-4xl">Nog niet zeker waar u staat?</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground-muted">
            Beantwoord in enkele minuten een paar vragen over uw pand en ontvang direct een eerste
            indicatie van de grootste besparingskansen.
          </p>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {TOOL_STEPS.map((step) => (
              <li key={step.label} className="flex items-center gap-2 text-sm font-medium text-primary">
                <step.icon size={18} weight="light" className="text-accent" />
                {step.label}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Button to={ROUTES.energieIndicatie}>Start de energie-indicatie</Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
