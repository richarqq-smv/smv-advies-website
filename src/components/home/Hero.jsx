import { Container } from '../ui/Container'
import { Button } from '../ui/Button'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { Reveal } from '../ui/Reveal'
import { ROUTES } from '../../lib/routes'

export function Hero() {
  return (
    <section className="pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <Reveal as="div" className="lg:col-span-7">
          <p className="mb-4 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Onafhankelijk verduurzamingsadvies · Hoeksche Waard
          </p>
          <h1 className="max-w-[16ch] text-4xl text-primary sm:text-5xl lg:text-6xl">
            Uw bedrijfspand, toekomstbestendig.
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-foreground-muted">
            Onafhankelijk advies voor uw bedrijfspand, zonder belang bij installateurs, in een
            rapport dat u direct kunt gebruiken.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={ROUTES.energieIndicatie}>Doe de energie-indicatie</Button>
            <Button href="#pakketten" variant="outline">
              Bekijk onze pakketten
            </Button>
          </div>
        </Reveal>

        <Reveal as="div" delay={120} className="lg:col-span-5">
          {/* Real photography still needed here — see docs/COMMERCIAL-REVIEW.md for the shot list. */}
          <ImagePlaceholder
            label="Bedrijfspand in de Hoeksche Waard"
            aspect="aspect-[4/3] lg:aspect-[3/4]"
          />
        </Reveal>
      </Container>
    </section>
  )
}
