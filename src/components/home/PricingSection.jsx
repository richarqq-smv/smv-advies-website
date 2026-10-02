import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { PricingCard } from './PricingCard'
import { PACKAGES } from '../../data/packages'

export function PricingSection() {
  return (
    <Section id="pakketten" tone="white">
      <Container>
        <SectionHeading
          title="Welk pakket bij u past, hangt af van hoeveel u al weet"
          description="Basis geeft een eerste richting zonder dat we langskomen. Premium is gebaseerd op een opname van uw pand zelf. Gold is voor wie het daarna ook geregeld wil hebben, binnen een vooraf afgesproken scope. Geen abonnement, geen kleine lettertjes."
          className="mb-12"
        />

        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {PACKAGES.map((pkg, index) => (
            <PricingCard key={pkg.id} pkg={pkg} delay={index * 80} />
          ))}
        </div>
      </Container>
    </Section>
  )
}
