import { useEffect, useRef } from 'react'

/**
 * Houdt een ref bij die altijd de laatst gerenderde waarde van `value`
 * bevat — gebruikt door de opnameflow's autosave-debounce (zie
 * lib/klantOmgeving/debounce.js) om een callback-prop (bijv.
 * onWaarnemingChange) te kunnen aanroepen vanuit een debounced closure die
 * maar één keer wordt aangemaakt, zonder dat een nieuwe callback-identity
 * per render de debounced functie zelf opnieuw zou aanmaken (en zo een al
 * lopende debounce-timer zou laten vallen).
 */
export function useLatestRef(value) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
