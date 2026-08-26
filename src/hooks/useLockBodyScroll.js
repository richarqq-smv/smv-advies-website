import { useEffect } from 'react'

/**
 * Locks body scroll while `locked` is true. Used by the mobile nav drawer
 * so the page behind it doesn't scroll while it's open.
 */
export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [locked])
}
