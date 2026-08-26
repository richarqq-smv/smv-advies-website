import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { CaseDetailCard } from '../components/cases/CaseDetailCard'
import { ClosingCta } from '../components/home/ClosingCta'
import { CASES_DETAILED } from '../data/casesDetailed'

export default function Cases() {
  return (
    <>
      <Seo
        title="Cases"
        description="Voor- en na-situaties van mkb-bedrijfspanden in de Hoeksche Waard, van QuickScan tot uitvoering."
      />

      <PageHero
        eyebrow="Resultaten in de praktijk"
        title="Voor- en na-situaties van mkb-panden in de Hoeksche Waard"
        description="Hoe ziet verduurzaming eruit in de praktijk? Drie voorbeelden van bedrijfspanden die we hebben begeleid — van QuickScan tot uitvoering."
      />

      <Section tone="white" noTopPadding>
        <Container>
          <h2 className="sr-only">Cases</h2>
          <div className="flex flex-col gap-8">
            {CASES_DETAILED.map((item, index) => (
              <CaseDetailCard key={item.id} item={item} delay={index * 80} />
            ))}
          </div>
        </Container>
      </Section>

      <ClosingCta />
    </>
  )
}
