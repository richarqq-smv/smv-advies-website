import { useEffect, useRef, useState } from 'react'

const SUPPORTS_INTERSECTION_OBSERVER = typeof IntersectionObserver !== 'undefined'

/**
 * Tracks whether an element has scrolled into view, once. Backs the
 * Reveal component; deliberately not using a scroll listener (see
 * IntersectionObserver, which batches off the main thread).
 *
 * Pro-design-ronde (2026-10-21): begint nu als zichtbaar (`true`) en
 * verbergt een element pas ná mount, en alleen als het op dat moment
 * nog onder de viewport staat. Voorheen startte élk Reveal-blok als
 * `inView: false`, ook in de geprerenderde HTML — dus zonder (of vóór)
 * JavaScript, voor content die bij een anchor-link/terugnavigatie al in
 * beeld staat, en in full-page screenshots bleef de inhoud onzichtbaar.
 * Content die al in (of boven) de viewport staat animeert nu niet meer
 * en is direct leesbaar; alleen wat er nog onder staat krijgt de fade.
 */
export function useInView({ threshold = 0.15, rootMargin = '0px 0px -80px 0px' } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const node = ref.current
    if (!node || !SUPPORTS_INTERSECTION_OBSERVER) return
    if (node.getBoundingClientRect().top < window.innerHeight) return

    setInView(false)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(node)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, inView]
}
