/**
 * Generieke debounce-utility voor autosave-velden (mobiele-opnameronde).
 * Puur, geen React — testbaar met node:test + fake timers. `cancel()`
 * annuleert een geplande aanroep zonder hem uit te voeren (nodig bij
 * unmount/stap-navigatie, zie useAutosaveVeld).
 */
export function debounce(fn, wait) {
  let timer = null
  function debounced(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, wait)
  }
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }
  debounced.flush = (...args) => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    fn(...args)
  }
  return debounced
}
