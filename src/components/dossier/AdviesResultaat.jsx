import { groepeerAdviespunten } from '../../lib/dossier'
import { AdviespuntKaart } from './AdviesBeheer'

/**
 * Read-only "Adviesresultaat"-weergave (ontwerpdocument "Het adviesresultaat
 * van SMV Advies"): structureert de al bestaande `adviespunten` in de vijf
 * vaste statusgroepen, zonder ze te wijzigen en zonder er nieuwe inhoud aan
 * toe te voegen. Bewerken/toevoegen/verwijderen blijft uitsluitend de taak
 * van AdviesBeheer — dit scherm heeft geen enkele schrijfactie.
 *
 * Werkt zowel op een open als een afgerond Dossier; toont exact wat er op
 * dit moment in `adviespunten` staat, dus bij een open Dossier verandert het
 * mee zodra Richard iets opslaat in AdviesBeheer (zie KlantDossierFlow.jsx).
 */

const ZONDER_ADVIESPUNTEN =
  'Nog geen adviespunten vastgelegd om te structureren. Gebruik "Advies beheren" om een MJOP-signaal over te nemen of zelf een adviespunt toe te voegen.'

function LegendaPil({ label, aantal }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
        aantal > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground-muted'
      }`}
    >
      {label}
      <span className="font-mono">{aantal}</span>
    </span>
  )
}

export function AdviesResultaat({ adviespunten }) {
  const { groepen, totaal } = groepeerAdviespunten(adviespunten)

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Adviesdossier</p>
        <h3 className="text-xl text-primary">Adviesresultaat</h3>
        <p className="mt-1 text-sm text-foreground-muted">
          De vastgelegde adviespunten, gestructureerd op status — geen nieuwe conclusie, alleen een overzichtelijke ordening van wat al is opgeslagen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="list" aria-label="Aantal adviespunten per status">
        {groepen.map((groep) => (
          <LegendaPil key={groep.status} label={groep.label} aantal={groep.aantal} />
        ))}
      </div>

      {totaal === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">{ZONDER_ADVIESPUNTEN}</p>
      ) : (
        groepen
          .filter((groep) => groep.aantal > 0)
          .map((groep) => (
            <div key={groep.status}>
              <h4 className="mb-2 text-sm font-semibold text-primary">{groep.label}</h4>
              <ul className="flex flex-col gap-3">
                {groep.adviespunten.map((advies) => (
                  <li key={advies.adviespuntId}>
                    <AdviespuntKaart advies={advies} />
                  </li>
                ))}
              </ul>
            </div>
          ))
      )}
    </div>
  )
}
