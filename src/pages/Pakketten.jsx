import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Button } from '../components/ui/Button'
import { PricingCard } from '../components/home/PricingCard'
import { ComparisonTable } from '../components/pakketten/ComparisonTable'
import { PrijsPerOppervlakte } from '../components/pakketten/PrijsPerOppervlakte'
import { DecisionCta } from '../components/pakketten/DecisionCta'
import { UspStrip } from '../components/home/UspStrip'
import { PACKAGES } from '../data/packages'
import { PACKAGE_DETAILS } from '../data/packageDetails'
import { FAQ_CATEGORIES } from '../data/faqs'
import { COMPARISON_NOTE } from '../data/packageComparison'
import { COMPANY } from '../data/company'
import { getBreadcrumbSchema, getFaqSchema, getServiceSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'
import { trackEvent } from '../lib/analytics'

const OVERZICHT_ID = 'pakketten-overzicht'

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
  'Ik werk al met een vaste installateur, kan ik dan nog bij SMV Advies terecht?',
  'In welke regio zijn jullie actief?',
]
const ALLE_FAQ_ITEMS = FAQ_CATEGORIES.flatMap((groep) => groep.items)
const PAKKETTEN_FAQ_ITEMS = PAKKETTEN_FAQ_VRAGEN.map((vraag) => ALLE_FAQ_ITEMS.find((item) => item.question === vraag)).filter(Boolean)

// Zelfde renderlogica als Faq.jsx (niet geëxporteerd vanuit die pagina —
// dit project kent geen precedent van page-naar-page imports tussen lazy-
// loaded routes), hier lokaal omdat maar één van de hergebruikte items
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
        title="Verduurzamingsadvies bedrijfspand: prijzen"
        description={`Drie pakketten voor onafhankelijk verduurzamingsadvies voor uw bedrijfspand, met vaste prijzen per oppervlakte. ${PACKAGES[0].priceDisplay} excl. btw.`}
        structuredData={[
          getBreadcrumbSchema([{ name: 'Pakketten', path: ROUTES.pakketten }]),
          getFaqSchema([{ items: PAKKETTEN_FAQ_ITEMS }]),
          ...getServiceSchema(PACKAGES),
        ]}
      />

      <PageHero
        // \u00AD (zacht afbreekstreepje, onzichtbaar tenzij nodig): op 390px
        // is "Verduurzamingsadvies" in de H1 breder dan de kolom, waardoor
        // `overflow-wrap: break-word` (index.css) het woord op een willekeurige
        // letter afbrak. Nu breekt het, alleen indien nodig, netjes als
        // "Verduurzamings-/advies". Zelfde voor "verduurzamingspakketten".
        title={'Verduurzamings\u00ADadvies voor uw bedrijfspand'}
        eyebrow={`Drie pakketten met vaste prijzen, ${PACKAGES[0].priceDisplay.toLowerCase().replace('€ ', '€\u00A0')} excl. btw`}
        description="Voor ondernemers en eigenaren van mkb-bedrijfspanden in de Hoeksche Waard. U krijgt onafhankelijk advies over welke maatregelen voor uw pand zinvol zijn, wat ze kosten en opleveren, en in welke volgorde u ze het beste uitvoert. U kiest zelf hoe ver u gaat: van een QuickScan op afstand tot begeleiding bij de uitvoering."
      >
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            to={`${ROUTES.pakketten}#${OVERZICHT_ID}`}
            onClick={() => trackEvent('cta_click', { cta: 'pakketten_overzicht', location: 'pakketten_hero' })}
          >
            Bekijk pakketten en prijzen
          </Button>
          <Button
            to={ROUTES.contact}
            variant="ghost"
            onClick={() => trackEvent('cta_click', { cta: 'contact', location: 'pakketten_hero' })}
          >
            Stel eerst een vraag
          </Button>
        </div>
        <p className="mt-4 text-sm text-foreground-muted">
          Liever eerst even overleggen? Bel{' '}
          <a href={COMPANY.phoneHref} className={LINK_CLASSNAME}>
            {COMPANY.phone}
          </a>
          .
        </p>
      </PageHero>

      <Section tone="white" noTopPadding>
        <Container>
          <div id={OVERZICHT_ID} className="scroll-mt-24">
            <SectionHeading
              title="Kies het pakket dat bij uw vraag past"
              description={
                <>
                  Elk pakket begint bij uw pand: wat heeft het nodig en wat levert een maatregel op? Denk aan{' '}
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
          </div>
          <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {PACKAGES.map((pkg, index) => (
              <PricingCard key={pkg.id} pkg={pkg} delay={index * 80} />
            ))}
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="text-2xl text-primary sm:text-3xl">Wat kost het voor uw pand?</h2>
              <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-foreground">
                De prijs hangt af van het pakket en de oppervlakte van uw bedrijfspand.
              </p>
              <div className="mt-6">
                <PrijsPerOppervlakte />
              </div>
              <p className="mt-4 text-sm text-foreground-muted">{COMPARISON_NOTE}</p>
            </div>
            <div className="lg:col-span-5">
              <h2 className="text-2xl text-primary sm:text-3xl">Wat gebeurt er na uw aanvraag?</h2>
              <ol className="mt-6 list-decimal space-y-4 pl-5 text-base leading-relaxed text-foreground marker:font-semibold marker:text-primary">
                <li>
                  U kiest een pakket en stuurt uw aanvraag via de contactpagina; het gekozen pakket staat daar al
                  vermeld. {COMPANY.responseTime}.
                </li>
                <li>U ontvangt een vrijblijvende offerte met de prijs voor uw pand.</li>
                <li>
                  De opdracht komt tot stand zodra u de offerte schriftelijk of per e-mail accepteert. U ontvangt dan
                  een opdrachtbevestiging met de omvang, de prijs en de planning.
                </li>
              </ol>
              <p className="mt-4 text-sm text-foreground-muted">
                Zie ook onze{' '}
                <Link to={ROUTES.voorwaarden} className={LINK_CLASSNAME}>
                  algemene voorwaarden
                </Link>{' '}
                en{' '}
                <Link to={ROUTES.werkwijze} className={LINK_CLASSNAME}>
                  werkwijze
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-4 rounded-xl bg-muted p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="font-body text-lg font-semibold text-primary">
                Nog niet zeker waar u staat? Begin met de gratis energie-indicatie
              </h2>
              <p className="mt-2 max-w-[70ch] text-base leading-relaxed text-foreground">
                Een geautomatiseerde, vrijblijvende indicatie van hoe uw pand er globaal voor staat, zonder bedragen
                per maatregel. Voor een rapport mét investering, besparing en terugverdientijd per maatregel is het
                Basis Pakket de eerste stap.
              </p>
            </div>
            <Button
              to={ROUTES.energieIndicatie}
              variant="outline"
              className="shrink-0"
              onClick={() => trackEvent('cta_click', { cta: 'energie_indicatie', location: 'pakketten_overzicht' })}
            >
              Start de gratis energie-indicatie
            </Button>
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
              <div key={pkg.id} className="rounded-xl bg-white p-6 sm:p-8">
                <p className="text-base font-semibold text-primary">
                  Kies {pkg.name} als…
                </p>
                <p className="mt-2 text-base leading-relaxed text-foreground">{zin}</p>
                <Link to={ROUTES.pakketAnchor(pkg.id)} className={`mt-3 inline-block text-sm ${LINK_CLASSNAME}`}>
                  Meer over {pkg.name}
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* noTopPadding: sluit direct aan op de `muted`-sectie hierboven
          (zelfde achtergrond) — zonder stapelde de padding van beide
          secties zich op tot een ~220px leeg grijs vlak. */}
      <Section tone="muted" noTopPadding>
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
            description="Voor wie het bedoeld is, wat u concreet ontvangt en hoe het traject verloopt, per pakket op een rij."
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
                  className="scroll-mt-24 rounded-2xl bg-muted p-7 sm:p-10"
                >
                  <h3 className="text-2xl text-primary">{pkg.name}</h3>
                  <p className="mt-1 text-base text-foreground-muted">{pkg.subtitle}</p>

                  <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <div>
                      <h4 className="font-body text-base font-semibold text-primary">Voor wie</h4>
                      <p className="mt-2 text-base leading-relaxed text-foreground">{details.voorWie}</p>
                    </div>
                    <div>
                      <h4 className="font-body text-base font-semibold text-primary">Wat u ontvangt</h4>
                      <ul className="mt-2 space-y-1.5 text-base leading-relaxed text-foreground">
                        {details.watJeOntvangt.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-body text-base font-semibold text-primary">Hoe het proces verloopt</h4>
                      <ol className="mt-2 list-inside list-decimal space-y-1.5 text-base leading-relaxed text-foreground">
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
