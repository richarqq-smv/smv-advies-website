/**
 * Pure offerte-logica: bedragberekening, prijsrange-parsing en de
 * snapshotopbouw — geen I/O (zie api.js voor de Supabase-aanroep zelf).
 * Zelfde scheiding als lib/energieScan/calculations.js vs. de hook die
 * 'm aanroept.
 *
 * Btw-percentage komt uit één centrale constante (geen los, ongekoppeld
 * "21" her en der) — bij het opslaan van een offerte wordt de waarde
 * altijd expliciet in de kolom én de snapshot vastgelegd (zie
 * createOfferte() in api.js), zodat een latere wijziging van dit getal
 * een al opgeslagen offerte nooit met terugwerkende kracht raakt.
 */
export const BTW_PERCENTAGE = 21

/** Vaste tekst uit SMV-Advies Offerte.docx — geen dynamisch profielveld (er is één adviseur). */
export const OPGESTELD_DOOR_NAAM = 'Richard Schipper'

export function euro(n) {
  return '€ ' + (n ?? 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Leest de min/max-bandbreedte uit een bestaand `packages.js`-prijsveld
 * (bijv. "€ 1.495 - € 2.495") — geen tweede, los bijgehouden getallenpaar.
 * Nederlandse duizendtallen-punt wordt verwijderd vóór het parsen; deze
 * prijsvelden bevatten nooit centen.
 */
export function parsePrijsRange(priceText) {
  const matches = priceText?.match(/[\d.]+/g) ?? []
  const [min, max] = matches.map((m) => Number(m.replace(/\./g, '')))
  return { min: min ?? null, max: max ?? null }
}

/** Rond af op centen — voorkomt drijvende-kommafouten bij optellen van bedragen. */
export function rond2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** yyyy-mm-dd, geschikt voor een Postgres `date`-kolom. */
function naarDatumString(datum) {
  return datum.toISOString().slice(0, 10)
}

/** Standaard geldigheidsduur: 30 dagen na dagtekening (SMV-Advies Offerte.docx, "Geldigheidsduur offerte: 30 dagen na dagtekening"). */
export function standaardGeldigTot(vanaf = new Date()) {
  const datum = new Date(vanaf)
  datum.setDate(datum.getDate() + 30)
  return naarDatumString(datum)
}

/**
 * Nederlandse weergave (dd-mm-jjjj, met voorloopnullen) van een
 * `date`-kolomwaarde ('YYYY-MM-DD') — voor het formele offertedocument.
 * Expliciete 2-digit-opties: `toLocaleDateString('nl-NL')` zonder opties
 * laat de voorloopnul bij dag/maand weg (bijv. "25-9-2026").
 */
export function formatDatumNl(datumStr) {
  if (!datumStr) return ''
  return new Date(datumStr).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Berekent subtotaal/btw/totaal volgens de vaste formule:
 * subtotaal = pakketbedrag + som(meerwerk), btw = subtotaal * percentage,
 * totaal = subtotaal + btw. Elke tussenstap wordt afgerond op centen.
 */
export function berekenOfferteBedragen({ bedrag, meerwerk = [], btwPercentage = BTW_PERCENTAGE }) {
  const meerwerkTotaal = meerwerk.reduce((som, regel) => som + (regel.totaal ?? 0), 0)
  const subtotaal = rond2(bedrag + meerwerkTotaal)
  const btwBedrag = rond2((subtotaal * btwPercentage) / 100)
  const totaal = rond2(subtotaal + btwBedrag)
  return { subtotaal, btwBedrag, totaal }
}

/**
 * Bouwt de zelfstandige offerte-snapshot — bevat de daadwerkelijke waarden
 * op dit moment, nooit een verwijzing naar een id die later kan wijzigen.
 * `pand` komt bewust rechtstreeks van de actuele `panden`-rij (niet van
 * `dossiers.pand_snapshot`, dat bewust geen adres/omschrijving bevat —
 * zie DATABASE_ARCHITECTURE.md): een offerte heeft het volledige,
 * fysieke pandadres nodig, dat het Dossier-snapshot niet vastlegt.
 */
export function bouwOfferteSnapshot({ klant, contactpersoon, pand, pakket, bedrag, meerwerk, financieel, voorwaardenVersie }) {
  return {
    klant: {
      naam: klant.naam ?? null,
      bedrijfsnaam: klant.bedrijfsnaam ?? null,
      email: klant.email ?? null,
      telefoon: klant.telefoon ?? null,
    },
    contactpersoon: contactpersoon
      ? {
          naam: contactpersoon.naam ?? null,
          rol: contactpersoon.rol ?? null,
          email: contactpersoon.email ?? null,
          telefoon: contactpersoon.telefoon ?? null,
        }
      : null,
    pand: {
      omschrijving: pand.omschrijving ?? null,
      adres: pand.adres ?? null,
      postcode: pand.postcode ?? null,
      plaats: pand.plaats ?? null,
      gebruikstype: pand.gebruikstype ?? null,
      bouwjaar: pand.bouwjaar ?? null,
      vloeroppervlak: pand.vloeroppervlak ?? null,
    },
    pakket: {
      id: pakket.id,
      naam: pakket.name,
      subtitle: pakket.subtitle,
      prijsrange: pakket.price,
      omschrijving: pakket.description,
      // Kopie, geen referentie: pakket.features wijst naar de levende
      // packages.js-array. Zonder kopie zou een latere wijziging aan die
      // array (in tegenstelling tot de klant/pand-velden hierboven, die al
      // wel als losse waarden worden overgenomen) alsnog doorlekken in een
      // allang opgeslagen snapshot.
      features: Array.isArray(pakket.features) ? [...pakket.features] : [],
    },
    gekozen_bedrag: bedrag,
    meerwerk,
    financieel,
    voorwaarden: {
      versie: voorwaardenVersie,
    },
    opgesteld_door: {
      naam: OPGESTELD_DOOR_NAAM,
    },
  }
}
