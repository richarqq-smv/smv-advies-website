/**
 * Pure offerte-logica: bedragberekening, prijstier-bepaling en de
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

/**
 * Toegestane statusovergangen (werkfase Fase 2 — offerte-lifecycle). Moet
 * exact overeenkomen met `toegestane_overgangen` in
 * bewaak_offerte_integriteit() (supabase/migrations/0005_offertes.sql) —
 * hier als pure, testbare data zodat zowel de UI (welke knoppen tonen) als
 * api.js (welke aanroep proberen) uit precies dezelfde bron putten. De
 * database blijft de enige echte handhaving: een overgang die hier per
 * ongeluk te ruim zou zijn, wordt alsnog door de trigger geweigerd (zie
 * magOvergangNaar() hieronder, en updateOfferteStatus() in api.js).
 */
export const OFFERTE_TOEGESTANE_OVERGANGEN = {
  concept: ['verstuurd', 'geannuleerd'],
  verstuurd: ['geaccepteerd', 'afgewezen', 'geannuleerd'],
}

/** Of een statusovergang volgens OFFERTE_TOEGESTANE_OVERGANGEN geldig is — pure afgeleide, geen eigen bron van waarheid. */
export function magOvergangNaar(huidigeStatus, nieuweStatus) {
  return (OFFERTE_TOEGESTANE_OVERGANGEN[huidigeStatus] ?? []).includes(nieuweStatus)
}

/**
 * Gold-scope-signaal (werkfase Fase 11 — eenvoudige interne scopebewaking,
 * geen projectmanagement/urenregistratie/CRM). Gold's scope is en blijft
 * vaste tekst in packages.js (features/scopeNote) — dit voegt geen nieuwe
 * databasevelden toe en telt niets bij aan een teller. Het signaleert
 * uitsluitend het feitelijke moment waarop scope-overschrijding al zichtbaar
 * wordt in bestaande data: een Gold-offerte met meerwerkregels. Volgens
 * packages.js' eigen `scopeNote` IS meerwerk precies het mechanisme voor
 * werk buiten de afgesproken Gold-scope — dit maakt dat moment alleen
 * zichtbaar voor Richard, in plaats van dat het stilzwijgend gebeurt.
 * Geen oordeel of het terecht is: alleen een feitelijke constatering.
 */
export function beoordeelGoldMeerwerk({ pakketId, meerwerk = [] }) {
  if (pakketId !== 'gold' || meerwerk.length === 0) {
    return { relevant: false, aantalRegels: 0, totaal: 0 }
  }
  const totaal = rond2(meerwerk.reduce((som, regel) => som + (regel.totaal ?? 0), 0))
  return { relevant: true, aantalRegels: meerwerk.length, totaal }
}

/** Standaard meerwerktarief (Fase 6, commerciële waarheid) — vult alleen een nieuwe meerwerkregel voor, de adviseur kan dit per regel altijd overschrijven. */
export const MEERWERK_UURTARIEF = 95

/** Vaste tekst uit SMV-Advies Offerte.docx — geen dynamisch profielveld (er is één adviseur). */
export const OPGESTELD_DOOR_NAAM = 'Richard Schipper'

export function euro(n) {
  return '€ ' + (n ?? 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Bepaalt de van toepassing zijnde prijstier uit `pakket.priceTiers` (zie
 * packages.js), op basis van de vloeroppervlakte van het pand op dit
 * moment. Tiers zijn niet-overlappend en dekken elk oppervlak: de eerste
 * tier waarvan `maxOppervlak` de oppervlakte niet overschrijdt wint (dus
 * exact op de grens, bijv. 1000 m², hoort bij de tier mét die grens — "tot
 * 1.000 m²"), en een oppervlakte die boven de hoogste vaste grens uitkomt
 * — of onbekend is (`null`/`undefined`) — valt terug op de laatste tier
 * ('op aanvraag', met `prijs: null`): daarvoor stelt de adviseur zelf een
 * bedrag vast, er wordt nooit een bedrag verzonnen.
 */
export function bepaalPrijsTier(pakket, oppervlakte) {
  const tiers = pakket?.priceTiers
  if (!Array.isArray(tiers) || tiers.length === 0) return null
  const opAanvraagTier = tiers[tiers.length - 1]
  if (oppervlakte == null) return opAanvraagTier
  return tiers.find((tier) => tier.maxOppervlak != null && oppervlakte <= tier.maxOppervlak) ?? opAanvraagTier
}

/**
 * Of een ingevuld offertebedrag afwijkt van de standaardprijs van de
 * gekozen tier — puur informatief (Richard kan altijd bewust afwijken),
 * nooit een harde blokkade. Geeft `false` als er geen vaste standaardprijs
 * is (tier ontbreekt, of tier.prijs is `null` — "op aanvraag": daar bestaat
 * per definitie geen standaardprijs om van af te wijken) of als er nog
 * geen bedrag is ingevuld.
 */
export function bedragWijktAfVanStandaardprijs(tier, bedrag) {
  if (!tier || tier.prijs == null || bedrag == null) return false
  return bedrag !== tier.prijs
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
export function bouwOfferteSnapshot({ klant, contactpersoon, pand, pakket, tier, bedrag, meerwerk, financieel, voorwaardenVersie }) {
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
      // Kopie, geen referentie naar het levende tier-object uit
      // packages.js — legt vast welke tier gold, bij welke oppervlakte-
      // grens, en tegen welke standaardprijs, onafhankelijk van eventuele
      // latere prijswijzigingen in packages.js.
      prijstier: tier ? { label: tier.label, maxOppervlak: tier.maxOppervlak, standaardprijs: tier.prijs } : null,
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
