import { useEffect, useState } from 'react'
import { X, WarningCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { maakKlantPandDossierAlsAdmin } from '../../lib/klantOmgeving/api'
import { valideerKlantRegistratie } from '../../lib/klantOmgeving/klantValidatie'
import { valideerNieuwPand, ZAKELIJKE_GEBRUIKSTYPES } from '../../lib/klantOmgeving/pandValidatie'
import { PACKAGES } from '../../data/packages'

const SELECT_CLASSNAME =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

const GEBRUIKSTYPE_LABELS = {
  kantoor: 'Kantoor',
  bedrijfshal: 'Bedrijfshal / loods',
  winkel: 'Winkel',
  horeca: 'Horeca',
  praktijk: 'Praktijkruimte',
  gemengd: 'Gemengd gebruik',
  anders: 'Anders',
  magazijn: 'Magazijn',
  werkplaats: 'Werkplaats',
  overig: 'Overig',
}

function leegFormulier() {
  return {
    klantNaam: '',
    bedrijfsnaam: '',
    email: '',
    telefoon: '',
    pandOmschrijving: '',
    adres: '',
    postcode: '',
    plaats: '',
    bouwjaar: '',
    gebruikstype: '',
    vloeroppervlak: '',
    bouwlagen: '',
    gebruikers: '',
    opmerkingen: '',
    pakketId: '',
  }
}

/**
 * Admin-only: nieuwe Klant + Pand + Dossier aanmaken in één stap (UX-
 * auditronde 2026-10-09, §0 — tot nu toe bestond hiervoor geen enkele
 * admin-flow, alleen de klant-zelf-service-tools MJOP-Tool/Energie-
 * indicatie). Eén formulier, één "Aanmaken"-knop: de knop wordt
 * uitgeschakeld zodra `bezig` true is, zodat een dubbelklik nooit twee
 * aanroepen tegelijk kan versturen — gecombineerd met de atomaire
 * `admin_maak_klant_pand_dossier()`-RPC (zie
 * 0043_admin_klant_pand_dossier_aanmaken.sql) kan er dus nooit een
 * gedeeltelijk aangemaakte Klant/Pand/Dossier-combinatie ontstaan.
 *
 * Validatie hergebruikt bewust bestaande, al geteste functies:
 * valideerKlantRegistratie() (klantValidatie.js, dezelfde regel als
 * Account.jsx's registreerKlant()-formulier) en valideerNieuwPand()
 * (pandValidatie.js, nieuw voor deze ronde maar zelfde "optioneel tenzij
 * functioneel cruciaal"-uitgangspunt als lib/dossier/pand.js).
 */
export function NieuweKlantModal({ onClose, onAangemaakt }) {
  const [form, setForm] = useState(leegFormulier())
  const [fouten, setFouten] = useState({})
  const [bezig, setBezig] = useState(false)
  const [opslaanFout, setOpslaanFout] = useState(null)

  useEffect(() => {
    function opEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', opEscape)
    return () => document.removeEventListener('keydown', opEscape)
  }, [onClose])

  function wijzig(veld, waarde) {
    setForm((s) => ({ ...s, [veld]: waarde }))
  }

  async function aanmaken(e) {
    e.preventDefault()
    const klantFouten = valideerKlantRegistratie({ naam: form.klantNaam, email: form.email, telefoon: form.telefoon })
    const pandFouten = valideerNieuwPand({
      gebruikstype: form.gebruikstype,
      bouwjaar: form.bouwjaar,
      vloeroppervlak: form.vloeroppervlak,
      bouwlagen: form.bouwlagen,
      gebruikers: form.gebruikers,
    })
    const alleFouten = { ...klantFouten, ...pandFouten }
    setFouten(alleFouten)
    if (Object.keys(alleFouten).length > 0) return

    setBezig(true)
    setOpslaanFout(null)
    try {
      const dossierId = await maakKlantPandDossierAlsAdmin({
        klant: {
          naam: form.klantNaam.trim(),
          bedrijfsnaam: form.bedrijfsnaam.trim() || null,
          email: form.email.trim() || null,
          telefoon: form.telefoon.trim() || null,
        },
        pand: {
          omschrijving: form.pandOmschrijving.trim(),
          adres: form.adres.trim(),
          postcode: form.postcode.trim(),
          plaats: form.plaats.trim(),
          bouwjaar: form.bouwjaar === '' ? null : Number(form.bouwjaar),
          gebruikstype: form.gebruikstype,
          vloeroppervlak: form.vloeroppervlak === '' ? null : Number(form.vloeroppervlak),
          bouwlagen: form.bouwlagen === '' ? null : Number(form.bouwlagen),
          gebruikers: form.gebruikers === '' ? null : Number(form.gebruikers),
          opmerkingen: form.opmerkingen.trim(),
          ontstaanVia: 'intake',
        },
        pakketId: form.pakketId || null,
      })
      onAangemaakt(dossierId)
    } catch {
      setOpslaanFout('Aanmaken is niet gelukt. Probeer het opnieuw.')
    } finally {
      setBezig(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nieuwe klant toevoegen"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg text-primary">Nieuwe klant toevoegen</h2>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="text-foreground-muted hover:text-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={aanmaken} className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold tracking-[0.1em] text-foreground-muted uppercase">Klant</h3>
            <TextField id="nk-naam" label="Naam" value={form.klantNaam} onChange={(v) => wijzig('klantNaam', v)} error={fouten.naam} required />
            <TextField id="nk-bedrijfsnaam" label="Bedrijfsnaam (indien van toepassing)" value={form.bedrijfsnaam} onChange={(v) => wijzig('bedrijfsnaam', v)} />
            <TextField id="nk-email" label="E-mailadres" type="email" value={form.email} onChange={(v) => wijzig('email', v)} error={fouten.email} />
            <TextField id="nk-telefoon" label="Telefoonnummer" value={form.telefoon} onChange={(v) => wijzig('telefoon', v)} error={fouten.telefoon} />
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <h3 className="text-xs font-semibold tracking-[0.1em] text-foreground-muted uppercase">Pand</h3>
            <TextField id="nk-pand-omschrijving" label="Omschrijving" value={form.pandOmschrijving} onChange={(v) => wijzig('pandOmschrijving', v)} />
            <TextField id="nk-adres" label="Adres" value={form.adres} onChange={(v) => wijzig('adres', v)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField id="nk-postcode" label="Postcode" value={form.postcode} onChange={(v) => wijzig('postcode', v)} />
              <TextField id="nk-plaats" label="Plaats" value={form.plaats} onChange={(v) => wijzig('plaats', v)} />
            </div>
            <div>
              <label htmlFor="nk-gebruikstype" className="mb-2 block text-sm font-medium text-primary">
                Gebruikstype<span className="ml-1 text-accent">*</span>
              </label>
              <select id="nk-gebruikstype" value={form.gebruikstype} onChange={(e) => wijzig('gebruikstype', e.target.value)} className={SELECT_CLASSNAME}>
                <option value="">Kies een gebruikstype...</option>
                {ZAKELIJKE_GEBRUIKSTYPES.map((waarde) => (
                  <option key={waarde} value={waarde}>
                    {GEBRUIKSTYPE_LABELS[waarde] ?? waarde}
                  </option>
                ))}
              </select>
              {fouten.gebruikstype ? (
                <p role="alert" className="mt-2 text-sm font-medium text-error">
                  {fouten.gebruikstype}
                </p>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <TextField id="nk-bouwjaar" label="Bouwjaar" type="number" value={form.bouwjaar} onChange={(v) => wijzig('bouwjaar', v)} error={fouten.bouwjaar} />
              <TextField
                id="nk-vloeroppervlak"
                label="Oppervlak (m²)"
                type="number"
                value={form.vloeroppervlak}
                onChange={(v) => wijzig('vloeroppervlak', v)}
                error={fouten.vloeroppervlak}
              />
              <TextField id="nk-bouwlagen" label="Bouwlagen" type="number" value={form.bouwlagen} onChange={(v) => wijzig('bouwlagen', v)} error={fouten.bouwlagen} />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <label htmlFor="nk-pakket" className="mb-1 block text-sm font-medium text-primary">
              Pakket (optioneel, later nog te wijzigen)
            </label>
            <select id="nk-pakket" value={form.pakketId} onChange={(e) => wijzig('pakketId', e.target.value)} className={SELECT_CLASSNAME}>
              <option value="">Nog niet bepaald</option>
              {PACKAGES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {opslaanFout ? (
            <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
              <WarningCircle size={14} weight="fill" />
              {opslaanFout}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="submit" size="sm" disabled={bezig}>
              {bezig ? 'Bezig...' : 'Klant, pand en dossier aanmaken'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={bezig}>
              Annuleren
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
