import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { PricingCard } from '../components/home/PricingCard'
import { ComparisonTable } from '../components/pakketten/ComparisonTable'
import { DecisionCta } from '../components/pakketten/DecisionCta'
import { PACKAGES } from '../data/packages'

export default function Pakketten() {
  return (
    <>
      <Seo
        title="Pakketten"
        description="Drie pakketten, één doel: een toekomstbestendig bedrijfspand. Van een snelle QuickScan tot volledige begeleiding van A tot Z."
      />

      <PageHero
        eyebrow="Diensten & pakketten"
        title="Drie manieren om te beginnen"
        description="Van een snelle indicatie op afstand tot volledige ontzorging van A tot Z. Kies het pakket dat past bij uw pand, uw doelen en uw budget — geen abonnement, geen kleine lettertjes."
      />

      <Section tone="white" noTopPadding>
        <Container>
          <h2 className="sr-only">Onze pakketten</h2>
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {PACKAGES.map((pkg, index) => (
              <PricingCard key={pkg.id} pkg={pkg} delay={index * 80} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <SectionHeading
            title="Het verschil in één oogopslag"
            description="De meeste ondernemers kiezen voor het Premium Pakket: een fysieke opname geeft een betrouwbaarder beeld dan een inschatting op afstand. Twijfelt u tussen Premium en Gold? Kies Gold zodra u niet alleen wilt weten wát er moet gebeuren, maar ook wilt dat wij dat traject voor u uit handen nemen."
            className="mb-10"
          />
          <ComparisonTable />
        </Container>
      </Section>

      <DecisionCta />
    </>
  )
}
