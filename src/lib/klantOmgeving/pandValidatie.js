/**
 * Pure validatie voor het pand-gedeelte van de nieuwe admin-aanmaakflow
 * (AdminDossiers.jsx → admin_maak_klant_pand_dossier()-RPC, UX-auditronde
 * 2026-10-09). Zelfde opzet als klantValidatie.js: geeft per veld een
 * foutmelding terug (leeg object = geldig). Enige echt verplichte veld is
 * `gebruikstype` (bepaalt zakelijk/niet-zakelijk voor de rest van de
 * applicatie, zie isZakelijkPand()/ZAKELIJKE_GEBRUIKSTYPES) — de overige
 * velden zijn overal in de bestaande architectuur al optioneel ("een leeg
 * veld betekent niet bekend, nooit een blokkade", zie lib/dossier/pand.js).
 */
import { ZAKELIJKE_GEBRUIKSTYPES } from './afspraakBeschikbaarheid.js'

export { ZAKELIJKE_GEBRUIKSTYPES }

export function valideerNieuwPand({ gebruikstype, bouwjaar, vloeroppervlak, bouwlagen, gebruikers }) {
  const fouten = {}

  if (!gebruikstype?.trim()) {
    fouten.gebruikstype = 'Kies het gebruikstype van het pand.'
  } else if (!ZAKELIJKE_GEBRUIKSTYPES.includes(gebruikstype)) {
    fouten.gebruikstype = 'Onbekend gebruikstype.'
  }

  const huidigJaar = new Date().getFullYear()
  if (bouwjaar !== '' && bouwjaar != null) {
    const jaar = Number(bouwjaar)
    if (!Number.isInteger(jaar) || jaar < 1800 || jaar > huidigJaar + 2) {
      fouten.bouwjaar = `Vul een geldig bouwjaar in (1800–${huidigJaar + 2}).`
    }
  }

  if (vloeroppervlak !== '' && vloeroppervlak != null) {
    const waarde = Number(vloeroppervlak)
    if (!Number.isFinite(waarde) || waarde <= 0) {
      fouten.vloeroppervlak = 'Vul een geldig oppervlak in (groter dan 0).'
    }
  }

  if (bouwlagen !== '' && bouwlagen != null) {
    const waarde = Number(bouwlagen)
    if (!Number.isInteger(waarde) || waarde <= 0) {
      fouten.bouwlagen = 'Vul een geldig aantal bouwlagen in (groter dan 0).'
    }
  }

  if (gebruikers !== '' && gebruikers != null) {
    const waarde = Number(gebruikers)
    if (!Number.isInteger(waarde) || waarde < 0) {
      fouten.gebruikers = 'Vul een geldig aantal gebruikers in (0 of meer).'
    }
  }

  return fouten
}
