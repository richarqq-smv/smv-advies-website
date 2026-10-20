const STORAGE_KEY = 'smv-cookie-consent'

/** Returns 'accepted', 'declined', or null (no choice made yet). */
export function getStoredConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeConsent(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // localStorage unavailable (private browsing, disabled storage) — the
    // choice just won't be remembered; the banner reappears next visit.
  }
}

/** Verwijdert de opgeslagen keuze, zodat de volgende check weer null geeft. */
export function clearConsent() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Zie storeConsent hierboven — zonder werkende storage was er toch al
    // nooit een keuze opgeslagen om te verwijderen.
  }
}

/**
 * Naam van het window-event waarmee een pagina (zie Privacy.jsx) de
 * cookiebanner opnieuw laat verschijnen om de keuze te wijzigen of in te
 * trekken — CookieBanner.jsx luistert hierop. Eén centrale naam i.p.v. een
 * los magic string op twee plekken.
 */
export const COOKIE_SETTINGS_EVENT = 'smv-cookie-settings-reopen'

/**
 * Naam van het window-event waarmee CookieBanner.jsx meldt of de banner
 * zichtbaar is (detail: { visible: boolean }) — ContactFab.jsx luistert
 * hierop om zichzelf tijdelijk te verbergen zolang de bezoeker nog geen
 * cookiekeuze heeft gemaakt, zodat er nooit twee prominente floating
 * elementen tegelijk om aandacht vragen.
 */
export const COOKIE_BANNER_VISIBILITY_EVENT = 'smv-cookie-banner-visibility'
