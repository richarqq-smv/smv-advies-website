import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { LegalSection } from '../components/legal/LegalSection'
import { COMPANY } from '../data/company'
import { PRIVACY_CONTENT } from '../data/legalContent'
import { COOKIE_SETTINGS_EVENT } from '../lib/consent'

export default function Privacy() {
  return (
    <>
      <Seo title="Privacyverklaring" description="Hoe SMV Advies omgaat met uw persoonsgegevens." />

      <PageHero eyebrow="Juridisch" title="Privacyverklaring" />

      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          {PRIVACY_CONTENT.intro ? (
            <p className="mt-8 text-sm leading-relaxed text-foreground-muted">{PRIVACY_CONTENT.intro}</p>
          ) : null}

          <div className="mt-8">
            {PRIVACY_CONTENT.sections.map((section) => (
              <LegalSection key={section.title} title={section.title} content={section.content} />
            ))}
          </div>

          {/* Verplicht gevolg van cookiebeleid-tekst hierboven: toestemming
              moet ook ná de eerste keuze gewijzigd/ingetrokken kunnen
              worden (AVG), niet alleen via browserinstellingen. Herstart
              de banner via hetzelfde event dat CookieBanner.jsx beluistert,
              i.p.v. een paginareload. */}
          <div className="mt-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
            >
              Cookie-instellingen wijzigen
            </Button>
          </div>

          <p className="mt-10 text-sm text-foreground-muted">
            Vragen over privacy? Neem contact op via{' '}
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
