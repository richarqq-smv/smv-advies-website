/**
 * `location.state.van` is altijd door RequireAuth.jsx zelf gezet als
 * `location.pathname + location.search` (zie RequireAuth.jsx) en is
 * daardoor al per definitie same-origin — maar wordt hier bij gebruik
 * nogmaals gevalideerd voordat ernaar genavigeerd wordt, zodat een
 * toekomstige andere plek die `state.van` zet nooit per ongeluk een
 * open redirect naar een externe URL kan veroorzaken.
 */
export function veiligeInterneBestemming(pad) {
  if (typeof pad !== 'string') return null
  if (!pad.startsWith('/')) return null
  if (pad.startsWith('//')) return null
  return pad
}
