/**
 * Pure validatie dat een bron-controledatum nooit in de toekomst ligt
 * (opdracht §20: "gebruik absoluut geen toekomstige controledatum...
 * controleer dit expliciet in code, tests en gegenereerde documenten").
 * Een eerdere ronde had dit bij dak-/gevelisolatie per abuis fout
 * (2026-10-09 geregistreerd op 2026-10-08) — deze helper maakt die fout
 * voortaan expliciet zichtbaar in plaats van stil te falen.
 */
export function valideerControleDatum(datumString, vandaag = new Date()) {
  if (!datumString) return { geldig: false, reden: 'Geen controledatum geregistreerd.' }
  const datum = new Date(datumString)
  if (Number.isNaN(datum.getTime())) return { geldig: false, reden: `Ongeldige controledatum: "${datumString}".` }
  if (datum.getTime() > vandaag.getTime()) {
    return { geldig: false, reden: `Controledatum (${datumString}) ligt in de toekomst — dit kan niet juist zijn, controleer de bron opnieuw.` }
  }
  return { geldig: true, reden: null }
}

/** Filtert/annoteert een lijst bronnen met hun validatieresultaat — gebruikt in het document zodat een foutieve datum zichtbaar wordt, niet stilzwijgend verdwijnt. */
export function controleerBronnen(bronnen = [], vandaag = new Date()) {
  return bronnen.map((bron) => ({ ...bron, controle: valideerControleDatum(bron.gecontroleerdOp, vandaag) }))
}
