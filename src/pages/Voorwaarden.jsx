import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { LegalSection } from '../components/legal/LegalSection'
import { COMPANY } from '../data/company'
import { VOORWAARDEN_CONTENT } from '../data/legalContent'

export default function Voorwaarden() {
  return (
    <>
      <Seo title="Algemene voorwaarden" description="De algemene voorwaarden van SMV Advies." />

      <PageHero eyebrow="Juridisch" title="Algemene voorwaarden" />

      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          {VOORWAARDEN_CONTENT.intro ? (
            <p className="mt-8 text-sm leading-relaxed text-foreground-muted">{VOORWAARDEN_CONTENT.intro}</p>
          ) : null}

          <div className="mt-8">
            {VOORWAARDEN_CONTENT.sections.map((section) => (
              <LegalSection key={section.title} title={section.title} content={section.content} />
            ))}
          </div>

          <p className="mt-10 text-sm text-foreground-muted">
            Vragen over de voorwaarden? Neem contact op via{' '}
            <a href={`mailto:${COMPANY.email}`} className="text-primary underline hover:text-secondary">
              {COMPANY.email}
            </a>
            .
          </p>
        </Container>
      </Section>
    </>
  )
}
