import { Compass, FileText, ListChecks, MagnifyingGlass } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { ClosingCta } from '../components/home/ClosingCta'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

const ADVIES_ONDERDELEN = [
  {
    icon: MagnifyingGlass,
    title: 'Situatie',
    description: 'Uw pand, bouwjaar, huidige energiegebruik en de vraag die u heeft.',
  },
  {
    icon: ListChecks,
    title: 'Analyse',
    description: 'Wat we onderzoeken: isolatie, installaties, verbruik en relevante regelgeving.',
  },
  {
    icon: Compass,
    title: 'Advies',
    description: 'Welke maatregelen relevant zijn, en in welke volgorde ze het meeste opleveren.',
  },
  {
    icon: FileText,
    title: 'Cijfers en prioriteiten',
    description: 'Een indicatie van investering, besparing en terugverdientijd per maatregel — en wat eerst kan.',
  },
]

export default function Cases() {
  return (
    <>
      <Seo
        title="Praktijkvoorbeelden"
        description="SMV Advies is net gestart. Zodra de eerste trajecten zijn afgerond, delen we hier echte praktijkcases uit de Hoeksche Waard."
        structuredData={[getBreadcrumbSchema([{ name: 'Praktijkvoorbeelden', path: ROUTES.cases }])]}
      />

      <PageHero
        eyebrow="Praktijkvoorbeelden"
        title="Binnenkort: echte praktijkcases uit de Hoeksche Waard"
        description="SMV Advies is net gestart. Er zijn nu nog geen gepubliceerde praktijkcases. Zodra de eerste trajecten zijn afgerond — en de klant daarmee akkoord gaat — delen we hier echte voor- en na-situaties, mét concrete cijfers en foto's."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <SectionHeading title="Zo ziet een compleet advies eruit" className="mb-10" />

          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {ADVIES_ONDERDELEN.map((item) => (
              <li key={item.title}>
                <item.icon size={26} weight="light" className="text-accent" />
                <h3 className="mt-4 text-base font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.description}</p>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-base leading-relaxed text-foreground-muted">
            Zodra we dit voor een eerste klant hebben afgerond, publiceren we dat traject hier als
            een echte case — met de daadwerkelijke situatie, cijfers en resultaten van dat pand,
            nooit als voorbeeld of gemiddelde.
          </p>
        </Container>
      </Section>

      <ClosingCta />
    </>
  )
}
