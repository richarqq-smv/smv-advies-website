import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Reveal } from '../components/ui/Reveal'
import { ClosingCta } from '../components/home/ClosingCta'
import { FAQ_CATEGORIES } from '../data/faqs'
import { getBreadcrumbSchema, getFaqSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

export default function Faq() {
  return (
    <>
      <Seo
        title="Veelgestelde vragen"
        description="Antwoorden op wat ondernemers willen weten over verduurzamingsadvies bij SMV Advies."
        structuredData={[
          getBreadcrumbSchema([{ name: 'Veelgestelde vragen', path: ROUTES.faq }]),
          getFaqSchema(FAQ_CATEGORIES),
        ]}
      />

      <PageHero
        eyebrow="Veelgestelde vragen"
        title="Antwoorden op wat ondernemers willen weten"
        description="Klaarstaan met duidelijke antwoorden. Staat uw vraag er niet bij? Neem gerust contact op."
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-3xl">
          <div className="flex flex-col gap-12">
            {FAQ_CATEGORIES.map((group, groupIndex) => (
              <div key={group.category}>
                <h2 className="text-lg font-semibold text-primary">{group.category}</h2>
                <div className="mt-5 flex flex-col divide-y divide-border border-t border-border">
                  {group.items.map((item, itemIndex) => (
                    <Reveal key={item.question} delay={(groupIndex * 3 + itemIndex) * 40} className="py-5">
                      <h3 className="text-base font-semibold text-primary">{item.question}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.answer}</p>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <ClosingCta />
    </>
  )
}
