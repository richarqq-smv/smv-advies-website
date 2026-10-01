import { useState } from 'react'
import { Check } from '@phosphor-icons/react'
import { groepeerChecklistPerFase } from '../../../lib/klantOmgeving/opname'
import { OpnameAccordionItem } from './OpnameAccordionItem'

/**
 * De volledige Checklist Locatiebezoek als accordion per fase (UX-ronde,
 * 2026-10-01, opdracht §8) — alle 6 fasen (incl. Voorbereiding, niet
 * langer apart ondergebracht in de Basisgegevens-stap), exacte tekst uit
 * het brondocument, geen herschreven/ingekorte items. Dichtgeklapt toont
 * elke fase alleen "X / Y voltooid"; standaard staat de eerste nog niet
 * volledig afgevinkte fase open (één keer bepaald bij binnenkomst op deze
 * stap), de rest dicht. Meerdere fasen mogen tegelijk open staan.
 */
export function OpnameChecklistStap({ checklistItems, magBewerken, onToggle }) {
  const groepen = groepeerChecklistPerFase(checklistItems)

  const [openSet, setOpenSet] = useState(() => {
    const eersteOnvolledig = groepen.find((g) => g.items.some((i) => !i.afgevinkt))
    return new Set(eersteOnvolledig ? [eersteOnvolledig.fase] : [])
  })

  function toggleFase(fase) {
    setOpenSet((set) => {
      const nieuw = new Set(set)
      if (nieuw.has(fase)) nieuw.delete(fase)
      else nieuw.add(fase)
      return nieuw
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Opname</p>
        <h2 className="text-2xl text-primary">Checklist locatiebezoek</h2>
      </div>

      <div className="flex flex-col gap-2">
        {groepen.map((g) => {
          const voltooid = g.items.filter((i) => i.afgevinkt).length
          return (
            <OpnameAccordionItem
              key={g.fase}
              title={g.label}
              subtitle={`${voltooid} / ${g.items.length} voltooid`}
              subtitleTone={voltooid === g.items.length ? 'accent' : 'muted'}
              open={openSet.has(g.fase)}
              onToggle={() => toggleFase(g.fase)}
            >
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
            </OpnameAccordionItem>
          )
        })}
      </div>
    </div>
  )
}
