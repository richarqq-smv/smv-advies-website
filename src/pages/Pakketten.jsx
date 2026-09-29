import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Button } from '../components/ui/Button'
import { PricingCard } from '../components/home/PricingCard'
import { ComparisonTable } from '../components/pakketten/ComparisonTable'
import { DecisionCta } from '../components/pakketten/DecisionCta'
import { PACKAGES } from '../data/packages'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

const LINK_CLASSNAME = 'font-medium text-accent underline underline-offset-2 hover:text-secondary'

export default function Pakketten() {
  return (
    <>
      <Seo
        title="Pakketten"
        description="Drie pakketten, één doel: een toekomstbestendig bedrijfspand. Van een snelle QuickScan tot ontzorging binnen een vooraf afgebakende scope."
        structuredData={[getBreadcrumbSchema([{ name: 'Pakketten', path: ROUTES.pakketten }])]}
      />

      <PageHero
        eyebrow="Diensten & pakketten"
        title="Drie manieren om te beginnen"
        description={
          <>
            Van een snelle indicatie op afstand tot ontzorging binnen een vooraf afgebakende scope. Kies het pakket
            dat past bij uw pand, uw doelen en uw budget — geen abonnement, geen kleine lettertjes. Denk aan{' '}
            <Link to={ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand')} className={LINK_CLASSNAME}>
              dakisolatie
            </Link>
            ,{' '}
            <Link to={ROUTES.blogPost('warmtepomp-in-het-mkb')} className={LINK_CLASSNAME}>
              een warmtepomp
            </Link>
            ,{' '}
            <Link to={ROUTES.blogPost('zonnepanelen-op-uw-bedrijfspand')} className={LINK_CLASSNAME}>
              zonnepanelen
            </Link>{' '}
            of{' '}
            <Link to={ROUTES.blogPost('led-verlichting-snelste-stap')} className={LINK_CLASSNAME}>
              LED-verlichting
            </Link>
            , inclusief een check op subsidies zoals{' '}
            <Link to={ROUTES.blogPost('eia-isde-sde-subsidies')} className={LINK_CLASSNAME}>
              EIA en ISDE
            </Link>
            .
          </>
        }
      />

      <Section tone="white" noTopPadding>
        <Container>
          <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-dashed border-border bg-muted/40 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Stap 0 · gratis</p>
              <p className="mt-1 text-base font-semibold text-primary">Energie Indicatie — Hoe staat mijn pand er globaal voor?</p>
              <p className="mt-1 text-sm text-foreground-muted">
                Nog geen idee waar u staat? Begin hier, geheel vrijblijvend — een geautomatiseerde
                indicatie, zonder bedragen per maatregel. Voor een rapport mét investering,
                besparing en terugverdientijd per maatregel is het Basis Pakket de eerste stap.
              </p>
            </div>
            <Button to={ROUTES.energieIndicatie} variant="outline" className="shrink-0">
              Start de gratis energie-indicatie
            </Button>
          </div>

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
            description={
              <>
                Een fysieke opname (Premium) geeft een betrouwbaarder beeld dan een inschatting op afstand
                (Basis). Twijfelt u tussen Premium en Gold? Kies Gold zodra u niet alleen wilt weten wát er
                moet gebeuren, maar ook wilt dat wij dat traject voor u uit handen nemen.
                Benieuwd hoe een compleet advies eruitziet? Bekijk{' '}
                <Link to={ROUTES.cases} className={LINK_CLASSNAME}>
                  hoe een advies tot stand komt
                </Link>
                .
              </>
            }
            className="mb-10"
          />
          <ComparisonTable />
        </Container>
      </Section>

      <DecisionCta />
    </>
  )
}
