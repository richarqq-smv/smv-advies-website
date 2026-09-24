import { useMemo, useState } from 'react'
import { CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import {
  createKlant,
  createContactpersoon,
  addContactpersoon,
  saveKlant,
  loadAllKlanten,
  koppelKlantAanPand,
  openAdviesdossier,
} from '../../lib/dossier'
import { AdviesBeheer } from './AdviesBeheer'

/**
 * Interne flow "Bestaand Pand → Klant koppelen → Contactpersoon kiezen/maken
 * → Dossier openen" (ontwerpdocument "Klant → Pand → Dossier implementeren").
 * Bewust géén CRM en géén klantportaal: alleen de vier stappen die nodig
 * zijn om vanuit een al opgeslagen Pand bewust een Adviesdossier te openen.
 * Gebruikt uitsluitend bestaande domeinfuncties uit lib/dossier — geen
 * tweede mapping- of opslaglaag.
 */

function zoekKlanten(klanten, zoekterm) {
  const q = zoekterm.trim().toLowerCase()
  if (!q) return []
  return klanten.filter((k) => {
    const velden = [k.naam, k.bedrijfsnaam, k.email, ...k.contactpersonen.map((c) => c.naam)]
    return velden.some((v) => (v ?? '').toLowerCase().includes(q))
  })
}

function StapKop({ nummer, titel, actief, afgerond }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${actief ? 'text-primary' : 'text-foreground-muted'}`}>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
          afgerond ? 'bg-accent text-white' : actief ? 'border-2 border-accent text-accent' : 'border border-border text-foreground-muted'
        }`}
      >
        {afgerond ? <CheckCircle size={14} weight="fill" /> : nummer}
      </span>
      {titel}
    </div>
  )
}

function FoutMelding({ fout }) {
  if (!fout) return null
  return (
    <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
      <WarningCircle size={15} weight="fill" />
      {fout}
    </p>
  )
}

export function KlantDossierFlow({ pand, building }) {
  const [stap, setStap] = useState(1)

  // Stap 1 — Klant
  const [zoekterm, setZoekterm] = useState('')
  const [nieuweKlantModus, setNieuweKlantModus] = useState(false)
  const [nieuweKlant, setNieuweKlant] = useState({ naam: '', email: '', telefoon: '', bedrijfsnaam: '' })
  const [aangemaakteKlant, setAangemaakteKlant] = useState(null)
  const [geselecteerdeKlant, setGeselecteerdeKlant] = useState(null)
  const [klantFout, setKlantFout] = useState(null)
  const [klantBezig, setKlantBezig] = useState(false)

  // Stap 2 — Contactpersoon
  const [gekozenContactpersoonId, setGekozenContactpersoonId] = useState(null)
  const [nieuweContactpersoonModus, setNieuweContactpersoonModus] = useState(false)
  const [nieuweContactpersoon, setNieuweContactpersoon] = useState({ naam: '', email: '', telefoon: '', rol: '' })
  const [contactpersoonFout, setContactpersoonFout] = useState(null)
  const [contactpersoonBezig, setContactpersoonBezig] = useState(false)

  // Stap 3 — Dossier openen
  const [dossierResultaat, setDossierResultaat] = useState(null)
  const [dossierFout, setDossierFout] = useState(null)
  const [dossierBezig, setDossierBezig] = useState(false)

  // Bewust geen memo: loadAllKlanten() is een goedkope lokale lezing, en
  // moet na elke render de actuele lijst tonen (bijv. direct na het
  // aanmaken van een nieuwe klant).
  const zoekresultaten = zoekKlanten(loadAllKlanten(), zoekterm)
  const mjopContactSuggestie = useMemo(() => {
    if (!building?.contact) return null
    const { naam, email, telefoon } = building.contact
    return naam || email || telefoon ? { naam: naam ?? '', email: email ?? '', telefoon: telefoon ?? '' } : null
  }, [building])

  function kiesBestaandeKlant(klant) {
    setKlantFout(null)
    setGeselecteerdeKlant(klant)
    setStap(2)
  }

  async function koppelBestaandeKlant(klant) {
    setKlantFout(null)
    setKlantBezig(true)
    try {
      koppelKlantAanPand(klant, pand)
      kiesBestaandeKlant(klant)
    } catch {
      setKlantFout('Koppelen is niet gelukt. Probeer het opnieuw.')
    } finally {
      setKlantBezig(false)
    }
  }

  function gebruikMjopSuggestie() {
    if (!mjopContactSuggestie) return
    setNieuweKlant((v) => ({ ...v, naam: mjopContactSuggestie.naam, email: mjopContactSuggestie.email, telefoon: mjopContactSuggestie.telefoon }))
  }

  async function maakEnKoppelNieuweKlant() {
    setKlantFout(null)
    if (!aangemaakteKlant && !nieuweKlant.naam.trim()) {
      setKlantFout('Vul een naam in voor de nieuwe klant.')
      return
    }
    setKlantBezig(true)
    try {
      // Als een vorige poging de klant al succesvol opsloeg maar het
      // koppelen daarna mislukte, wordt hier niet opnieuw createKlant()
      // aangeroepen — dat zou een duplicaat opleveren. De opgeslagen
      // klant wordt gewoon hergebruikt.
      let klant = aangemaakteKlant
      if (!klant) {
        klant = createKlant(nieuweKlant)
        if (!saveKlant(klant)) throw new Error('opslaan mislukt')
        setAangemaakteKlant(klant)
      }
      koppelKlantAanPand(klant, pand)
      kiesBestaandeKlant(klant)
    } catch {
      setKlantFout(aangemaakteKlant ? 'Koppelen is niet gelukt. De klant is al opgeslagen — probeer opnieuw te koppelen.' : 'De klant kon niet worden opgeslagen. Probeer het opnieuw.')
    } finally {
      setKlantBezig(false)
    }
  }

  function kiesContactpersoon(contactpersoonId) {
    setContactpersoonFout(null)
    setGekozenContactpersoonId(contactpersoonId)
    setStap(3)
  }

  async function voegContactpersoonToeEnKies() {
    setContactpersoonFout(null)
    if (!nieuweContactpersoon.naam.trim()) {
      setContactpersoonFout('Vul een naam in voor de nieuwe contactpersoon.')
      return
    }
    setContactpersoonBezig(true)
    try {
      const contactpersoon = createContactpersoon(nieuweContactpersoon)
      const bijgewerkteKlant = addContactpersoon(geselecteerdeKlant, contactpersoon)
      if (!saveKlant(bijgewerkteKlant)) throw new Error('opslaan mislukt')
      setGeselecteerdeKlant(bijgewerkteKlant)
      setNieuweContactpersoonModus(false)
      setNieuweContactpersoon({ naam: '', email: '', telefoon: '', rol: '' })
      kiesContactpersoon(contactpersoon.contactpersoonId)
    } catch {
      setContactpersoonFout('De contactpersoon kon niet worden opgeslagen. Probeer het opnieuw.')
    } finally {
      setContactpersoonBezig(false)
    }
  }

  async function handleDossierOpenen() {
    setDossierFout(null)
    setDossierBezig(true)
    try {
      const resultaat = openAdviesdossier({
        klant: geselecteerdeKlant,
        pand,
        primaireContactpersoonId: gekozenContactpersoonId,
      })
      setDossierResultaat(resultaat)
    } catch {
      setDossierFout('Het dossier kon niet worden geopend. Probeer het opnieuw.')
    } finally {
      setDossierBezig(false)
    }
  }

  const gekozenContactpersoon = geselecteerdeKlant?.contactpersonen.find((c) => c.contactpersoonId === gekozenContactpersoonId)

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Adviesdossier</p>
        <h3 className="text-xl text-primary">Klant koppelen en dossier openen</h3>
        <p className="mt-1 text-sm text-foreground-muted">
          Pand: <strong className="text-primary">{pand.omschrijving || pand.plaats || 'dit pand'}</strong>
          {pand.plaats && pand.omschrijving ? ` — ${pand.plaats}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-4">
        <StapKop nummer={1} titel="Klant" actief={stap === 1} afgerond={stap > 1} />
        <StapKop nummer={2} titel="Contactpersoon" actief={stap === 2} afgerond={stap > 2} />
        <StapKop nummer={3} titel="Dossier openen" actief={stap === 3} afgerond={Boolean(dossierResultaat)} />
      </div>

      {stap === 1 ? (
        <div className="flex flex-col gap-5">
          {!nieuweKlantModus ? (
            <>
              <TextField id="dossier-klant-zoeken" label="Bestaande klant zoeken" placeholder="Naam, bedrijfsnaam of e-mailadres" value={zoekterm} onChange={setZoekterm} />
              {zoekterm.trim() ? (
                <ul className="flex flex-col gap-2">
                  {zoekresultaten.length === 0 ? (
                    <li className="text-sm text-foreground-muted">Geen klanten gevonden met deze zoekterm.</li>
                  ) : (
                    zoekresultaten.map((k) => (
                      <li key={k.klantId}>
                        <button
                          type="button"
                          onClick={() => koppelBestaandeKlant(k)}
                          disabled={klantBezig}
                          className="w-full rounded-lg border border-border bg-white px-4 py-3 text-left text-sm hover:border-accent hover:bg-muted disabled:opacity-50"
                        >
                          <span className="font-medium text-primary">{k.naam || k.bedrijfsnaam || 'Naamloze klant'}</span>
                          {k.bedrijfsnaam && k.naam !== k.bedrijfsnaam ? <span className="text-foreground-muted"> — {k.bedrijfsnaam}</span> : null}
                          {k.email ? <span className="block text-foreground-muted">{k.email}</span> : null}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
              <FoutMelding fout={klantFout} />
              <div>
                <Button type="button" variant="outline" size="sm" onClick={() => setNieuweKlantModus(true)}>
                  Nieuwe klant aanmaken
                </Button>
              </div>
            </>
          ) : (
            <>
              {mjopContactSuggestie ? (
                <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
                  <p className="text-foreground-muted">
                    Bij dit pand zijn contactgegevens bekend uit de MJOP-tool: <strong className="text-primary">{mjopContactSuggestie.naam || mjopContactSuggestie.email}</strong>.
                  </p>
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={gebruikMjopSuggestie}>
                    Deze gegevens overnemen
                  </Button>
                </div>
              ) : null}
              <TextField id="dossier-klant-naam" label="Naam" required value={nieuweKlant.naam} onChange={(v) => setNieuweKlant((s) => ({ ...s, naam: v }))} />
              <TextField id="dossier-klant-bedrijfsnaam" label="Bedrijfsnaam" value={nieuweKlant.bedrijfsnaam} onChange={(v) => setNieuweKlant((s) => ({ ...s, bedrijfsnaam: v }))} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField id="dossier-klant-email" label="E-mailadres" type="email" value={nieuweKlant.email} onChange={(v) => setNieuweKlant((s) => ({ ...s, email: v }))} />
                <TextField id="dossier-klant-telefoon" label="Telefoonnummer" type="tel" value={nieuweKlant.telefoon} onChange={(v) => setNieuweKlant((s) => ({ ...s, telefoon: v }))} />
              </div>
              <FoutMelding fout={klantFout} />
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={maakEnKoppelNieuweKlant} disabled={klantBezig}>
                  {klantBezig ? <SpinnerGap size={16} className="animate-spin" /> : null}
                  Klant koppelen
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setNieuweKlantModus(false); setKlantFout(null) }} disabled={klantBezig}>
                  Terug naar zoeken
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {stap === 2 ? (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-foreground-muted">
            Klant: <strong className="text-primary">{geselecteerdeKlant.naam || geselecteerdeKlant.bedrijfsnaam}</strong>
          </p>

          {!nieuweContactpersoonModus ? (
            <>
              <ul className="flex flex-col gap-2">
                {geselecteerdeKlant.contactpersonen.length === 0 ? (
                  <li className="text-sm text-foreground-muted">Nog geen contactpersonen bij deze klant.</li>
                ) : (
                  geselecteerdeKlant.contactpersonen.map((c) => (
                    <li key={c.contactpersoonId}>
                      <button
                        type="button"
                        onClick={() => kiesContactpersoon(c.contactpersoonId)}
                        className="w-full rounded-lg border border-border bg-white px-4 py-3 text-left text-sm hover:border-accent hover:bg-muted"
                      >
                        <span className="font-medium text-primary">{c.naam}</span>
                        {c.rol ? <span className="text-foreground-muted"> — {c.rol}</span> : null}
                        {c.email ? <span className="block text-foreground-muted">{c.email}</span> : null}
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <FoutMelding fout={contactpersoonFout} />
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setNieuweContactpersoonModus(true)}>
                  Nieuwe contactpersoon toevoegen
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => kiesContactpersoon(null)}>
                  Doorgaan zonder contactpersoon
                </Button>
              </div>
            </>
          ) : (
            <>
              <TextField id="dossier-contact-naam" label="Naam" required value={nieuweContactpersoon.naam} onChange={(v) => setNieuweContactpersoon((s) => ({ ...s, naam: v }))} />
              <TextField id="dossier-contact-rol" label="Rol" placeholder="Bijv. eigenaar, facilitair" value={nieuweContactpersoon.rol} onChange={(v) => setNieuweContactpersoon((s) => ({ ...s, rol: v }))} />
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField id="dossier-contact-email" label="E-mailadres" type="email" value={nieuweContactpersoon.email} onChange={(v) => setNieuweContactpersoon((s) => ({ ...s, email: v }))} />
                <TextField id="dossier-contact-telefoon" label="Telefoonnummer" type="tel" value={nieuweContactpersoon.telefoon} onChange={(v) => setNieuweContactpersoon((s) => ({ ...s, telefoon: v }))} />
              </div>
              <FoutMelding fout={contactpersoonFout} />
              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={voegContactpersoonToeEnKies} disabled={contactpersoonBezig}>
                  {contactpersoonBezig ? <SpinnerGap size={16} className="animate-spin" /> : null}
                  Contactpersoon toevoegen
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setNieuweContactpersoonModus(false); setContactpersoonFout(null) }} disabled={contactpersoonBezig}>
                  Terug
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {stap === 3 ? (
        <div className="flex flex-col gap-5">
          {!dossierResultaat ? (
            <>
              <div className="rounded-lg border border-border bg-muted/50 px-4 py-4 text-sm">
                <dl className="flex flex-col gap-2">
                  <div className="flex justify-between gap-3">
                    <dt className="text-foreground-muted">Klant</dt>
                    <dd className="font-medium text-primary">{geselecteerdeKlant.naam || geselecteerdeKlant.bedrijfsnaam}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-foreground-muted">Pand</dt>
                    <dd className="font-medium text-primary">{pand.omschrijving || pand.plaats || 'dit pand'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-foreground-muted">Primaire contactpersoon</dt>
                    <dd className="font-medium text-primary">{gekozenContactpersoon?.naam ?? 'Geen'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-foreground-muted">MJOP-gegevens</dt>
                    <dd className="font-medium text-primary">{building ? 'Aanwezig' : 'Niet aanwezig'}</dd>
                  </div>
                </dl>
              </div>
              <FoutMelding fout={dossierFout} />
              <div>
                <Button type="button" onClick={handleDossierOpenen} disabled={dossierBezig}>
                  {dossierBezig ? <SpinnerGap size={16} className="animate-spin" /> : null}
                  Adviesdossier openen
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-6">
              <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
                <CheckCircle size={18} weight="fill" className="text-accent" />
                {dossierResultaat.hergebruikt
                  ? 'Er was al een open dossier voor deze klant en dit pand — dat dossier is hervat.'
                  : 'Het dossier is geopend.'}
              </p>
              <AdviesBeheer dossier={dossierResultaat.dossier} building={building} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
