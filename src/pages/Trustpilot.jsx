import { Star, ShieldCheck, ChatCircleText } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Button } from '../components/ui/Button'
import { getBreadcrumbSchema, getFaqSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'
import { COMPANY } from '../data/company'

const WAAROM_TRUSTPILOT = [
  {
    icon: ShieldCheck,
    title: 'Onafhankelijk platform',
    description:
      'Trustpilot is een onafhankelijk reviewplatform, los van SMV Advies. Beoordelingen worden niet door ons geschreven of geselecteerd.',
  },
  {
    icon: ChatCircleText,
    title: 'Open voor iedereen',
    description:
      'Iedereen die bij ons een adviestraject heeft doorlopen, kan daar een eigen, onbewerkte ervaring delen, positief of kritisch.',
  },
  {
    icon: Star,
    title: 'Nog in opbouw',
    description:
      'Ons Trustpilot-profiel is recent aangemaakt. We verzamelen momenteel de eerste beoordelingen, bekijk hieronder de actuele stand.',
  },
]

const FAQ_ITEMS = [
  {
    question: 'Waar vind ik recensies en beoordelingen van SMV Advies?',
    answer:
      'Alle onafhankelijke recensies en beoordelingen van SMV Advies staan op Trustpilot, een extern, onafhankelijk reviewplatform. U vindt de link naar onze Trustpilot-pagina verderop op deze pagina en in de footer van elke pagina op deze site.',
  },
  {
    question: 'Is SMV Advies betrouwbaar?',
    answer:
      'SMV Advies geeft onafhankelijk verduurzamingsadvies en verkoopt zelf geen installaties, zodat ons advies niet gekleurd wordt door verkoopbelangen. Om die betrouwbaarheid ook extern te laten toetsen, verzamelen we beoordelingen via Trustpilot, los van onze eigen website.',
  },
  {
    question: 'Hoe laat ik zelf een review of beoordeling achter over SMV Advies?',
    answer:
      'Klik op de knop "Beoordeel ons op Trustpilot" op deze pagina of in de footer. U komt dan direct op onze Trustpilot-pagina terecht, waar u zelf een review kunt schrijven.',
  },
  {
    question: 'Heeft SMV Advies al reviews of een TrustScore op Trustpilot?',
    answer:
      'Ons Trustpilot-profiel is recent opgezet en we zijn op dit moment bezig met het verzamelen van de eerste beoordelingen. Het actuele aantal reviews en de huidige TrustScore ziet u altijd rechtstreeks op onze Trustpilot-pagina, niet hier.',
  },
]

export default function Trustpilot() {
  return (
    <>
      <Seo
        title="Recensies en beoordelingen op Trustpilot"
        description="Lees onafhankelijke recensies en beoordelingen van SMV Advies op Trustpilot, of deel zelf uw ervaring met ons verduurzamingsadvies voor mkb-bedrijfspanden in de Hoeksche Waard."
        structuredData={[
          getBreadcrumbSchema([{ name: 'Recensies en beoordelingen', path: ROUTES.trustpilot }]),
          getFaqSchema([{ items: FAQ_ITEMS }]),
        ]}
      />

      <PageHero
        eyebrow="Klantervaringen"
        title="Recensies en beoordelingen van SMV Advies op Trustpilot"
        description="We laten liever zien wat klanten echt van ons verduurzamingsadvies vinden dan dat we het zelf claimen. Daarom verzamelen we onafhankelijke recensies en beoordelingen via Trustpilot, in plaats van alleen uitgelichte quotes op onze eigen site."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <SectionHeading title="Waarom Trustpilot" className="mb-10" />
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
            {WAAROM_TRUSTPILOT.map((item) => (
              <li key={item.title}>
                <item.icon size={26} weight="light" className="text-accent" />
                <h3 className="mt-4 text-base font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="muted">
        <Container className="max-w-2xl text-center">
          <SectionHeading
            title="Bekijk de actuele beoordelingen"
            description="De onderstaande widget en link komen rechtstreeks van Trustpilot, niet van ons. Daar vindt u altijd het meest actuele overzicht van alle recensies, inclusief eventuele reacties van ons op een beoordeling."
            className="mb-8"
          />

          <div className="flex flex-col items-center gap-6">
            {/* Zelfde officiële, gratis TrustBox "Review Collector"-widget
                als in de footer (Trustpilot-ronde 2026-10-14) — hier
                nogmaals, in context van deze pagina. Het bootstrap-script
                staat eenmalig in index.html. */}
            <div
              className="trustpilot-widget w-full max-w-sm"
              data-locale="nl-NL"
              data-template-id="56278e9abfbbba0bdcd568bc"
              data-businessunit-id="6abf610ed4ea2cdc6ac6b813"
              data-style-height="52px"
              data-style-width="100%"
              data-token="b49c3545-1baa-4fc6-866c-8bcabd166184"
            >
              <a href={COMPANY.trustpilotUrl} target="_blank" rel="noopener noreferrer">
                Trustpilot
              </a>
            </div>

            <Button href={COMPANY.trustpilotUrl} target="_blank" rel="noopener noreferrer" variant="outline">
              Bekijk alle recensies op Trustpilot
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="max-w-2xl">
          <SectionHeading title="Veelgestelde vragen over onze recensies" className="mb-8" />
          <div className="flex flex-col divide-y divide-border border-t border-border">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="py-5">
                <h3 className="text-base font-semibold text-primary">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.answer}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container className="max-w-2xl text-center">
          <p className="text-base leading-relaxed text-foreground-muted">
            Heeft u recent een adviestraject bij SMV Advies doorlopen? Uw ervaring helpt andere
            mkb-ondernemers in de Hoeksche Waard om een weloverwogen keuze te maken. Deel 'm gerust
            via de knop hierboven.
          </p>
        </Container>
      </Section>
    </>
  )
}
