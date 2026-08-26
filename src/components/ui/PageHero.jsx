import { Container } from './Container'
import { Reveal } from './Reveal'

/**
 * Compact top-of-page introduction for content pages (as opposed to the
 * homepage's full Hero). Optional eyebrow, H1, short description.
 */
export function PageHero({ eyebrow, title, description }) {
  return (
    <section className="pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-20">
      <Container className="max-w-2xl">
        <Reveal>
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>
          ) : null}
          <h1 className="text-4xl text-primary sm:text-5xl">{title}</h1>
          {description ? (
            <p className="mt-4 text-lg leading-relaxed text-foreground-muted">{description}</p>
          ) : null}
        </Reveal>
      </Container>
    </section>
  )
}
