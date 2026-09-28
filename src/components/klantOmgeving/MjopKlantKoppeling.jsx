import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, WarningCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { useAuth } from '../../lib/auth/useAuth'
import { ROUTES } from '../../lib/routes'
import { buildingToPandInput, createMjopSnapshotFromBuilding } from '../../lib/dossier/mjopAdapter'
import { getMijnKlant, listPandenVoorKlant, maakPandEnKoppel, updatePand, openOfHergebruikDossier } from '../../lib/klantOmgeving/api'

/**
 * De auth-bewuste "brug" tussen de MJOP-tool en de échte, Supabase-backed
 * klantomgeving. Sinds de werkfase-opvolging op de SMV-audit (Fase 1,
 * 2026-09-28) is dit de ENIGE actieve weg van een MJOP-building naar een
 * Adviesdossier — de oude, localStorage-gebaseerde KlantDossierFlow is
 * teruggetrokken uit MjopTool.jsx (zie components/dossier/KlantDossierFlow.jsx
 * voor de volledige toelichting waarom dat bestand niet is verwijderd).
 *
 * Toont nu altijd iets zinvols in plaats van zichzelf te verbergen:
 * - geen sessie: een duidelijke uitnodiging om in te loggen/registreren
 *   (voorheen: render niets, waardoor een uitgelogde gebruiker stilzwijgend
 *   terugviel op de oude flow hieronder — die optie bestaat niet meer).
 * - sessie zonder gekoppelde Klant: bestaande "rond eerst uw bedrijfsgegevens
 *   af"-melding (ongewijzigd).
 * - sessie met Klant: het bestaande koppelformulier (ongewijzigd).
 *
 * Hergebruikt bewust dezelfde pure adapterfuncties als de bestaande
 * localStorage-koppeling (buildingToPandInput/createMjopSnapshotFromBuilding
 * uit lib/dossier/mjopAdapter.js) — geen tweede, parallelle vertaallaag.
 */
export function MjopKlantKoppeling({ building }) {
  const { user, laden: authLaden } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState('laden') // 'laden' | 'geen-klant' | 'klaar'
  const [klant, setKlant] = useState(null)
  const [panden, setPanden] = useState([])
  const [gekozenPandId, setGekozenPandId] = useState('nieuw')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

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
        const lijst = await listPandenVoorKlant(mijnKlant.klant.klant_id)
        if (!actief) return
        setPanden(lijst)
        setStatus('klaar')
      })
      .catch(() => actief && setStatus('geen-klant'))
    return () => {
      actief = false
    }
  }, [authLaden, user])

  if (authLaden) return null

  if (!user) {
    return (
      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm print:hidden">
        <p className="text-primary">
          <Link to={ROUTES.inloggen} className="font-medium text-accent hover:underline">Log in</Link> of{' '}
          <Link to={ROUTES.registreren} className="font-medium text-accent hover:underline">maak een account</Link> om deze MJOP-gegevens te koppelen aan een
          Adviesdossier — dit is de enige weg naar een dossier, ook voor intern gebruik.
        </p>
      </div>
    )
  }

  if (status === 'laden') return null

  if (status === 'geen-klant') {
    return (
      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-sm print:hidden">
        <p className="text-primary">
          Rond eerst uw <Link to={ROUTES.account} className="font-medium text-accent hover:underline">bedrijfsgegevens</Link> af om deze MJOP-gegevens aan uw
          account te koppelen.
        </p>
      </div>
    )
  }

  async function koppelEnOpenDossier(e) {
    e.preventDefault()
    setFout(null)
    setBezig(true)
    try {
      const pandInput = buildingToPandInput(building)
      const mjopSnapshot = createMjopSnapshotFromBuilding(building)

      const pand = gekozenPandId === 'nieuw' ? await maakPandEnKoppel(klant.klant_id, pandInput) : await updatePand(gekozenPandId, pandInput)

      const { dossier } = await openOfHergebruikDossier({ klantId: klant.klant_id, pandId: pand.pand_id, pand, mjopSnapshot })
      navigate(ROUTES.dossier(dossier.dossier_id))
    } catch {
      setFout('Koppelen aan uw account is niet gelukt. Probeer het opnieuw.')
      setBezig(false)
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6 print:hidden">
      <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Uw account</p>
      <h3 className="text-lg text-primary">Koppel deze MJOP-gegevens aan uw pand</h3>
      <p className="mt-1 text-sm text-foreground-muted">
        Dit slaat de huidige MJOP-gegevens op bij uw eigen, ingelogde account (bedrijf: <strong className="text-primary">{klant.naam || klant.bedrijfsnaam}</strong>) en opent
        daar een adviesdossier — anders dan de testdata/lokale opslag hierboven, die alleen in deze browser blijft.
      </p>

      <form onSubmit={koppelEnOpenDossier} className="mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="mjop-koppel-pand" className="mb-1.5 block text-sm font-medium text-primary">
            Pand
          </label>
          <select
            id="mjop-koppel-pand"
            value={gekozenPandId}
            onChange={(e) => setGekozenPandId(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
          >
            <option value="nieuw">Nieuw pand aanmaken van deze MJOP-gegevens</option>
            {panden.map((pand) => (
              <option key={pand.pand_id} value={pand.pand_id}>
                {pand.omschrijving || pand.adres || 'Naamloos pand'}
              </option>
            ))}
          </select>
        </div>

        {fout ? (
          <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
            <WarningCircle size={15} weight="fill" />
            {fout}
          </p>
        ) : null}

        <div>
          <Button type="submit" size="sm" disabled={bezig}>
            {bezig ? <SpinnerGap size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Koppelen en dossier openen
          </Button>
        </div>
      </form>
    </div>
  )
}
