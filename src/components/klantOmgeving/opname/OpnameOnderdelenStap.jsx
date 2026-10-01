import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Button } from '../../ui/Button'
import { addOpnameWaarneming } from '../../../lib/klantOmgeving/api'
import { OPNAME_ONDERDELEN } from '../../../lib/klantOmgeving/opname'
import { OpnameAccordionItem } from './OpnameAccordionItem'
import { OpnameWaarnemingCard } from './OpnameWaarnemingCard'

/**
 * Alle 17 onderdelen van het opnameformulier als accordion (UX-ronde,
 * 2026-10-01, opdracht §1-2) — vervangt de vorige opzet van één onderdeel
 * per volledige stap. Dichtgeklapt toont elk onderdeel alleen een
 * compacte statusregel; standaard staan alle onderdelen dicht, behalve
 * het eerste onderdeel zonder enige waarneming (één keer bepaald bij het
 * openen van deze stap, niet herberekend bij elke wijziging — anders zou
 * het toevoegen van een waarneming een ander onderdeel vanzelf laten
 * dichtklappen). De gebruiker kan zelf vrij meerdere onderdelen
 * tegelijk open hebben; openen van het ene onderdeel sluit nooit
 * automatisch een ander onderdeel.
 */
export function OpnameOnderdelenStap({ waarnemingenPerOnderdeel, magBewerken, opnameId, klantId, documenten, onWaarnemingToegevoegd, onWaarnemingChange, onWaarnemingVerwijderd, onDocumentGeupload }) {
  const [openSet, setOpenSet] = useState(() => {
    const eersteLege = OPNAME_ONDERDELEN.find((o) => (waarnemingenPerOnderdeel[o.onderdeel]?.length ?? 0) === 0)
    return new Set(eersteLege ? [eersteLege.onderdeel] : [])
  })

  function toggle(code) {
    setOpenSet((set) => {
      const nieuw = new Set(set)
      if (nieuw.has(code)) nieuw.delete(code)
      else nieuw.add(code)
      return nieuw
    })
  }

  async function waarnemingToevoegen(code) {
    const nieuw = await addOpnameWaarneming(opnameId, code)
    onWaarnemingToegevoegd(nieuw)
    // Het onderdeel blijft (of wordt) open zodat de net toegevoegde, lege
    // waarneming — die zelf standaard opengeklapt start, zie
    // OpnameWaarnemingCard — meteen zichtbaar is.
    setOpenSet((set) => new Set(set).add(code))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Opname</p>
        <h2 className="text-2xl text-primary">Onderdelen</h2>
      </div>

      <div className="flex flex-col gap-2">
        {OPNAME_ONDERDELEN.map((o) => {
          const waarnemingen = waarnemingenPerOnderdeel[o.onderdeel] ?? []
          const heeftAandachtspunt = waarnemingen.some((w) => w.aandachtspunt?.trim())
          const subtitle =
            waarnemingen.length === 0
              ? '0 waarnemingen'
              : `${waarnemingen.length} waarneming${waarnemingen.length === 1 ? '' : 'en'}${heeftAandachtspunt ? ' · aandachtspunt' : ''}`
          return (
            <OpnameAccordionItem
              key={o.onderdeel}
              title={o.label}
              subtitle={subtitle}
              subtitleTone={heeftAandachtspunt ? 'accent' : 'muted'}
              open={openSet.has(o.onderdeel)}
              onToggle={() => toggle(o.onderdeel)}
            >
              <div className="flex flex-col gap-2">
                {waarnemingen.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-foreground-muted">
                    Nog geen waarneming voor dit onderdeel.
                  </p>
                ) : (
                  waarnemingen.map((w, index) => (
                    <OpnameWaarnemingCard
                      key={w.waarneming_id}
                      index={index}
                      waarneming={w}
                      magBewerken={magBewerken}
                      documenten={documenten}
                      klantId={klantId}
                      opnameId={opnameId}
                      onWaarnemingChange={onWaarnemingChange}
                      onVerwijderd={onWaarnemingVerwijderd}
                      onDocumentGeupload={onDocumentGeupload}
                    />
                  ))
                )}
                {magBewerken ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => waarnemingToevoegen(o.onderdeel)} className="min-h-11 w-fit">
                    <Plus size={16} /> Waarneming toevoegen
                  </Button>
                ) : null}
              </div>
            </OpnameAccordionItem>
          )
        })}
      </div>
    </div>
  )
}
