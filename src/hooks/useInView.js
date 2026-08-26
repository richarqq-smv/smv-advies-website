import { useEffect, useRef, useState } from 'react'

const SUPPORTS_INTERSECTION_OBSERVER = typeof IntersectionObserver !== 'undefined'

/**
 * Tracks whether an element has scrolled into view, once. Backs the
 * Reveal component; deliberately not using a scroll listener (see
 * IntersectionObserver, which batches off the main thread).
 */
export function useInView({ threshold = 0.15, rootMargin = '0px 0px -80px 0px' } = {}) {
  const ref = useRef(null)
  // Without IntersectionObserver support, initialize as already visible
  // rather than leaving content permanently hidden.
  const [inView, setInView] = useState(!SUPPORTS_INTERSECTION_OBSERVER)

  useEffect(() => {
    const node = ref.current
    if (!node || !SUPPORTS_INTERSECTION_OBSERVER) return

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
