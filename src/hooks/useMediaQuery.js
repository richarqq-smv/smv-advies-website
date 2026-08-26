import { useSyncExternalStore } from 'react'

function subscribe(query, callback) {
  const mediaQueryList = window.matchMedia(query)
  mediaQueryList.addEventListener('change', callback)
  return () => mediaQueryList.removeEventListener('change', callback)
}

/**
 * Tracks whether a CSS media query currently matches. Uses
 * useSyncExternalStore since matchMedia is an external browser API, not
 * React state, so this avoids a setState-in-effect render cascade.
 * Example: const isDesktop = useMediaQuery('(min-width: 1024px)')
 */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => window.matchMedia(query).matches,
    () => false,
  )
}
