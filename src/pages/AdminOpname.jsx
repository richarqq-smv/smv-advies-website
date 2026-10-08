import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../lib/routes'
import {
  getDossier,
  getOpname,
  listOpnameWaarnemingen,
  listOpnameChecklistItems,
  getDocumentenVoorOpname,
  setOpnameChecklistItem,
  updateOpnameStatus,
  getMijnProfiel,
  listDossierSubsidieSpecificaties,
  upsertDossierSubsidieSpecificatie,
} from '../lib/klantOmgeving/api'
import { magOpnameBewerken, OPNAME_STATUS_LABELS, berekenChecklistVoortgang, groepeerWaarnemingenPerOnderdeel, OPNAME_ONDERDEEL_CODES } from '../lib/klantOmgeving/opname'
import { naarSpecificatiesPerMaatregel, naarCamelCaseSpecificatie } from '../lib/subsidie/subsidieSpecificatieMapping'
import { OpnameStapper } from '../components/klantOmgeving/opname/OpnameStapper'
import { OpnameBasisgegevensStap } from '../components/klantOmgeving/opname/OpnameBasisgegevensStap'
import { OpnameOnderdelenStap } from '../components/klantOmgeving/opname/OpnameOnderdelenStap'
import { OpnameChecklistStap } from '../components/klantOmgeving/opname/OpnameChecklistStap'
import { OpnameAfrondenStap } from '../components/klantOmgeving/opname/OpnameAfrondenStap'

const STAPPEN = [
  { key: 'basis', label: 'Basisgegevens' },
  { key: 'onderdelen', label: 'Onderdelen' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'afronden', label: 'Afronden' },
]

/**
 * De mobiele opnameflow zelf (mobiele-opnameronde 2026-09-30, compacte
 * accordion-UX-ronde 2026-10-01) — `/admin/dossiers/:dossierId/opnames/
 * :opnameId`, altijd onder AdminLayout (geen publieke chrome, opdracht
 * §14 van de vorige ronde). Vier stappen: Basisgegevens -> Onderdelen
 * (alle 17 als accordion, opdracht §1) -> Checklist (alle 6 fasen als
 * accordion, opdracht §8) -> Afronden. Alle content komt uit
 * src/lib/klantOmgeving/opname.js, letterlijk overgenomen uit de
 * brondocumenten — deze ronde verandert uitsluitend de visuele
 * presentatie, geen data/velden/database.
 */
export default function AdminOpname() {
  const { dossierId, opnameId } = useParams()
  const navigate = useNavigate()
  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [dossier, setDossier] = useState(null)
  const [opname, setOpname] = useState(null)
  const [waarnemingen, setWaarnemingen] = useState([])
  const [checklistItems, setChecklistItems] = useState([])
  const [documenten, setDocumenten] = useState([])
  const [adviseurNaam, setAdviseurNaam] = useState(null)
  const [huidigeIndex, setHuidigeIndex] = useState(0)
  const [afrondenBezig, setAfrondenBezig] = useState(false)
  const [afrondenFout, setAfrondenFout] = useState(null)
  const [subsidieSpecificaties, setSubsidieSpecificaties] = useState({})
  const [subsidieOpslaanBezig, setSubsidieOpslaanBezig] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setNietGevonden(false)
    Promise.all([
      getDossier(dossierId),
      getOpname(opnameId),
      listOpnameWaarnemingen(opnameId),
      listOpnameChecklistItems(opnameId),
      getDocumentenVoorOpname(opnameId),
      listDossierSubsidieSpecificaties(dossierId),
    ])
      .then(([d, o, w, c, docs, subsidieRijen]) => {
        if (!actief) return
        if (o.dossier_id !== dossierId) {
          setNietGevonden(true)
          return
        }
        setDossier(d)
        setOpname(o)
        setWaarnemingen(w)
        setChecklistItems(c)
        setDocumenten(docs)
        setSubsidieSpecificaties(naarSpecificatiesPerMaatregel(subsidieRijen))
      })
      .catch(() => actief && setNietGevonden(true))
      .finally(() => actief && setLaden(false))
    getMijnProfiel()
      .then((p) => actief && setAdviseurNaam(p?.naam ?? null))
      .catch(() => {})
    return () => {
      actief = false
    }
  }, [dossierId, opnameId])

  const magBewerken = magOpnameBewerken(opname)
  const isLaatsteStap = huidigeIndex === STAPPEN.length - 1
  const checklistVoortgang = useMemo(() => berekenChecklistVoortgang(checklistItems), [checklistItems])

  const waarnemingenPerOnderdeel = useMemo(() => groepeerWaarnemingenPerOnderdeel(waarnemingen), [waarnemingen])

  const voltooideIndices = useMemo(() => {
    const set = new Set()
    if (opname?.opname_datum) set.add(0)
    if (OPNAME_ONDERDEEL_CODES.every((code) => (waarnemingenPerOnderdeel[code]?.length ?? 0) > 0)) set.add(1)
    if (berekenChecklistVoortgang(checklistItems).compleet) set.add(2)
    if (opname?.status === 'afgerond') set.add(3)
    return set
  }, [opname, waarnemingenPerOnderdeel, checklistItems])

  function springNaarStap(key) {
    const index = STAPPEN.findIndex((s) => s.key === key)
    if (index >= 0) {
      setHuidigeIndex(index)
      window.scrollTo(0, 0)
    }
  }

  function volgende() {
    setHuidigeIndex((i) => Math.min(i + 1, STAPPEN.length - 1))
    window.scrollTo(0, 0)
  }
  function vorige() {
    setHuidigeIndex((i) => Math.max(i - 1, 0))
    window.scrollTo(0, 0)
  }

  async function afronden() {
    setAfrondenFout(null)
    setAfrondenBezig(true)
    try {
      await updateOpnameStatus(opnameId, 'afgerond')
      navigate(ROUTES.adminDossierDetail(dossierId))
    } catch {
      setAfrondenFout('Afronden is niet gelukt. Probeer het opnieuw.')
      setAfrondenBezig(false)
    }
  }

  async function checklistToggle(itemCode, afgevinkt) {
    const bijgewerkt = await setOpnameChecklistItem(opnameId, itemCode, afgevinkt)
    setChecklistItems((rows) => {
      const zonder = rows.filter((r) => r.item_code !== itemCode)
      return [...zonder, bijgewerkt]
    })
  }

  function waarnemingToegevoegd(nieuw) {
    setWaarnemingen((rows) => [...rows, nieuw])
  }
  function waarnemingChange(bijgewerkt) {
    setWaarnemingen((rows) => rows.map((r) => (r.waarneming_id === bijgewerkt.waarneming_id ? bijgewerkt : r)))
  }
  function waarnemingVerwijderd(waarnemingId) {
    setWaarnemingen((rows) => rows.filter((r) => r.waarneming_id !== waarnemingId))
  }
  function documentGeupload(doc) {
    setDocumenten((rows) => [doc, ...rows])
  }

  /** Schrijft rechtstreeks naar dossier_subsidie_specificaties — dezelfde tabel/upsert als AdminSubsidieBegeleiding.jsx, dus wat hier wordt ingevuld staat daar meteen (opdracht: "gegevens één keer invoeren"). */
  async function subsidieWijzig(maatregelKey, veld, waarde) {
    setSubsidieOpslaanBezig(maatregelKey)
    try {
      const bijgewerkt = await upsertDossierSubsidieSpecificatie(dossierId, maatregelKey, { [veld]: waarde })
      setSubsidieSpecificaties((v) => ({ ...v, [maatregelKey]: naarCamelCaseSpecificatie(bijgewerkt) }))
    } finally {
      setSubsidieOpslaanBezig(null)
    }
  }

  if (laden) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-foreground-muted">Bezig met laden...</p>
      </div>
    )
  }

  if (nietGevonden || !dossier || !opname) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Button to={ROUTES.adminDossierDetail(dossierId)} variant="ghost" size="sm" className="-ml-3 mb-4">
          <ArrowLeft size={16} /> Terug naar dossier
        </Button>
        <p className="rounded-lg border border-dashed border-border px-5 py-6 text-center text-sm text-foreground-muted">
          Deze opname bestaat niet, of u heeft er geen toegang toe.
        </p>
      </div>
    )
  }

  const huidigeStap = STAPPEN[huidigeIndex]

  return (
    <>
      <Seo title="Opname" description="Opnameflow locatiebezoek." noindex />
      <div className="border-b border-border bg-white px-4 py-2">
        <Button to={ROUTES.adminDossierDetail(dossierId)} variant="ghost" size="sm" className="-ml-3">
          <ArrowLeft size={16} /> Terug naar dossier
        </Button>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Status: <span className="font-medium text-primary">{OPNAME_STATUS_LABELS[opname.status] ?? opname.status}</span>
          {!magBewerken ? ' — bewerken uitgeschakeld (afgerond)' : ''}
        </p>
      </div>

      <OpnameStapper stappen={STAPPEN} huidigeIndex={huidigeIndex} voltooideIndices={voltooideIndices} onSpringNaar={setHuidigeIndex} />

      <div className="mx-auto max-w-3xl px-4 py-6 pb-32">
        {huidigeStap.key === 'basis' ? (
          <OpnameBasisgegevensStap opname={opname} dossier={dossier} adviseurNaam={adviseurNaam} magBewerken={magBewerken} onOpnameChange={setOpname} />
        ) : huidigeStap.key === 'onderdelen' ? (
          <OpnameOnderdelenStap
            waarnemingenPerOnderdeel={waarnemingenPerOnderdeel}
            magBewerken={magBewerken}
            opnameId={opnameId}
            klantId={dossier.klant_id}
            documenten={documenten}
            onWaarnemingToegevoegd={waarnemingToegevoegd}
            onWaarnemingChange={waarnemingChange}
            onWaarnemingVerwijderd={waarnemingVerwijderd}
            onDocumentGeupload={documentGeupload}
            subsidieSpecificaties={subsidieSpecificaties}
            subsidieOpslaanBezig={subsidieOpslaanBezig}
            onSubsidieWijzig={subsidieWijzig}
          />
        ) : huidigeStap.key === 'checklist' ? (
          <OpnameChecklistStap checklistItems={checklistItems} magBewerken={magBewerken} onToggle={checklistToggle} />
        ) : (
          <OpnameAfrondenStap
            opname={opname}
            checklistItems={checklistItems}
            waarnemingen={waarnemingen}
            magBewerken={magBewerken}
            onOpnameChange={setOpname}
            onGaNaarStap={springNaarStap}
          />
        )}
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-border bg-white px-4 pt-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {afrondenFout ? (
          <p role="alert" className="text-xs font-medium text-error">
            {afrondenFout}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={vorige} disabled={huidigeIndex === 0} className="min-h-11 flex-1">
            <ArrowLeft size={16} /> Vorige
          </Button>
          {isLaatsteStap && magBewerken ? (
            <Button type="button" onClick={afronden} disabled={afrondenBezig || !checklistVoortgang.compleet} className="min-h-11 flex-1">
              {afrondenBezig ? 'Bezig...' : (
                <>
                  Afronden <Check size={16} />
                </>
              )}
            </Button>
          ) : isLaatsteStap ? (
            <Button type="button" disabled className="min-h-11 flex-1">
              <Check size={16} /> Afgerond
            </Button>
          ) : (
            <Button type="button" onClick={volgende} disabled={huidigeIndex === STAPPEN.length - 1} className="min-h-11 flex-1">
              Volgende <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
