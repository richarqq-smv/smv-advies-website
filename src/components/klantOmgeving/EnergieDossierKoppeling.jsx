import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { useAuth } from '../../lib/auth/useAuth'
import { ROUTES } from '../../lib/routes'
import { energieScanResultToSnapshot } from '../../lib/dossier/energieAdapter'
import { prepareCalculationInput } from '../../lib/energieScan/validation'
import { getMijnKlant, listDossiersVoorKlant, listPandenVoorKlant, maakPandEnKoppel, openOfHergebruikDossier, saveEnergieSnapshot } from '../../lib/klantOmgeving/api'
import { kiesVoorkeursDossier } from '../../lib/klantOmgeving/dossierNavigatie'

const LEEG_PAND = { omschrijving: '', adres: '', postcode: '', plaats: '' }

/**
 * Auth-bewuste "brug" van de publieke Energie-indicatie naar de echte
 * klantomgeving (Energie-indicatie Fase 2) — zelfde rol en opzet als
 * MjopKlantKoppeling.jsx voor MJOP. Uitsluitend zichtbaar met een echte
 * sessie; de publieke calculator (StepBasisgegevens t/m StepContact,
 * ResultsView, EmailJS) werkt voor iedereen exact als voorheen, dit is
 * een puur aanvullende, nooit verplichte sectie.
 *
 * Hergebruikt bewust de bestaande Klant→Pand→Dossier-functies
 * (getMijnKlant/listPandenVoorKlant/listDossiersVoorKlant/
 * maakPandEnKoppel/openOfHergebruikDossier) — geen tweede klant- of
 * dossierflow. `openOfHergebruikDossier` opent/hergebruikt zoals altijd;
 * het opslaan van de snapshot zelf gaat via de eigen, kleine
 * saveEnergieSnapshot()-aanroep (Fase 2), met de dan bekende dossier_id.
 *
 * `voorkeurDossierId` (optioneel, Energie/MJOP/Advies-werkronde): als de
 * pagina vanuit een Adviesdossier is geopend (?dossierId=... op
 * ROUTES.energieIndicatie, zie EnergieIndicatie.jsx), wordt dat Dossier
 * hier automatisch voorgeselecteerd — mits het daadwerkelijk in
 * `openDossiers` voorkomt, dezelfde al tenant-veilige lijst
 * (listDossiersVoorKlant is altijd al gescoped op de EIGEN klant_id, zie
 * RLS dossiers_select). Een ongeldig of niet-eigen ID matcht simpelweg
 * niets in die lijst en valt terug op het bestaande standaardgedrag —
 * geen aparte lookup, geen nieuwe manier om een dossier_id te
 * vertrouwen.
 */
export function EnergieDossierKoppeling({ values, result, voorkeurDossierId = null }) {
  const { user, laden: authLaden } = useAuth()

  const [status, setStatus] = useState('laden') // 'laden' | 'geen-klant' | 'klaar'
  const [klant, setKlant] = useState(null)
  const [dossiers, setDossiers] = useState([]) // uitsluitend open Dossiers
  const [panden, setPanden] = useState([])

  const [gekozenDossierId, setGekozenDossierId] = useState('nieuw')
  const [gekozenPandId, setGekozenPandId] = useState('nieuw')
  const [nieuwPand, setNieuwPand] = useState(LEEG_PAND)

  const [toontOverschrijfBevestiging, setToontOverschrijfBevestiging] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [opgeslagenDossierId, setOpgeslagenDossierId] = useState(null)

  useEffect(() => {
    if (authLaden || !user) return
    let actief = true
    getMijnKlant()
      .then(async (mijnKlant) => {
        if (!actief) return
        if (!mijnKlant?.klant) {
          setStatus('geen-klant')
          return
        }
        setKlant(mijnKlant.klant)
        const [alleDossiers, allePanden] = await Promise.all([
          listDossiersVoorKlant(mijnKlant.klant.klant_id),
          listPandenVoorKlant(mijnKlant.klant.klant_id),
        ])
        if (!actief) return
        // Alleen open Dossiers zijn hier een zinvolle keuze — een afgerond
        // Dossier kan de snapshot toch nooit opslaan (bewaak_dossier_
        // integriteit blokkeert dat sowieso); ze buiten de lijst houden
        // voorkomt dat de gebruiker een gegarandeerd mislukte keuze maakt.
        const openDossiers = alleDossiers.filter((d) => d.status === 'open')
        setDossiers(openDossiers)
        setPanden(allePanden)
        setGekozenDossierId(kiesVoorkeursDossier(openDossiers, voorkeurDossierId))
        setStatus('klaar')
      })
      .catch(() => actief && setStatus('geen-klant'))
    return () => {
      actief = false
    }
  }, [authLaden, user, voorkeurDossierId])

  // Niet ingelogd, of nog bezig met bepalen of er een sessie is: helemaal
  // niets tonen — de publieke tool blijft daarmee pixel-voor-pixel
  // hetzelfde voor een anonieme bezoeker.
  if (authLaden || !user) return null
  if (status === 'laden') return null

  if (status === 'geen-klant') {
    return (
      <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm print:hidden">
        <p className="text-primary">
          Rond eerst uw{' '}
          <Link to={ROUTES.account} className="font-medium text-accent hover:underline">
            bedrijfsgegevens
          </Link>{' '}
          af om deze indicatie aan uw dossier te kunnen koppelen.
        </p>
      </div>
    )
  }

  if (opgeslagenDossierId) {
    return (
      <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 print:hidden">
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle size={18} weight="fill" className="text-accent" />
          Opgeslagen bij uw dossier.
        </p>
        <div className="mt-3">
          <Button as="link" to={ROUTES.dossier(opgeslagenDossierId)} variant="outline" size="sm">
            Naar dossier
          </Button>
        </div>
      </div>
    )
  }

  const gekozenDossier = dossiers.find((d) => d.dossier_id === gekozenDossierId) ?? null
  const heeftBestaandeSnapshot = gekozenDossierId !== 'nieuw' && gekozenDossier?.energie_snapshot != null

  function wijzigGekozenDossier(id) {
    setGekozenDossierId(id)
    setToontOverschrijfBevestiging(false)
    setFout(null)
  }

  async function daadwerkelijkOpslaan() {
    setBezig(true)
    setFout(null)
    try {
      // `values` (van useEnergieScan) staat nog in ruwe formuliervorm (string
      // oppervlakte, lege string i.p.v. null bij een niet-opgegeven
      // verbruiksveld) — exact dezelfde omzetting die submit() zelf al doet
      // vóór de berekening, hier hergebruikt vóór het bouwen van de snapshot.
      const snapshot = energieScanResultToSnapshot(prepareCalculationInput(values), result)
      let dossierId = gekozenDossierId

      if (dossierId === 'nieuw') {
        const pand =
          gekozenPandId === 'nieuw'
            ? await maakPandEnKoppel(klant.klant_id, nieuwPand)
            : (panden.find((p) => p.pand_id === gekozenPandId) ?? null)
        if (!pand) throw new Error('Geen geldig pand gekozen.')
        const { dossier } = await openOfHergebruikDossier({ klantId: klant.klant_id, pandId: pand.pand_id, pand })
        dossierId = dossier.dossier_id
      }

      await saveEnergieSnapshot(dossierId, snapshot)
      setOpgeslagenDossierId(dossierId)
    } catch {
      setFout('Opslaan bij uw dossier is niet gelukt. Probeer het opnieuw, of kies een ander dossier.')
    } finally {
      setBezig(false)
    }
  }

  function submit(e) {
    e.preventDefault()
    if (gekozenDossierId === 'nieuw' && gekozenPandId === 'nieuw' && !nieuwPand.adres.trim() && !nieuwPand.omschrijving.trim()) {
      setFout('Vul minimaal een adres of omschrijving in voor het nieuwe pand.')
      return
    }
    if (heeftBestaandeSnapshot && !toontOverschrijfBevestiging) {
      setToontOverschrijfBevestiging(true)
      return
    }
    daadwerkelijkOpslaan()
  }

  return (
    <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 print:hidden">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Uw account</p>
      <h3 className="text-lg text-primary">Opslaan bij mijn dossier</h3>
      <p className="mt-1 text-sm text-foreground-muted">
        Bewaar deze indicatie bij uw eigen dossier (bedrijf: <strong className="text-primary">{klant.naam || klant.bedrijfsnaam}</strong>) — optioneel, u
        kunt het resultaat hierboven ook gewoon laten staan zonder het op te slaan.
      </p>

      <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="energie-koppel-dossier" className="mb-1.5 block text-sm font-medium text-primary">
            Dossier
          </label>
          <select
            id="energie-koppel-dossier"
            value={gekozenDossierId}
            onChange={(e) => wijzigGekozenDossier(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          >
            {dossiers.map((d) => (
              <option key={d.dossier_id} value={d.dossier_id}>
                {d.panden?.omschrijving || d.panden?.adres || 'Naamloos pand'} (open)
              </option>
            ))}
            <option value="nieuw">Nieuw dossier aanmaken</option>
          </select>
        </div>

        {gekozenDossierId === 'nieuw' ? (
          <div>
            <label htmlFor="energie-koppel-pand" className="mb-1.5 block text-sm font-medium text-primary">
              Pand
            </label>
            <select
              id="energie-koppel-pand"
              value={gekozenPandId}
              onChange={(e) => setGekozenPandId(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            >
              <option value="nieuw">Nieuw pand aanmaken</option>
              {panden.map((pand) => (
                <option key={pand.pand_id} value={pand.pand_id}>
                  {pand.omschrijving || pand.adres || 'Naamloos pand'}
                </option>
              ))}
            </select>

            {gekozenPandId === 'nieuw' ? (
              <div className="mt-4 flex flex-col gap-4 rounded-lg border border-border bg-white p-4">
                <TextField id="energie-pand-omschrijving" label="Omschrijving" value={nieuwPand.omschrijving} onChange={(v) => setNieuwPand((s) => ({ ...s, omschrijving: v }))} />
                <TextField id="energie-pand-adres" label="Adres" value={nieuwPand.adres} onChange={(v) => setNieuwPand((s) => ({ ...s, adres: v }))} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField id="energie-pand-postcode" label="Postcode" value={nieuwPand.postcode} onChange={(v) => setNieuwPand((s) => ({ ...s, postcode: v }))} />
                  <TextField id="energie-pand-plaats" label="Plaats" value={nieuwPand.plaats} onChange={(v) => setNieuwPand((s) => ({ ...s, plaats: v }))} />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {toontOverschrijfBevestiging ? (
          <div className="rounded-lg border border-accent/40 bg-white p-4">
            <p className="flex items-start gap-1.5 text-sm font-medium text-primary">
              <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-accent" />
              Er staat al een Energie-indicatie bij dit dossier. Deze wordt vervangen door de nieuwe meting.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Button type="submit" size="sm" disabled={bezig}>
                {bezig ? <SpinnerGap size={16} className="animate-spin" /> : null}
                Ja, vervangen
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setToontOverschrijfBevestiging(false)} disabled={bezig}>
                Annuleren
              </Button>
            </div>
          </div>
        ) : null}

        {fout ? (
          <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
            <WarningCircle size={15} weight="fill" />
            {fout}
          </p>
        ) : null}

        {!toontOverschrijfBevestiging ? (
          <div>
            <Button type="submit" size="sm" disabled={bezig}>
              {bezig ? <SpinnerGap size={16} className="animate-spin" /> : null}
              Opslaan bij mijn dossier
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  )
}
