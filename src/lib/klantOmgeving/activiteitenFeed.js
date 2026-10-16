/**
 * Puur logica voor het dashboard-meldingenblokje (ronde 2026-10-16):
 * zet ruwe Supabase-rijen (klant_koppelcodes/contactpersonen/documenten/
 * klant_pand_relaties/mail_log) om naar één platte, gesorteerde lijst met
 * leesbare tekst. Geen database-toegang hier — dat gebeurt in api.js
 * (adminListKlantActiviteitRuw/adminListMailLog), precies zoals
 * vandaagOverzicht.js/RecenteActiviteit.jsx-paar elders al doet.
 *
 * Elke *Activiteiten()-functie hieronder leest uitsluitend kolommen die al
 * via de bestaande, admin-only RLS (is_admin()) bereikbaar zijn — geen
 * nieuwe autorisatielogica, alleen presentatie van al toegestane data.
 */

const MAIL_TYPE_LABELS = {
  contact: 'Contactformulier',
  'energie-lead': 'Energie-indicatie (intern)',
  'energie-confirm': 'Energie-indicatie (bevestiging)',
  mjop: 'MJOP-analyse',
}

function klantNaam(klanten) {
  return klanten?.naam || klanten?.bedrijfsnaam || 'Onbekende klant'
}

/** klant_koppelcodes-rijen met `gebruikt_op` gezet — een succesvol verzilverde koppelcode. */
export function koppelcodeActiviteiten(koppelcodes = []) {
  return koppelcodes
    .filter((k) => k.gebruikt_op)
    .map((k) => ({
      id: `koppelcode-${k.koppelcode_id}`,
      type: 'koppelcode',
      tekst: `${klantNaam(k.klanten)} heeft een koppelcode verzilverd`,
      tijdstip: k.gebruikt_op,
    }))
}

/** contactpersonen-rijen met een gekoppeld account — zelfregistratie of koppelcode-koppeling, beide resulteren hierin. */
export function accountKoppelingActiviteiten(contactpersonen = []) {
  return contactpersonen
    .filter((c) => c.account_id)
    .map((c) => ({
      id: `account-${c.contactpersoon_id}`,
      type: 'account',
      tekst: `${c.naam || klantNaam(c.klanten)} heeft een account gekoppeld bij ${klantNaam(c.klanten)}`,
      tijdstip: c.created_at,
    }))
}

/**
 * documenten-rijen waarvan `geupload_door` overeenkomt met een gekoppeld
 * klant-account (niet een admin-upload) — `klantAccountIds` komt uit
 * dezelfde contactpersonen-rijen als accountKoppelingActiviteiten()
 * hierboven, zodat geen aparte admin-ledenlijst nodig is (user_roles is
 * sowieso niet rechtstreeks leesbaar, zie SECURITY_MODEL.md).
 */
export function documentActiviteiten(documenten = [], klantAccountIds = []) {
  const ids = new Set(klantAccountIds)
  return documenten
    .filter((d) => d.geupload_door && ids.has(d.geupload_door) && !d.verwijderd_op)
    .map((d) => ({
      id: `document-${d.document_id}`,
      type: 'document',
      tekst: `${klantNaam(d.klanten)} heeft een document geüpload: ${d.bestandsnaam}`,
      tijdstip: d.created_at,
    }))
}

/** klant_pand_relaties-rijen waarvan het gekoppelde pand niet via de admin-intake is ontstaan (ontstaan_via 'intake'). */
export function pandActiviteiten(pandRelaties = []) {
  return pandRelaties
    .filter((r) => r.panden?.ontstaan_via !== 'intake')
    .map((r) => ({
      id: `pand-${r.relatie_id}`,
      type: 'pand',
      tekst: `${klantNaam(r.klanten)} heeft een pand toegevoegd${r.panden?.adres ? `: ${r.panden.adres}` : ''}`,
      tijdstip: r.aangemaakt_op,
    }))
}

/** mail_log-rijen (zie 0052_mail_log.sql) — zowel geslaagde als mislukte verzendpogingen. */
export function mailActiviteiten(mailLog = []) {
  return mailLog.map((m) => {
    const label = MAIL_TYPE_LABELS[m.type] ?? m.type
    return {
      id: `mail-${m.id}`,
      type: m.gelukt ? 'mail-gelukt' : 'mail-mislukt',
      tekst: m.gelukt ? `${label}-mail verstuurd` : `${label}-mail mislukt`,
      tijdstip: m.created_at,
    }
  })
}

/** Voegt alle categorieën samen, sorteert chronologisch aflopend en knipt af op `limiet`. */
export function mergeActiviteitenFeed(groepen = [], limiet = 15) {
  return groepen
    .flat()
    .filter((a) => a.tijdstip)
    .sort((a, b) => new Date(b.tijdstip) - new Date(a.tijdstip))
    .slice(0, limiet)
}

/**
 * Nederlandse datum+tijd-weergave voor een timestamptz-string
 * ('16-10-2026 14:32'). Los van formatDatumNl in offerte.js, die alleen
 * een `date`-kolom (geen tijdcomponent) formatteert.
 */
export function formatTijdstipNl(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const datum = d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const tijd = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  return `${datum} ${tijd}`
}
