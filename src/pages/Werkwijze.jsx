import { CurrencyEur, ListNumbers, MagnifyingGlass, Receipt } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { SectionHeading } from '../components/ui/SectionHeading'
import { HowItWorks } from '../components/home/HowItWorks'
import { ClosingCta } from '../components/home/ClosingCta'

const WAT_U_KRIJGT = [
  {
    icon: MagnifyingGlass,
    title: 'Kansen',
    description: 'Heldere inventarisatie van alle kansen in uw pand, van isolatie tot installaties.',
  },
  {
    icon: CurrencyEur,
    title: 'Bedragen',
    description: 'Realistische indicatie van investering en besparing, geen loze beloftes.',
  },
  {
    icon: ListNumbers,
    title: 'Prioritering',
    description: 'Een logische volgorde van stappen, zodat u weet waar u het beste kunt beginnen.',
  },
  {
    icon: Receipt,
    title: 'Subsidies',
    description: 'Een check op de belangrijkste regelingen, waaronder EIA, ISDE en SDE++.',
  },
]

export default function Werkwijze() {
  return (
    <>
      <Seo
        title="Werkwijze"
        description="Van eerste kennismaking tot concreet resultaat: een vast, transparant traject bij SMV Advies."
      />

      <PageHero
        eyebrow="Werkwijze"
        title="Van eerste kennismaking tot concreet resultaat"
        description="Een vast, transparant traject. U weet vooraf wat u kunt verwachten — geen verrassingen, wel duidelijkheid op elk moment."
      />

      <HowItWorks />

      <Section tone="muted">
        <Container>
          <SectionHeading
            title="Een rapport dat u écht gebruikt"
            description="Geen jargon, geen dikke map die in een la verdwijnt. U ontvangt een helder rapport met een overzicht van kansen, een indicatie van investeringen en besparingen, en een praktische prioritering. Precies genoeg om de volgende stap te zetten."
            className="mb-10"
          />

          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {WAT_U_KRIJGT.map((item) => (
              <li key={item.title}>
                <item.icon size={26} weight="light" className="text-accent" />
                <h3 className="mt-4 text-base font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="max-w-3xl">
          <h2 className="text-2xl text-primary sm:text-3xl">Wat SMV Advies niet doet</h2>
          <p className="mt-5 text-base leading-relaxed text-foreground-muted">
            SMV Advies voert zelf geen bouwkundige of installatietechnische werkzaamheden uit. We
            adviseren, begeleiden en controleren, maar de daadwerkelijke uitvoering ligt bij
            gespecialiseerde installateurs en aannemers. Dat past bij onze onafhankelijke rol: we
            hebben geen belang bij een bepaalde uitvoerder of een bepaald product.
          </p>
        </Container>
      </Section>

      <ClosingCta />
    </>
  )
}
