/**
 * Bewaart een ingevulde koppelcode (+ naam/telefoon) tussen het moment dat
 * een nieuwe klant 'm invult op /registreren?koppelcode=1 en het moment dat
 * koppel_klant_met_code() daadwerkelijk aangeroepen kan worden — dat kan
 * pas na een geldige sessie (supabase.auth.signUp() vereist eerst
 * e-mailbevestiging, zie 0048_klant_koppelcode.sql: "Niet ingelogd."), dus
 * nooit binnen dezelfde paginalading. localStorage overleeft die e-mail-
 * bevestigingsredirect (een gewone volledige page load, geen SPA-navigatie)
 * — Account.jsx leest dit uit zodra de klant voor het eerst inlogt en past
 * koppelKlantMetCode() dan automatisch toe, zie laadAlles() daar.
 *
 * Zelfde try/catch-patroon als lib/consent.js: localStorage kan ontbreken/
 * gooien (privénavigatie) — dan werkt alleen de automatische stap niet, de
 * klant kan de koppelcode op /account nog steeds gewoon handmatig invullen.
 */
const STORAGE_KEY = 'smv-pending-koppelcode'

export function bewaarPendingKoppelcode({ code, naam, email = null, telefoon = null }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, naam, email, telefoon }))
  } catch {
    // Zie bestandscommentaar hierboven.
  }
}

/** Geeft `null` als er niets (geldigs) is opgeslagen, anders `{ code, naam, email, telefoon }`. */
export function leesPendingKoppelcode() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.code !== 'string' || typeof parsed.naam !== 'string' || !parsed.code.trim() || !parsed.naam.trim()) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function wisPendingKoppelcode() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Zie bestandscommentaar hierboven.
  }
}
