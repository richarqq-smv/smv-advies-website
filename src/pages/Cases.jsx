import {
  Buildings,
  CheckCircle,
  CurrencyEur,
  Gauge,
  ListNumbers,
  MagnifyingGlass,
  Receipt,
  Scales,
} from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Button } from '../components/ui/Button'
import { ClosingCta } from '../components/home/ClosingCta'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

const ONDERZOCHT = [
  {
    icon: Buildings,
    title: 'Uw pand',
    description: 'Bouwjaar, oppervlakte, indeling en het huidige energiegebruik.',
  },
  {
    icon: Gauge,
    title: 'Bouwkundige schil',
    description: 'Isolatie van dak, gevel, vloer en beglazing — waar zit het grootste warmteverlies.',
  },
  {
    icon: MagnifyingGlass,
    title: 'Installaties',
    description: 'Verwarming, ventilatie, verlichting en eventuele bestaande opwekinstallaties.',
  },
  {
    icon: Receipt,
    title: 'Regelgeving',
    description: 'Energielabelverplichtingen en de energiebesparingsplicht die op uw pand van toepassing kunnen zijn.',
  },
]

const AFWEGING = [
  'Per kansrijke maatregel brengen we investering, verwachte besparing en indicatieve terugverdientijd in kaart.',
  'We wegen maatregelen tegen elkaar af: wat levert het meeste op voor de laagste investering, en wat is technisch afhankelijk van iets anders — bijvoorbeeld eerst isoleren voordat een warmtepomp zin heeft?',
  'We geven aan welke subsidies, zoals EIA of ISDE, mogelijk van toepassing zijn.',
  'Zo komen we tot een realistische prioritering: wat eerst, en wat kan wachten.',
]

export default function Cases() {
  return (
    <>
      <Seo
        title="Hoe een advies tot stand komt"
        description="Hoe een verduurzamingsadvies van SMV Advies tot stand komt: wat we onderzoeken, hoe we prioriteren en wat u ontvangt — zonder verzonnen praktijkcijfers."
        structuredData={[getBreadcrumbSchema([{ name: 'Hoe een advies tot stand komt', path: ROUTES.cases }])]}
      />

      <PageHero
        eyebrow="Praktijkvoorbeelden"
        title="Wat u van een advies bij SMV Advies kunt verwachten"
        description="Op dit moment publiceren we geen geverifieerde praktijkcases. Cijfers, resultaten of klantverhalen die we niet met zekerheid kunnen onderbouwen, laten we daarom liever weg. Wel ziet u hieronder precies hoe een adviestraject wordt aangepakt en wat het oplevert."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <SectionHeading title="Wat we onderzoeken" className="mb-10" />

          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {ONDERZOCHT.map((item) => (
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
        <Container className="max-w-3xl">
          <SectionHeading
            title="Hoe we tot een advies komen"
            description="Onderzoeken is één stap — de maatregelen die daaruit volgen moeten ook tegen elkaar worden afgewogen, financieel en technisch."
            className="mb-10"
          />

          <ul className="flex flex-col gap-4">
            {AFWEGING.map((punt) => (
              <li key={punt} className="flex items-start gap-3">
                <Scales size={20} weight="light" className="mt-0.5 shrink-0 text-accent" />
                <span className="text-base leading-relaxed text-foreground-muted">{punt}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="max-w-3xl">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <CurrencyEur size={26} weight="light" className="text-accent" />
              <h2 className="mt-4 text-xl font-semibold text-primary">Wat u ontvangt</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                Een helder rapport: de belangrijkste kansen in uw pand, per maatregel een indicatie
                van investering, besparing en terugverdientijd, en een praktische volgorde om in
                uit te voeren. Geen dikke map vol jargon — een document waarmee u direct de
                volgende stap kunt zetten.
              </p>
            </div>
            <div>
              <ListNumbers size={26} weight="light" className="text-accent" />
              <h2 className="mt-4 text-xl font-semibold text-primary">Vervolgstappen</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                U bepaalt zelf of en wanneer u een maatregel laat uitvoeren, en door wie. Wilt u
                verder? Dan kunnen we ook begeleiden bij het opvragen en vergelijken van offertes,
                de subsidieaanvraag en de uitvoering.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Illustratief voorbeeld — geen echte case
          </p>
          <h2 className="mt-3 text-2xl text-primary sm:text-3xl">Voorbeeld van een adviesuitkomst</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground-muted">
            Stel: een kantoorpand uit de jaren negentig, matig geïsoleerd, met een verouderde
            cv-ketel. Een advies voor zo'n pand brengt doorgaans in kaart:
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {[
              'Welke isolatiemaatregelen (dak, gevel, vloer, glas) het meeste opleveren, en in welke volgorde.',
              'Of een (hybride) warmtepomp nu al interessant is, of beter op een later moment.',
              'Of zonnepanelen renderen, gezien het beschikbare dakoppervlak en de actuele regelgeving.',
              'Een indicatie van investering, besparing en terugverdientijd per maatregel.',
              'Welke subsidies, zoals EIA of ISDE, mogelijk van toepassing zijn.',
            ].map((punt) => (
              <li key={punt} className="flex items-start gap-2.5">
                <CheckCircle size={18} weight="light" className="mt-0.5 shrink-0 text-accent" />
                <span className="text-sm leading-relaxed text-foreground-muted">{punt}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-foreground-muted">
            Dit voorbeeld is illustratief en bevat bewust geen specifieke bedragen of percentages —
            een daadwerkelijk advies is altijd gebaseerd op de specifieke situatie van uw pand.
          </p>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="max-w-3xl text-center">
          <p className="text-base leading-relaxed text-foreground-muted">
            Zodra we een adviestraject hebben afgerond en de klant instemt met publicatie, delen
            we dat traject hier als een geverifieerde praktijkcase — met de daadwerkelijke
            situatie, cijfers en resultaten van dat specifieke pand.
          </p>
          <div className="mt-6">
            <Button to={ROUTES.energieIndicatie}>Start de gratis energiecheck</Button>
          </div>
        </Container>
      </Section>

      <ClosingCta />
    </>
  )
}
