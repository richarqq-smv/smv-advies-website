import { EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { COMPANY } from '../data/company'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

export default function Contact() {
  return (
    <>
      <Seo
        title="Contact"
        description="Neem rechtstreeks contact op met SMV Advies — per e-mail of telefoon."
        structuredData={[getBreadcrumbSchema([{ name: 'Contact', path: ROUTES.contact }])]}
      />
      <Section>
        <Container className="max-w-2xl text-center">
          <h1 className="text-4xl text-primary sm:text-5xl">Laten we uw pand toekomstbestendig maken</h1>
          <p className="mx-auto mt-4 max-w-[50ch] text-base leading-relaxed text-foreground-muted">
            Een vraag, een aanvraag of gewoon sparren? {COMPANY.responseTime}.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href={`mailto:${COMPANY.contactEmail}`} variant="primary">
              <EnvelopeSimple size={18} weight="bold" />
              {COMPANY.contactEmail}
            </Button>
            <Button href={COMPANY.phoneHref} variant="secondary">
              <Phone size={18} weight="bold" />
              {COMPANY.phone}
            </Button>
          </div>

          <div className="mx-auto mt-12 max-w-sm rounded-lg bg-muted p-6 text-left">
            <h2 className="text-lg font-semibold text-primary">Contactgegevens</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <EnvelopeSimple size={18} className="mt-0.5 shrink-0 text-foreground-muted" />
                <div>
                  <dt className="sr-only">E-mail</dt>
                  <dd>
                    <a href={`mailto:${COMPANY.contactEmail}`} className="text-primary hover:text-secondary">
                      {COMPANY.contactEmail}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone size={18} className="mt-0.5 shrink-0 text-foreground-muted" />
                <div>
                  <dt className="sr-only">Telefoon</dt>
                  <dd>
                    <a href={COMPANY.phoneHref} className="text-primary hover:text-secondary">
                      {COMPANY.phone}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin size={18} className="mt-0.5 shrink-0 text-foreground-muted" />
                <div>
                  <dt className="sr-only">Locatie</dt>
                  <dd className="text-primary">
                    {COMPANY.address.street}, {COMPANY.address.postalCode} {COMPANY.address.city}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </Container>
      </Section>
    </>
  )
}
