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
import { UspStrip } from '../components/home/UspStrip'
import { PACKAGES } from '../data/packages'
import { PACKAGE_DETAILS } from '../data/packageDetails'
import { FAQ_CATEGORIES } from '../data/faqs'
import { getBreadcrumbSchema, getFaqSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

const LINK_CLASSNAME = 'font-medium text-accent underline underline-offset-2 hover:text-secondary'

// Subset van de bestaande FAQ_CATEGORIES (src/data/faqs.js) die direct
// relevant is voor deze pagina — geen nieuwe vragen/antwoorden, uitsluitend
// hergebruik van al gepubliceerde content zodat /pakketten en /faq nooit
// uit elkaar kunnen lopen.
const PAKKETTEN_FAQ_VRAGEN = [
  'Wat is het verschil tussen de drie pakketten?',
  'Wat kost een verduurzamingsadvies?',
  'Zijn de genoemde besparingen en investeringen bindend?',
  'Helpen jullie met subsidies zoals EIA en ISDE?',
  'Ik heb al een meerjarenonderhoudsplan (MJOP), heeft een advies van SMV dan nog zin?',
  'Is SMV Advies onafhankelijk?',
]
const ALLE_FAQ_ITEMS = FAQ_CATEGORIES.flatMap((groep) => groep.items)
const PAKKETTEN_FAQ_ITEMS = PAKKETTEN_FAQ_VRAGEN.map((vraag) => ALLE_FAQ_ITEMS.find((item) => item.question === vraag)).filter(Boolean)

// Zelfde renderlogica als Faq.jsx (niet geëxporteerd vanuit die pagina —
// dit project kent geen precedent van page-naar-page imports tussen lazy-
// loaded routes), hier lokaal omdat maar één van de zes hergebruikte items
// `answerParts` heeft.
function renderFaqAntwoord(item) {
  if (!item.answerParts) return item.answer
  return item.answerParts.map((deel, index) =>
    typeof deel === 'string' ? (
      <span key={index}>{deel}</span>
    ) : (
      <Link key={index} to={deel.to} className={LINK_CLASSNAME}>
        {deel.text}
      </Link>
    ),
  )
}

export default function Pakketten() {
  return (
    <>
      <Seo
        title="Verduurzamingsadvies bedrijfspand"
        description="Onafhankelijk verduurzamingsadvies voor uw bedrijfspand: van eerste inzicht tot volledige begeleiding. Pakketten voor mkb-bedrijfspanden, vanaf €495."
        structuredData={[
          getBreadcrumbSchema([{ name: 'Pakketten', path: ROUTES.pakketten }]),
          getFaqSchema([{ items: PAKKETTEN_FAQ_ITEMS }]),
        ]}
      />

      <PageHero
        eyebrow="Drie manieren om te beginnen"
        title="Verduurzamingsadvies voor uw bedrijfspand"
        description="Weet u niet goed welke verduurzamingsmaatregelen voor uw pand interessant zijn? SMV Advies brengt de mogelijkheden, investeringen, besparingen en vervolgstappen overzichtelijk in beeld — onafhankelijk, en in drie niveaus: van een eerste indicatie tot volledige begeleiding bij de uitvoering."
      />

      <Section tone="white" noTopPadding>
        <Container>
          <SectionHeading
            title="Welk advies heeft uw bedrijfspand nodig?"
            description={
              <>
                Eerst bepalen wat uw pand nodig heeft. Daarna bepalen wat u ermee wilt doen. Denk aan{' '}
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
            className="mb-8"
          />

          <div className="mb-10 flex flex-col items-start justify-between gap-4 rounded-xl border border-dashed border-border bg-muted/40 p-6 sm:flex-row sm:items-center">
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

          <SectionHeading
            title="Onze verduurzamingspakketten"
            description="Drie niveaus van advies en begeleiding — van eerste inzicht tot volledige uitvoeringsbegeleiding."
            className="mb-8"
          />
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {PACKAGES.map((pkg, index) => (
              <PricingCard key={pkg.id} pkg={pkg} delay={index * 80} />
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <SectionHeading title="Welk pakket past bij u?" className="mb-8" />
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { pkg: PACKAGES[0], zin: 'u vooral inzicht wilt in de belangrijkste verduurzamingskansen, zonder dat we hoeven langs te komen.' },
              { pkg: PACKAGES[1], zin: 'u een uitgebreider, op locatie onderbouwd advies nodig heeft om een beslissing te kunnen nemen.' },
              { pkg: PACKAGES[2], zin: 'u niet alleen advies wilt, maar ook begeleiding wilt bij de uitvoering, binnen een vooraf afgesproken scope.' },
            ].map(({ pkg, zin }) => (
              <div key={pkg.id} className="rounded-xl border border-border bg-white p-6">
                <p className="text-base font-semibold text-primary">
                  Kies {pkg.name} als…
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{zin}</p>
                <Link to={ROUTES.pakketAnchor(pkg.id)} className={`mt-3 inline-block text-sm ${LINK_CLASSNAME}`}>
                  Meer over {pkg.name}
                </Link>
              </div>
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

      <Section tone="white">
        <Container>
          <SectionHeading
            title="Wat elk pakket u oplevert"
            description="Voor wie het bedoeld is, wat u concreet ontvangt en hoe het traject verloopt — per pakket op een rij."
            className="mb-10"
          />
          <div className="flex flex-col gap-8">
            {PACKAGES.map((pkg) => {
              const details = PACKAGE_DETAILS[pkg.id]
              if (!details) return null
              return (
                <div
                  key={pkg.id}
                  id={`pakket-${pkg.id}`}
                  className="scroll-mt-24 rounded-2xl border border-border bg-white p-7 sm:p-8"
                >
                  <h3 className="text-2xl text-primary">{pkg.name}</h3>
                  <p className="mt-1 text-sm text-foreground-muted">{pkg.subtitle}</p>

                  <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Voor wie</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{details.voorWie}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Wat u ontvangt</p>
                      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground-muted">
                        {details.watJeOntvangt.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Hoe het proces verloopt</p>
                      <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm leading-relaxed text-foreground-muted">
                        {details.hoeHetProcesVerloopt.map((stap) => (
                          <li key={stap}>{stap}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <Button to={pkg.ctaTo} variant={pkg.featured ? 'primary' : 'outline'} size="sm" className="mt-6">
                    {pkg.cta}
                  </Button>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      <UspStrip />

      <Section tone="white">
        <Container className="max-w-3xl">
          <SectionHeading title="Veelgestelde vragen" className="mb-8" />
          <div className="flex flex-col divide-y divide-border border-t border-border">
            {PAKKETTEN_FAQ_ITEMS.map((item) => (
              <div key={item.question} className="py-5">
                <h3 className="text-base font-semibold text-primary">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{renderFaqAntwoord(item)}</p>
              </div>
            ))}
          </div>
          <Link to={ROUTES.faq} className={`mt-6 inline-block text-sm ${LINK_CLASSNAME}`}>
            Bekijk alle veelgestelde vragen
          </Link>
        </Container>
      </Section>

      <DecisionCta />
    </>
  )
}
