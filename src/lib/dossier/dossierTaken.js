/**
 * Standaardsets voor dossier_taken (0026_dossier_taken.sql) — de 3
 * subsidiestappen en 5 opleveringitems zoals ze letterlijk in de
 * Gold-rapporttemplate staan (zie src/assets/rapportTemplates/gold.docx,
 * secties 8/10). Puur data + een pure bouwfunctie, geen database, geen
 * React.
 *
 * Business-beslissing (klant bevestigd): dit is een VOORSTEL, geen vaste
 * rij in de database — bouwStandaardTaken() levert alleen de tekst voor
 * een eenmalige, expliciete adviseursactie ("vul standaard checklist").
 * Eenmaal aangemaakt zijn de rijen in `dossier_taken` volledig vrij
 * bewerkbaar/toevoegbaar/verwijderbaar; deze module heeft daarna geen rol
 * meer voor dat dossier (geen sjabloon dat op de achtergrond "correct"
 * blijft, geen verrassende terugval).
 */
export const TAAK_CATEGORIEEN = ['subsidie', 'oplevering']

export const TAAK_STATUSSEN = [
  { value: 'open', label: 'Open' },
  { value: 'in_uitvoering', label: 'In uitvoering' },
  { value: 'afgerond', label: 'Afgerond' },
]

const STANDAARD_SUBSIDIE_TAKEN = [
  { omschrijving: 'EIA-melding indienen bij RVO (binnen 3 maanden na het aangaan van de investeringsverplichting)', verantwoordelijke: 'SMV Advies' },
  { omschrijving: 'ISDE-aanvraag voorbereiden en indienen (vóór start uitvoering, per regeling verschillend)', verantwoordelijke: 'SMV Advies' },
  { omschrijving: 'Nacalculatie en verantwoording na uitvoering (facturen, technische bewijsstukken)', verantwoordelijke: 'Klant + SMV Advies' },
]

const STANDAARD_OPLEVERING_TAKEN = [
  { omschrijving: 'Eindcontrole uitgevoerd op locatie', verantwoordelijke: null },
  { omschrijving: 'Facturen en offertes gearchiveerd', verantwoordelijke: null },
  { omschrijving: 'Subsidiebeschikking(en) ontvangen en gecontroleerd', verantwoordelijke: null },
  { omschrijving: 'Garantiebewijzen overhandigd aan klant', verantwoordelijke: null },
  { omschrijving: 'Nazorgmoment ingepland (bijv. na 1 jaar)', verantwoordelijke: null },
]

/**
 * Bouwt de standaardrijen voor één categorie, klaar om als dossier_taken
 * in te voegen (dossier_id/adviespunt_id voegt de aanroeper toe — dat is
 * per definitie dossierspecifiek en hoort niet in deze pure module).
 * Onbekende categorie levert een lege lijst, nooit een crash.
 */
export function bouwStandaardTaken(categorie) {
  const bron = categorie === 'subsidie' ? STANDAARD_SUBSIDIE_TAKEN : categorie === 'oplevering' ? STANDAARD_OPLEVERING_TAKEN : []
  return bron.map((taak, index) => ({
    categorie,
    omschrijving: taak.omschrijving,
    verantwoordelijke: taak.verantwoordelijke,
    volgorde: index,
  }))
}

/** Sorteert taken binnen een categorie op volgorde, dan op aanmaakdatum — stabiel ook nadat de adviseur rijen toevoegt/verwijdert. */
export function sorteerTaken(taken) {
  return [...taken].sort((a, b) => {
    if (a.volgorde !== b.volgorde) return a.volgorde - b.volgorde
    return (a.created_at ?? '').localeCompare(b.created_at ?? '')
  })
}

/** Groepeert een platte lijst dossier_taken-rijen per categorie, gesorteerd. */
export function groepeerTakenPerCategorie(taken) {
  const groepen = { subsidie: [], oplevering: [] }
  taken.forEach((taak) => {
    if (groepen[taak.categorie]) groepen[taak.categorie].push(taak)
  })
  TAAK_CATEGORIEEN.forEach((c) => {
    groepen[c] = sorteerTaken(groepen[c])
  })
  return groepen
}
