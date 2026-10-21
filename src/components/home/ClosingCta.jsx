import { Section } from '../ui/Section'
import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { ROUTES } from '../../lib/routes'
import { COMPANY } from '../../data/company'
import { trackEvent } from '../../lib/analytics'

/**
 * `heading`/`description` zijn optioneel en vervangen alleen de tekst —
 * de twee knoppen (en hun routes) blijven overal hetzelfde, dit zijn en
 * blijven de twee centrale instappunten van de site. Reden voor de props:
 * dit component stond tot de websiteoptimalisatieronde (2026-10-02)
 * woordelijk identiek op 6 pagina's (Home/Over/Werkwijze/Werkgebied/
 * Cases/FAQ) — dezelfde kop, dezelfde zin, overal. Elke pagina geeft nu
 * een eigen, bij de context passende variant mee; wie geen props
 * doorgeeft (zoals Home, waar dit de allereerste CTA van de site is)
 * krijgt gewoon de oorspronkelijke tekst.
 */
export function ClosingCta({ heading = 'Klaar voor de eerste stap?', description }) {
  const tekst = description ?? (
    <>
      Bespreek vrijblijvend uw bedrijfspand, of doe eerst de gratis energie-indicatie. {COMPANY.responseTime}.
    </>
  )
  return (
    // bg-secondary (toonstap t.o.v. de navy footer eronder) — zie Footer.jsx.
    <Section tone="primary" className="bg-secondary">
      <Container>
        {/*
          lg: in plaats van sm: (was tot 2026-10-02 sm:) — bij een lange
          kop + de twee knoppen (`shrink-0`, samen > 500px breed) past een
          zij-aan-zij layout simpelweg niet meer vanaf 640px: de tekstkolom
          werd dan tot een paar tientallen pixels breed geperst en brak
          woorden middenin af. Onder 1024px blijft het daarom gestapeld —
          altijd veilig, ongeacht hoe lang `heading`/`description` zijn.
        */}
        <Reveal className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl text-white sm:text-4xl">{heading}</h2>
            <p className="mt-3 max-w-[50ch] text-lg text-white/85">{tekst}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button to={ROUTES.contact} onClick={() => trackEvent('cta_click', { cta: 'contact', location: 'closing_cta' })}>
              Bespreek uw bedrijfspand
            </Button>
            <Button
              to={ROUTES.energieIndicatie}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => trackEvent('cta_click', { cta: 'energie_indicatie', location: 'closing_cta' })}
            >
              Start de gratis energie-indicatie
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  )
}
