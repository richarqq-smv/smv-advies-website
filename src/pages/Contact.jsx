import { useSearchParams } from 'react-router-dom'
import { EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ContactForm } from '../components/contact/ContactForm'
import { COMPANY } from '../data/company'
import { PACKAGES } from '../data/packages'
import { getBreadcrumbSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'

// `pakket` in de query string komt uitsluitend voor als publieke pakketnaam
// (basis/premium/gold, hetzelfde id als in data/packages.js) — nooit een
// interne id. We slaan de ruwe queryparameter nergens op en tonen hem nooit
// letterlijk: alleen een exacte match met PACKAGES levert een naam op die we
// tonen, dus een onbekende/gemanipuleerde waarde toont simpelweg niets (geen
// XSS-oppervlak, geen foutmelding nodig).
function usePakketContext() {
  const [searchParams] = useSearchParams()
  const pakketId = searchParams.get('pakket')
  return PACKAGES.find((pkg) => pkg.id === pakketId) ?? null
}

export default function Contact() {
  const pakket = usePakketContext()
  const mailtoHref = pakket
    ? `mailto:${COMPANY.contactEmail}?subject=${encodeURIComponent(`Aanvraag ${pakket.name} Pakket`)}`
    : `mailto:${COMPANY.contactEmail}`

  return (
    <>
      <Seo
        title="Contact"
        description="Neem contact op met SMV Advies: bel, mail, of schrijf uw vraag op via het contactformulier."
        structuredData={[getBreadcrumbSchema([{ name: 'Contact', path: ROUTES.contact }])]}
      />
      <Section>
        <Container className="max-w-2xl text-center">
          {pakket ? (
            <p className="mx-auto mb-4 inline-flex items-center rounded-full bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent">
              Uw aanvraag: {pakket.name} Pakket
            </p>
          ) : null}
          <h1 className="text-4xl text-primary sm:text-5xl">Heeft u een vraag over uw bedrijfspand?</h1>
          <p className="mx-auto mt-4 max-w-[50ch] text-base leading-relaxed text-foreground-muted">
            Een vraag, een aanvraag of gewoon sparren? {COMPANY.responseTime}.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href={mailtoHref} variant="primary">
              <EnvelopeSimple size={18} weight="bold" />
              {COMPANY.contactEmail}
            </Button>
            <Button href={COMPANY.phoneHref} variant="secondary">
              <Phone size={18} weight="bold" />
              {COMPANY.phone}
            </Button>
          </div>

          {/*
            E-mail en telefoon staan al als de twee primaire knoppen hierboven —
            dit blok herhaalt ze bewust niet nogmaals, alleen het adres staat
            nergens anders op de pagina.
          */}
          <p className="mx-auto mt-10 flex max-w-sm items-start justify-center gap-2 text-sm text-foreground-muted">
            <MapPin size={18} weight="light" className="mt-0.5 shrink-0" />
            <span>
              {COMPANY.address.street}, {COMPANY.address.postalCode} {COMPANY.address.city}
            </span>
          </p>
        </Container>
      </Section>

      {/* Geen noTopPadding: deze sectie heeft een eigen (grijze) achtergrond,
          dus zonder bovenpadding plakte de formulierkop direct tegen de
          rand van het grijze vlak. */}
      <Section tone="muted">
        <Container className="max-w-xl">
          <h2 className="text-xl font-semibold text-primary">Liever uw vraag opschrijven dan bellen?</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            Kan ook. Vul het formulier in, dan reageren we er per e-mail op: {COMPANY.responseTime.toLowerCase()}.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </Container>
      </Section>
    </>
  )
}
