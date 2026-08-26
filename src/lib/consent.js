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
