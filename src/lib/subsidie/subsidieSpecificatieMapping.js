/**
 * Eén herbruikbare camelCase-vertaling van een dossier_subsidie_
 * specificaties-rij (snake_case uit de database) — gebruikt door zowel
 * AdminSubsidieBegeleiding.jsx als de opname-integratie
 * (OpnameOnderdelenStap.jsx), zodat beide schermen exact dezelfde
 * velden op exact dezelfde manier lezen. Vóór deze module stond dezelfde
 * functie alleen lokaal in AdminSubsidieBegeleiding.jsx — nu op één plek.
 */
export function naarCamelCaseSpecificatie(rij) {
  if (!rij) return null
  return {
    uitvoeringsjaar: rij.uitvoeringsjaar,
    oppervlakteM2: rij.oppervlakte_m2,
    technischeWaarde: rij.technische_waarde,
    meldcode: rij.meldcode,
    isolatieBevestigd: rij.isolatie_bevestigd,
    notitie: rij.notitie,
    bedrag: rij.bedrag,
    bronUrl: rij.bron_url,
    doelgroep: rij.doelgroep,
  }
}

/** Bouwt een `{ maatregelKey: specificatieCamelCase }`-map uit de platte lijst die listDossierSubsidieSpecificaties() teruggeeft. */
export function naarSpecificatiesPerMaatregel(rijen) {
  const perMaatregel = {}
  ;(rijen ?? []).forEach((rij) => {
    perMaatregel[rij.maatregel_key] = naarCamelCaseSpecificatie(rij)
  })
  return perMaatregel
}
