import { PACKAGES } from '../../data/packages'

const EURO = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })

function prijsTekst(prijs) {
  return prijs == null ? 'Op aanvraag' : `€ ${EURO.format(prijs)}`
}

/**
 * Vaste prijzen per oppervlaktecategorie, rechtstreeks uit
 * `PACKAGES[].priceTiers` (src/data/packages.js), de enige bron voor
 * prijzen. De kaarten tonen alleen "Vanaf"; deze tabel laat zien wat een
 * pand van een bepaalde omvang daadwerkelijk kost. De tiers zijn voor alle
 * pakketten gelijk ingedeeld, dus de rijen komen uit het eerste pakket.
 */
export function PrijsPerOppervlakte() {
  const rijen = PACKAGES[0].priceTiers

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Prijs per pakket, per oppervlakte van uw bedrijfspand, exclusief btw</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-3 pr-3 text-sm font-semibold text-primary">
              Oppervlakte pand
            </th>
            {PACKAGES.map((pkg) => (
              <th key={pkg.id} scope="col" className="px-3 py-3 text-right text-sm font-semibold text-primary">
                {pkg.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rijen.map((rij) => (
            <tr key={rij.id} className="border-b border-border last:border-b-0">
              <th scope="row" className="py-3 pr-3 text-sm font-normal text-foreground">
                {rij.label}
              </th>
              {/* Is de prijs voor alle pakketten "op aanvraag", dan één cel
                  over de drie kolommen: drie keer dezelfde tekst liep op
                  390px over meerdere regels. */}
              {PACKAGES.every((pkg) => pkg.priceTiers.find((t) => t.id === rij.id)?.prijs == null) ? (
                <td colSpan={PACKAGES.length} className="px-3 py-3 text-right text-sm text-primary">
                  {prijsTekst(null)}
                </td>
              ) : (
                PACKAGES.map((pkg) => {
                  const tier = pkg.priceTiers.find((t) => t.id === rij.id)
                  return (
                    <td key={pkg.id} className="px-3 py-3 text-right text-sm whitespace-nowrap text-primary tabular-nums">
                      {prijsTekst(tier?.prijs)}
                    </td>
                  )
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
