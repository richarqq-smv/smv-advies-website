/**
 * Pure validatie voor de primaire klant/contactpersoon-aanmaakflow
 * (Account.jsx → registreerKlant() → registreer_klant()-RPC — de enige
 * plek waar een nieuwe Klant + Contactpersoon ontstaat, zie
 * supabase/migrations/0001_init.sql). Zelfde regel als
 * dossierHealthCheck.js al hanteert voor een bestaande contactpersoon
 * (controleerKlant: naam + (e-mail OF telefoon)) — hier vooraf afgedwongen
 * in plaats van pas achteraf gesignaleerd. E-mail en telefoon worden
 * bewust niet allebei verplicht: één bruikbaar contactkanaal is voldoende
 * en dekt de bestaande SMV-praktijk (soms alleen een vast nummer, soms
 * alleen e-mail) zonder onnodig te blokkeren.
 *
 * Geeft per veld een foutmelding terug (leeg object = geldig), zodat de UI
 * exact kan tonen welk veld ontbreekt via TextField's bestaande error-prop.
 */
export function valideerKlantRegistratie({ naam, email, telefoon }) {
  const fouten = {}

  if (!naam?.trim()) {
    fouten.naam = 'Vul eerst uw naam in.'
  }

  if (!email?.trim() && !telefoon?.trim()) {
    const melding = 'Vul een e-mailadres of telefoonnummer in, zodat we u kunnen bereiken.'
    fouten.email = melding
    fouten.telefoon = melding
  }

  return fouten
}

/**
 * Admin-variant (NieuweKlantModal.jsx, ronde 2026-10-16): alleen de naam is
 * verplicht. In tegenstelling tot valideerKlantRegistratie() hierboven
 * (de klant registreert zichzelf, en moet dus zelf bereikbaar zijn) maakt
 * een admin hier vaak alvast een Klant/Pand/Dossier aan vóórdat de klant
 * zelf iets heeft ingevuld — de klant levert e-mailadres/telefoonnummer
 * later zelf aan via de koppelcode-zelf-koppelflow (zie
 * admin_genereer_klant_koppelcode()/koppel_klant_met_code() in
 * 0048_klant_koppelcode.sql, en de /inloggen → /registreren?koppelcode=1-
 * route). Spiegelt admin_maak_klant_pand_dossier() in
 * 0051_admin_klant_contact_optioneel.sql, dat dezelfde verplichting al aan
 * de databasekant heeft laten vallen.
 */
export function valideerAdminNieuweKlant({ naam }) {
  const fouten = {}

  if (!naam?.trim()) {
    fouten.naam = 'Vul eerst de naam van de klant in.'
  }

  return fouten
}
