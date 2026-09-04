import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { EnergieScanTool } from '../components/energieIndicatie/EnergieScanTool'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

const LINK_CLASSNAME = 'font-medium text-accent underline underline-offset-2 hover:text-secondary'

export default function EnergieIndicatie() {
  return (
    <>
      <Seo
        title="Gratis energie-indicatie"
        description="Ontdek in enkele minuten waar uw bedrijfspand energie verliest en welke maatregelen het meeste opleveren."
        structuredData={[getBreadcrumbSchema([{ name: 'Energie-indicatie', path: ROUTES.energieIndicatie }])]}
      />

      <PageHero
        eyebrow="Gratis indicatie · geen officieel energielabel"
        title="Ontdek waar uw bedrijfspand energie verliest"
        description="Beantwoord in 5-7 minuten een paar vragen over uw pand en ontvang direct een persoonlijk rapport met de grootste besparingskansen."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <EnergieScanTool />

          <p className="mx-auto mt-8 max-w-[65ch] text-center text-sm leading-relaxed text-foreground-muted">
            De scan kijkt onder meer naar isolatie, verwarming en verlichting, en geeft een eerste
            indicatie van kansen zoals{' '}
            <Link to={ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand')} className={LINK_CLASSNAME}>
              dakisolatie
            </Link>
            ,{' '}
            <Link to={ROUTES.blogPost('warmtepomp-in-het-mkb')} className={LINK_CLASSNAME}>
              een warmtepomp
            </Link>{' '}
            of{' '}
            <Link to={ROUTES.blogPost('led-verlichting-snelste-stap')} className={LINK_CLASSNAME}>
              LED-verlichting
            </Link>
            .
          </p>

          <p className="mx-auto mt-4 max-w-[70ch] text-center text-xs leading-relaxed text-foreground-muted">
            <strong className="font-semibold text-foreground">Indicatie, geen officieel energielabel.</strong> Deze
            scan gebruikt vuistregels (prijspeil 2026) om een schatting te geven — geen garantie op besparing of
            kosten, en geen vervanging van een officiële NTA 8800-meting.
          </p>
        </Container>
      </Section>
    </>
  )
}
