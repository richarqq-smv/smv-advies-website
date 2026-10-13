import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'

/**
 * SEO/performance-ronde (2026-10-13): de hero-tekst en -foto stonden
 * voorheen in <Reveal>, dezelfde scroll-in-view-fade die de rest van de
 * site gebruikt voor content die pas bij scrollen in beeld komt. De hero
 * staat echter altijd al in de eerste viewport bij het laden van de
 * pagina — Reveal start met opacity-0 en wordt pas na een
 * IntersectionObserver-tick + 700ms transitie zichtbaar, wat op elke
 * page load zowel de hoofdkop als de hero-foto (de Largest Contentful
 * Paint van de homepage) nodeloos zo'n 800ms vertraagt. Gewone, direct
 * zichtbare elementen lossen dat op zonder functionaliteit te verliezen
 * — Reveal blijft ongewijzigd voor al het overige content verderop op de
 * pagina, dat wél pas bij scrollen in beeld komt.
 */
export function Hero() {
  return (
    <section className="pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Onafhankelijk verduurzamingsadvies · Hoeksche Waard
          </p>
          <h1 className="max-w-[18ch] text-4xl text-primary sm:text-5xl lg:text-6xl">
            Verduurzaam uw bedrijfspand zonder onnodig te investeren.
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-foreground-muted">
            Eerst weten wat verstandig is, daarna pas investeren. Wij kijken naar energie,
            onderhoud en het juiste investeringsmoment — zodat u weet wat nu moet, wat kan
            wachten, en wat eerst onderzocht moet worden.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={ROUTES.contact}>Bespreek uw bedrijfspand</Button>
            <Button to={ROUTES.energieIndicatie} variant="outline">
              Start de gratis energie-indicatie
            </Button>
          </div>
          <p className="mt-5 text-sm font-medium text-foreground-muted">
            Onafhankelijk advies. Geen verkoop van installaties.
          </p>
        </div>

        <div className="lg:col-span-5">
          <img
            src="/hero-bedrijfspand.jpg"
            alt="Luchtfoto van een bedrijfspand in een bedrijventerrein in de Hoeksche Waard"
            width="912"
            height="1136"
            fetchPriority="high"
            className="aspect-[4/3] w-full rounded-xl border border-border object-cover object-center lg:aspect-[3/4]"
          />
        </div>
      </Container>
    </section>
  )
}
