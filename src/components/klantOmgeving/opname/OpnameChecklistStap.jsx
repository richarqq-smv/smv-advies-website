import { Check } from '@phosphor-icons/react'
import { groepeerChecklistPerFase } from '../../../lib/klantOmgeving/opname'

/**
 * De volledige Checklist Locatiebezoek, gegroepeerd per fase — exacte
 * tekst uit het brondocument, geen herschreven/ingekorte items (opdracht
 * §1/§20). `fasen` laat de aanroeper kiezen welke fasen hier getoond
 * worden (Voorbereiding staat al in de Basisgegevens-stap, zie
 * AdminOpname.jsx) — dezelfde 38 items, geen dubbele bron.
 */
export function OpnameChecklistStap({ title, checklistItems, fasen, magBewerken, onToggle }) {
  const groepen = groepeerChecklistPerFase(checklistItems).filter((g) => fasen.includes(g.fase))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Checklist</p>
        <h2 className="text-2xl text-primary">{title}</h2>
      </div>
      {groepen.map((g) => (
        <div key={g.fase}>
          <h3 className="mb-2 text-base font-medium text-primary">{g.label}</h3>
          <ul className="flex flex-col gap-1.5">
            {g.items.map((item) => (
              <li key={item.item_code}>
                <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                  <input
                    type="checkbox"
                    checked={item.afgevinkt}
                    disabled={!magBewerken}
                    onChange={(e) => onToggle(item.item_code, e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${item.afgevinkt ? 'border-accent bg-accent text-white' : 'border-border'}`}
                  >
                    {item.afgevinkt ? <Check size={14} weight="bold" /> : null}
                  </span>
                  <span className={item.afgevinkt ? 'text-primary' : 'text-foreground-muted'}>{item.tekst}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
