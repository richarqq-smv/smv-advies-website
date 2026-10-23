import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'
import { trackEvent } from '../../lib/analytics'

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
/*
 * Anti-slop-ronde (2026-10-21, taste-skill inspect): de kop staat nu over
 * de volle breedte op displaygrootte (twee regels op desktop i.p.v. drie in
 * een 7/12-kolom), het gouden hoofdletterlabel erboven is weg (de informatie
 * — onafhankelijk, Hoeksche Waard — staat nu in gewone zinsopbouw onder de
 * knoppen) en de foto is het dominante beeld van het eerste scherm (was 21%
 * van de viewport, achter een rand en ronde hoeken).
 */
export function Hero() {
  return (
    <section className="pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28">
      <Container>
        <h1 className="text-4xl leading-[1.05] tracking-[-0.025em] text-primary sm:text-5xl lg:text-[5rem]">
          Verduurzaam uw bedrijfspand zonder onnodig te investeren.
        </h1>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="max-w-[46ch] text-lg leading-relaxed text-foreground sm:text-xl">
              Eerst weten wat verstandig is, daarna pas investeren. Wij kijken naar energie,
              onderhoud en het juiste investeringsmoment. Zo weet u wat nu moet, wat kan
              wachten en wat eerst onderzocht moet worden.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to={ROUTES.contact} onClick={() => trackEvent('cta_click', { cta: 'contact', location: 'hero' })}>
                Bespreek uw bedrijfspand
              </Button>
              <Button
                to={ROUTES.energieIndicatie}
                variant="outline"
                onClick={() => trackEvent('cta_click', { cta: 'energie_indicatie', location: 'hero' })}
              >
                Start de gratis energie-indicatie
              </Button>
            </div>
            <p className="mt-6 max-w-[46ch] text-base text-foreground-muted">
              Onafhankelijk verduurzamingsadvies in de Hoeksche Waard. Geen verkoop van installaties.
            </p>
          </div>

          <div className="lg:col-span-7">
            <img
              src="/hero-bedrijfspand.jpg"
              alt="Luchtfoto van een bedrijfspand in een bedrijventerrein in de Hoeksche Waard"
              width="912"
              height="1136"
              fetchPriority="high"
              className="aspect-[4/3] w-full object-cover object-center lg:aspect-[16/11]"
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
