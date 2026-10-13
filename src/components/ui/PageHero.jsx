import { Container } from './Container'

/**
 * Compact top-of-page introduction for content pages (as opposed to the
 * homepage's full Hero). Optional eyebrow, H1, short description.
 *
 * SEO/performance-ronde (2026-10-13): no longer wrapped in <Reveal> — this
 * section is, by definition, always the first thing rendered at the top
 * of every content page, so it's always already in the initial viewport.
 * Reveal (scroll-in-view fade) starts at opacity-0 and only becomes
 * visible after an IntersectionObserver tick + a 700ms transition, which
 * on this component meant the H1 of nearly every page on the site (title/
 * LCP text) was needlessly invisible for ~800ms on every single page
 * load. Reveal itself is unchanged and still used correctly for content
 * further down each page that only comes into view on scroll.
 */
export function PageHero({ eyebrow, title, description }) {
  return (
    <section className="pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-20">
      <Container className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-4xl text-primary sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 text-lg leading-relaxed text-foreground-muted">{description}</p>
        ) : null}
      </Container>
    </section>
  )
}
