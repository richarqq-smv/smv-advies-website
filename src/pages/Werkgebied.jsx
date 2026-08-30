import { HouseLine, Lightbulb, Thermometer, SunHorizon, Gauge, Receipt } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { ClosingCta } from '../components/home/ClosingCta'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

const MAATREGELEN = [
  {
    icon: HouseLine,
    title: 'Dakisolatie',
    description: 'Vaak de grootste warmteverliezer — en meestal de maatregel met de kortste terugverdientijd.',
    to: ROUTES.blogPost('dakisolatie-voor-uw-bedrijfspand'),
  },
  {
    icon: Lightbulb,
    title: 'LED-verlichting',
    description: 'Lage investering, snel zichtbaar resultaat — vaak de logische eerste stap.',
    to: ROUTES.blogPost('led-verlichting-snelste-stap'),
  },
  {
    icon: Thermometer,
    title: 'Warmtepomp',
    description: 'Alleen rendabel als het pand er klaar voor is — daar rekenen we vooraf op door.',
    to: ROUTES.blogPost('warmtepomp-in-het-mkb'),
  },
  {
    icon: SunHorizon,
    title: 'Zonnepanelen',
    description: 'Kansrijk op veel platte bedrijfsdaken, met aandacht voor dakbelasting en netaansluiting.',
  },
  {
    icon: Gauge,
    title: 'Energiebeheer',
    description: 'Vaak zitten de grootste, onopvallende verspillers niet in de installatie maar in het gebruik.',
    to: ROUTES.blogPost('verborgen-energieverspillers'),
  },
  {
    icon: Receipt,
    title: 'Subsidies',
    description: 'EIA, ISDE en SDE++ kunnen de terugverdientijd van maatregelen fors verkorten.',
    to: ROUTES.blogPost('eia-isde-sde-subsidies'),
  },
]

export default function Werkgebied() {
  return (
    <>
      <Seo
        title="Verduurzaming bedrijfspand Hoeksche Waard"
        description="Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in de hele Hoeksche Waard, van Oud-Beijerland tot Puttershoek."
        structuredData={[getBreadcrumbSchema([{ name: 'Werkgebied', path: ROUTES.werkgebied }])]}
      />

      <PageHero
        eyebrow="Werkgebied"
        title="Verduurzamingsadvies voor bedrijfspanden in de Hoeksche Waard"
        description="SMV Advies helpt ondernemers en eigenaren van bedrijfspanden in de hele Hoeksche Waard om hun pand slim en onafhankelijk te verduurzamen — van een eerste QuickScan tot volledige begeleiding."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <h2 className="text-2xl text-primary sm:text-3xl">Voor wie dit werkgebied is</h2>
          <p className="mt-5 text-base leading-relaxed text-foreground-muted">
            SMV Advies richt zich op mkb-bedrijven met een eigen bedrijfspand: kantoren, winkels, showrooms,
            werkplaatsen en bedrijfshallen. Of u nu net wilt weten waar u staat met een{' '}
            <Link to={ROUTES.pakketten} className="font-medium text-accent underline underline-offset-2 hover:text-secondary">
              QuickScan
            </Link>
            , of volledige begeleiding zoekt van analyse tot en met de oplevering van de laatste maatregel: er is
            een pakket dat aansluit op uw situatie.
          </p>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <SectionHeading
            title="Welke vraagstukken we onderzoeken"
            description="Elk pand is anders, maar dit zijn de maatregelen die het vaakst terugkomen in een QuickScan of Premium-analyse."
            className="mb-10"
          />
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {MAATREGELEN.map((item) => (
              <li key={item.title}>
                <item.icon size={26} weight="light" className="text-accent" />
                <h3 className="mt-4 text-base font-semibold text-primary">
                  {item.to ? (
                    <Link to={item.to} className="hover:text-secondary">
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="max-w-3xl">
          <h2 className="text-2xl text-primary sm:text-3xl">Onafhankelijk, dus zonder verborgen belang</h2>
          <p className="mt-5 text-base leading-relaxed text-foreground-muted">
            SMV Advies verkoopt geen installaties, panelen of isolatiemateriaal en werkt niet op commissiebasis.
            Het advies dat u krijgt is dus nooit gekleurd door een belang bij een bepaalde installateur of
            leverancier — ons enige belang is dat uw pand minder energie kost en klaar is voor de toekomst. Lees
            meer over hoe dat in de praktijk werkt in onze{' '}
            <Link to={ROUTES.werkwijze} className="font-medium text-accent underline underline-offset-2 hover:text-secondary">
              werkwijze
            </Link>
            .
          </p>
        </Container>
      </Section>

      <Section tone="muted">
        <Container className="max-w-3xl">
          <h2 className="text-2xl text-primary sm:text-3xl">Actief in de hele Hoeksche Waard</h2>
          <p className="mt-5 text-base leading-relaxed text-foreground-muted">
            SMV Advies is gevestigd in Oud-Beijerland en actief in de hele Hoeksche Waard: van Numansdorp, Strijen
            en 's-Gravendeel tot Mijnsheerenland, Klaaswaal en Puttershoek. Die spreiding, van dorpskernen tot
            bedrijventerreinen, betekent dat we de bouwperiodes en het type bedrijfspand in de regio goed kennen
            — dat scheelt in de praktijk tijd en giswerk.
          </p>
        </Container>
      </Section>

      <ClosingCta />
    </>
  )
}
