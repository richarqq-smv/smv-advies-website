/**
 * Pure content + logica voor de digitale opnameflow (0030_opname_checklist_
 * en_waarnemingen.sql) — geen database, geen React. Bron: de twee door de
 * klant aangeleverde documenten, "SMV Advies Checklist Locatiebezoek" en
 * "SMV Advies Opnameformulier Locatiebezoek" (2026-09-30). Tekst hieronder
 * is letterlijk overgenomen, niet herschreven of ingekort.
 *
 * OPNAME_CHECKLIST_ITEMS: de 38 ☐-items uit de Checklist, per fase in de
 * originele volgorde. item_code moet exact overeenkomen met de
 * check-constraint in de migratie.
 *
 * OPNAME_ONDERDELEN: de 17 vaste onderdelen uit het Opnameformulier
 * (dezelfde ONDERDEEL-codes als het fotonummeringssysteem in dat
 * formulier zelf gebruikt), in de originele volgorde. Elk onderdeel kan
 * 0..N waarnemingsregels hebben (het formulier zelf heeft 2 lege
 * voorbeeldregels per onderdeel).
 */

export const OPNAME_CHECKLIST_FASEN = [
  { fase: 'voorbereiding', label: 'Voorbereiding' },
  { fase: 'bouwkundig', label: 'Bouwkundig' },
  { fase: 'installaties', label: 'Installaties' },
  { fase: 'verbruik', label: 'Verbruik & documenten' },
  { fase: 'fotos', label: "Foto's" },
  { fase: 'afronding', label: 'Afronding' },
]

export const OPNAME_CHECKLIST_ITEMS = [
  // --- 1. Voorbereiding ---
  { item_code: 'voorbereiding_1', fase: 'voorbereiding', tekst: 'Afspraak bevestigd met contactpersoon en tijdstip doorgegeven' },
  { item_code: 'voorbereiding_2', fase: 'voorbereiding', tekst: 'Gevraagd om jaarafrekeningen gas/elektra (12–36 maanden) vooraf aan te leveren' },
  { item_code: 'voorbereiding_3', fase: 'voorbereiding', tekst: 'Gevraagd om bouw-/installatietekeningen indien aanwezig' },
  { item_code: 'voorbereiding_4', fase: 'voorbereiding', tekst: 'Camera / telefoon opgeladen, meetapparatuur (rolmaat, vocht- en warmtemeter) meegenomen' },
  { item_code: 'voorbereiding_5', fase: 'voorbereiding', tekst: 'Rapport-sjabloon en checklist bij de hand (digitaal of print)' },
  // --- 2. Bouwkundig ---
  { item_code: 'bouwkundig_1', fase: 'bouwkundig', tekst: 'Bouwjaar en eventuele verbouwingen/uitbreidingen genoteerd' },
  { item_code: 'bouwkundig_2', fase: 'bouwkundig', tekst: 'Dakopbouw en isolatie beoordeeld (type, geschatte dikte/Rc, staat dakbedekking)' },
  { item_code: 'bouwkundig_3', fase: 'bouwkundig', tekst: 'Gevelopbouw beoordeeld (spouw aanwezig? breedte? na-isolatie mogelijk?)' },
  { item_code: 'bouwkundig_4', fase: 'bouwkundig', tekst: 'Vloerconstructie beoordeeld (kruipruimte / op zand / kelder, vloerisolatie aanwezig?)' },
  { item_code: 'bouwkundig_5', fase: 'bouwkundig', tekst: 'Beglazing per gevel genoteerd (enkel / dubbel / HR++ / triple)' },
  { item_code: 'bouwkundig_6', fase: 'bouwkundig', tekst: 'Kozijnen beoordeeld op kierdichting en staat' },
  { item_code: 'bouwkundig_7', fase: 'bouwkundig', tekst: 'Deuren (overheaddeuren, personeelsingang) gecontroleerd op tocht en sluiting' },
  { item_code: 'bouwkundig_8', fase: 'bouwkundig', tekst: 'Bijzonderheden genoteerd (asbestverdachte materialen, vochtplekken, scheurvorming)' },
  // --- 3. Installaties ---
  { item_code: 'installaties_1', fase: 'installaties', tekst: 'Verwarmingssysteem: type, merk, bouwjaar, geschat rendement genoteerd' },
  { item_code: 'installaties_2', fase: 'installaties', tekst: 'Regeling verwarming gecontroleerd (vaste thermostaat / weersafhankelijk / per ruimte)' },
  { item_code: 'installaties_3', fase: 'installaties', tekst: 'Ventilatiesysteem beoordeeld (natuurlijk / mechanisch / WTW aanwezig?)' },
  { item_code: 'installaties_4', fase: 'installaties', tekst: 'Koeling geïnventariseerd, indien aanwezig' },
  { item_code: 'installaties_5', fase: 'installaties', tekst: 'Verlichting geïnventariseerd (type armaturen, sensoren aanwezig?)' },
  { item_code: 'installaties_6', fase: 'installaties', tekst: 'Warmwatervoorziening gecontroleerd (boiler, geiser, warmtepomp)' },
  { item_code: 'installaties_7', fase: 'installaties', tekst: 'Meterkast/hoofdaansluiting genoteerd (capaciteit, ruimte voor PV-omvormer)' },
  { item_code: 'installaties_8', fase: 'installaties', tekst: 'Eventuele zonnepanelen of andere opwek geïnventariseerd' },
  // --- 4. Verbruik & documenten ---
  { item_code: 'verbruik_1', fase: 'verbruik', tekst: 'Jaarafrekeningen gas en elektra ontvangen of alsnog opgevraagd' },
  { item_code: 'verbruik_2', fase: 'verbruik', tekst: 'Energielabel gecontroleerd: aanwezig, geldig, en zo ja welke klasse' },
  { item_code: 'verbruik_3', fase: 'verbruik', tekst: 'Eerdere energie-onderzoeken of rapporten opgevraagd, indien aanwezig' },
  { item_code: 'verbruik_4', fase: 'verbruik', tekst: 'Bezettingsgraad / bedrijfstijden van het pand genoteerd' },
  { item_code: 'verbruik_5', fase: 'verbruik', tekst: 'Bijzonder energie-intensieve processen of apparatuur genoteerd' },
  // --- 5. Foto's ---
  { item_code: 'fotos_1', fase: 'fotos', tekst: 'Buitenaanzicht pand (voor-, zij- en achtergevel)' },
  { item_code: 'fotos_2', fase: 'fotos', tekst: 'Dak (algemeen overzicht + close-up dakbedekking/opstand)' },
  { item_code: 'fotos_3', fase: 'fotos', tekst: 'Gevelopeningen en kozijnen (representatieve voorbeelden per gevel)' },
  { item_code: 'fotos_4', fase: 'fotos', tekst: 'Stookruimte / CV-installatie (incl. leesbaar typeplaatje)' },
  { item_code: 'fotos_5', fase: 'fotos', tekst: 'Meterkast / hoofdaansluiting' },
  { item_code: 'fotos_6', fase: 'fotos', tekst: 'Verlichting in hal, kantoor en overige ruimtes' },
  { item_code: 'fotos_7', fase: 'fotos', tekst: 'Eventuele knelpunten in close-up (kieren, vochtplekken, scheuren)' },
  // --- 6. Afronding ---
  { item_code: 'afronding_1', fase: 'afronding', tekst: 'Bevindingen mondeling teruggekoppeld aan contactpersoon' },
  { item_code: 'afronding_2', fase: 'afronding', tekst: 'Eventuele ontbrekende gegevens (jaarafrekeningen, tekeningen) concreet nagevraagd' },
  { item_code: 'afronding_3', fase: 'afronding', tekst: 'Vervolgstap en verwachte levertijd rapport besproken' },
  { item_code: 'afronding_4', fase: 'afronding', tekst: "Foto's en notities dezelfde dag verwerkt in het projectdossier" },
  { item_code: 'afronding_5', fase: 'afronding', tekst: 'Checklist volledig ingevuld en gearchiveerd bij het project' },
]

export const OPNAME_ONDERDEEL_CODES = [
  'dak', 'gevel', 'vloer', 'glas', 'kozijnen', 'deuren', 'isolatie', 'kierdichting',
  'cv', 'warmtepomp', 'warmtapwater', 'ventilatie', 'verlichting', 'zonnepanelen',
  'meterkast', 'overig', 'verbruik',
]

export const OPNAME_ONDERDELEN = [
  { onderdeel: 'dak', label: 'Dak' },
  { onderdeel: 'gevel', label: 'Gevel' },
  { onderdeel: 'vloer', label: 'Vloer' },
  { onderdeel: 'glas', label: 'Glas' },
  { onderdeel: 'kozijnen', label: 'Kozijnen' },
  { onderdeel: 'deuren', label: 'Deuren' },
  { onderdeel: 'isolatie', label: 'Isolatie (algemeen)' },
  { onderdeel: 'kierdichting', label: 'Kierdichting' },
  { onderdeel: 'cv', label: 'CV / verwarming' },
  { onderdeel: 'warmtepomp', label: 'Warmtepomp' },
  { onderdeel: 'warmtapwater', label: 'Warmtapwater' },
  { onderdeel: 'ventilatie', label: 'Ventilatie' },
  { onderdeel: 'verlichting', label: 'Verlichting' },
  { onderdeel: 'zonnepanelen', label: 'Zonnepanelen' },
  { onderdeel: 'meterkast', label: 'Meterkast' },
  { onderdeel: 'overig', label: 'Overige installaties' },
  { onderdeel: 'verbruik', label: 'Energieverbruik' },
]

const ONDERDEEL_LABEL_MAP = Object.fromEntries(OPNAME_ONDERDELEN.map((o) => [o.onderdeel, o.label]))
export function onderdeelLabel(code) {
  return ONDERDEEL_LABEL_MAP[code] ?? code
}

export const OPNAME_STATUS_LABELS = {
  concept: 'Concept',
  opgeslagen: 'Opgeslagen',
  afgerond: 'Afgerond',
}

/** Een opname mag alleen bewerkt worden zolang hij niet is afgerond (zelfde regel als de database-trigger, hier voor UI-gating). */
export function magOpnameBewerken(opname) {
  return Boolean(opname) && opname.status !== 'afgerond'
}

/**
 * Compleetheid = de checklist zelf: fase "Afronding" bevat letterlijk het
 * item "Checklist volledig ingevuld en gearchiveerd bij het project" —
 * dat item afvinken vereist dus per definitie dat de rest ook klopt. Geen
 * zelfbedachte regel: dit is de eigen afrondingsdefinitie van het
 * brondocument. Geeft { totaal, afgevinkt, compleet, ontbrekend } terug,
 * ontbrekend gegroepeerd per fase voor een duidelijke "dit mist nog nog"-
 * weergave.
 */
export function berekenChecklistVoortgang(checklistItems) {
  const afgevinkteCodes = new Set((checklistItems ?? []).filter((i) => i.afgevinkt).map((i) => i.item_code))
  const ontbrekend = OPNAME_CHECKLIST_ITEMS.filter((item) => !afgevinkteCodes.has(item.item_code))
  return {
    totaal: OPNAME_CHECKLIST_ITEMS.length,
    afgevinkt: OPNAME_CHECKLIST_ITEMS.length - ontbrekend.length,
    compleet: ontbrekend.length === 0,
    ontbrekend,
  }
}

/** Groepeert de vaste checklist-items per fase, met de afvinkstatus uit de databaserijen erin gemengd (ontbrekende rij = niet afgevinkt). */
export function groepeerChecklistPerFase(checklistItems) {
  const statusPerCode = Object.fromEntries((checklistItems ?? []).map((i) => [i.item_code, i]))
  return OPNAME_CHECKLIST_FASEN.map((f) => ({
    ...f,
    items: OPNAME_CHECKLIST_ITEMS.filter((item) => item.fase === f.fase).map((item) => ({
      ...item,
      afgevinkt: Boolean(statusPerCode[item.item_code]?.afgevinkt),
    })),
  }))
}

/** Aantal waarnemingen per onderdeel (voor de "nog niet ingevuld"-indicatie per stap) — puur informatief, blokkeert nooit afronden (zie eindrapport: de brondocumenten kennen geen expliciete verplicht/optioneel-vlag per onderdeel, dus geen harde gate hierop). */
export function telWaarnemingenPerOnderdeel(waarnemingen) {
  const telling = Object.fromEntries(OPNAME_ONDERDEEL_CODES.map((c) => [c, 0]))
  ;(waarnemingen ?? []).forEach((w) => {
    if (telling[w.onderdeel] !== undefined) telling[w.onderdeel] += 1
  })
  return telling
}

/** Groepeert een platte lijst opname_waarnemingen-rijen per onderdeel, gesorteerd op aanmaakdatum (stabiele volgorde binnen een onderdeel). */
export function groepeerWaarnemingenPerOnderdeel(waarnemingen) {
  const groepen = Object.fromEntries(OPNAME_ONDERDEEL_CODES.map((c) => [c, []]))
  ;(waarnemingen ?? [])
    .slice()
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    .forEach((w) => {
      if (groepen[w.onderdeel]) groepen[w.onderdeel].push(w)
    })
  return groepen
}
