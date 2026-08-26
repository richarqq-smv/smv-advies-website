import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { EnergieScanTool } from '../components/energieIndicatie/EnergieScanTool'

export default function EnergieIndicatie() {
  return (
    <>
      <Seo
        title="Gratis energie-indicatie"
        description="Ontdek in enkele minuten waar uw bedrijfspand energie verliest en welke maatregelen het meeste opleveren."
      />

      <PageHero
        eyebrow="Gratis indicatie · geen officieel energielabel"
        title="Ontdek waar uw bedrijfspand energie verliest"
        description="Beantwoord in 5-7 minuten een paar vragen over uw pand en ontvang direct een persoonlijk rapport met de grootste besparingskansen."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <EnergieScanTool />

          <p className="mx-auto mt-8 max-w-[70ch] text-center text-xs leading-relaxed text-foreground-muted">
            <strong className="font-semibold text-foreground">Indicatie, geen officieel energielabel.</strong> Deze
            scan gebruikt vuistregels (prijspeil 2026) om een schatting te geven — geen garantie op besparing of
            kosten, en geen vervanging van een officiële NTA 8800-meting.
          </p>
        </Container>
      </Section>
    </>
  )
}
