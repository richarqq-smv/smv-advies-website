import { Seo } from '../components/seo/Seo'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'

export default function NotFound() {
  return (
    <>
      <Seo title="Pagina niet gevonden" description="Deze pagina bestaat niet of is verplaatst." noindex />
      <Section className="flex min-h-[60vh] items-center">
        <Container className="max-w-xl text-center">
          <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">404</p>
          <h1 className="mt-3 text-4xl text-primary sm:text-5xl">Pagina niet gevonden</h1>
          <p className="mt-4 text-base leading-relaxed text-foreground-muted">
            De pagina die u zoekt bestaat niet of is verplaatst. Ga terug naar de homepage of
            bekijk de pakketten.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to={ROUTES.home}>Naar de homepage</Button>
            <Button to={ROUTES.pakketten} variant="outline">
              Bekijk de pakketten
            </Button>
          </div>

          <nav aria-label="Suggesties" className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Button to={ROUTES.energieIndicatie} variant="ghost" size="sm">
              Gratis energie-indicatie
            </Button>
            <Button to={ROUTES.faq} variant="ghost" size="sm">
              Veelgestelde vragen
            </Button>
            <Button to={ROUTES.contact} variant="ghost" size="sm">
              Contact
            </Button>
          </nav>
        </Container>
      </Section>
    </>
  )
}
