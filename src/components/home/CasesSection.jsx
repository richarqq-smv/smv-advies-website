import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { SectionHeading } from '../ui/SectionHeading'
import { CaseCard } from './CaseCard'
import { CASES } from '../../data/cases'

export function CasesSection() {
  return (
    <Section tone="white">
      <Container>
        <SectionHeading
          title="Resultaten in de praktijk"
          description="Voor- en na-situaties van mkb-panden in de Hoeksche Waard, van QuickScan tot uitvoering."
          className="mb-12"
        />

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map((item, index) => (
            <CaseCard key={item.id} item={item} delay={index * 80} />
          ))}
        </div>
      </Container>
    </Section>
  )
}
