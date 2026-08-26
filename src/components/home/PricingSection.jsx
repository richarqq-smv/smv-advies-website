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
          title="Drie pakketten, één doel: een toekomstbestendig bedrijfspand"
          description="Van een snelle QuickScan tot volledige begeleiding van A tot Z. Geen abonnement, geen kleine lettertjes, wel een helder rapport dat u verder helpt."
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
