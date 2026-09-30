import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
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
  getMijnProfiel,
} from '../lib/klantOmgeving/api'
import { OPNAME_ONDERDELEN, magOpnameBewerken, OPNAME_STATUS_LABELS } from '../lib/klantOmgeving/opname'
import { OpnameStapper } from '../components/klantOmgeving/opname/OpnameStapper'
import { OpnameBasisgegevensStap } from '../components/klantOmgeving/opname/OpnameBasisgegevensStap'
import { OpnameOnderdeelStap } from '../components/klantOmgeving/opname/OpnameOnderdeelStap'
import { OpnameChecklistStap } from '../components/klantOmgeving/opname/OpnameChecklistStap'
import { OpnameAfrondenStap } from '../components/klantOmgeving/opname/OpnameAfrondenStap'

const STAPPEN = [
  { key: 'basis', label: 'Basisgegevens' },
  ...OPNAME_ONDERDELEN.map((o) => ({ key: o.onderdeel, label: o.label })),
  { key: 'checklist', label: 'Checklist' },
  { key: 'afronden', label: 'Afronden' },
]

/**
 * De mobiele opnameflow zelf (mobiele-opnameronde, 2026-09-30) —
 * `/admin/dossiers/:dossierId/opnames/:opnameId`, altijd onder AdminLayout
 * (geen publieke chrome, opdracht §14). Eén stap tegelijk (opdracht §4):
 * Basisgegevens -> 17 onderdelen (Dak t/m Energieverbruik, exacte
 * volgorde uit het opnameformulier) -> Checklist (de overige 5 fasen,
 * Voorbereiding staat al in Basisgegevens) -> Afronden. Alle content komt
 * uit src/lib/klantOmgeving/opname.js, letterlijk overgenomen uit de
 * brondocumenten.
 */
export default function AdminOpname() {
  const { dossierId, opnameId } = useParams()
  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [dossier, setDossier] = useState(null)
  const [opname, setOpname] = useState(null)
  const [waarnemingen, setWaarnemingen] = useState([])
  const [checklistItems, setChecklistItems] = useState([])
  const [documenten, setDocumenten] = useState([])
  const [adviseurNaam, setAdviseurNaam] = useState(null)
  const [huidigeIndex, setHuidigeIndex] = useState(0)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setNietGevonden(false)
    Promise.all([getDossier(dossierId), getOpname(opnameId), listOpnameWaarnemingen(opnameId), listOpnameChecklistItems(opnameId), getDocumentenVoorOpname(opnameId)])
      .then(([d, o, w, c, docs]) => {
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

  const waarnemingenPerOnderdeel = useMemo(() => {
    const groepen = {}
    waarnemingen.forEach((w) => {
      if (!groepen[w.onderdeel]) groepen[w.onderdeel] = []
      groepen[w.onderdeel].push(w)
    })
    return groepen
  }, [waarnemingen])

  const voltooideIndices = useMemo(() => {
    const set = new Set()
    STAPPEN.forEach((stap, index) => {
      if (stap.key === 'basis' && opname?.opname_datum) set.add(index)
      else if (stap.key === 'afronden' && opname?.status === 'afgerond') set.add(index)
      else if ((waarnemingenPerOnderdeel[stap.key]?.length ?? 0) > 0) set.add(index)
    })
    return set
  }, [opname, waarnemingenPerOnderdeel])

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

  if (laden) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-foreground-muted">Bezig met laden...</p>
      </div>
    )
  }

  if (nietGevonden || !dossier || !opname) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
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
      <div className="border-b border-border bg-white px-4 py-3">
        <Button to={ROUTES.adminDossierDetail(dossierId)} variant="ghost" size="sm" className="-ml-3">
          <ArrowLeft size={16} /> Terug naar dossier
        </Button>
        <p className="mt-1 text-xs text-foreground-muted">
          Status: <span className="font-medium text-primary">{OPNAME_STATUS_LABELS[opname.status] ?? opname.status}</span>
          {!magBewerken ? ' — bewerken uitgeschakeld (afgerond)' : ''}
        </p>
      </div>

      <OpnameStapper stappen={STAPPEN} huidigeIndex={huidigeIndex} voltooideIndices={voltooideIndices} onSpringNaar={setHuidigeIndex} />

      <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {huidigeStap.key === 'basis' ? (
          <OpnameBasisgegevensStap
            opname={opname}
            dossier={dossier}
            adviseurNaam={adviseurNaam}
            magBewerken={magBewerken}
            checklistItems={checklistItems}
            onOpnameChange={setOpname}
            onChecklistToggle={checklistToggle}
          />
        ) : huidigeStap.key === 'checklist' ? (
          <OpnameChecklistStap
            title="Checklist locatiebezoek"
            checklistItems={checklistItems}
            fasen={['bouwkundig', 'installaties', 'verbruik', 'fotos', 'afronding']}
            magBewerken={magBewerken}
            onToggle={checklistToggle}
          />
        ) : huidigeStap.key === 'afronden' ? (
          <OpnameAfrondenStap
            opname={opname}
            checklistItems={checklistItems}
            waarnemingen={waarnemingen}
            magBewerken={magBewerken}
            onOpnameChange={setOpname}
            onGaNaarStap={springNaarStap}
          />
        ) : (
          <OpnameOnderdeelStap
            onderdeel={huidigeStap.key}
            label={huidigeStap.label}
            waarnemingen={waarnemingenPerOnderdeel[huidigeStap.key] ?? []}
            magBewerken={magBewerken}
            opnameId={opnameId}
            klantId={dossier.klant_id}
            documenten={documenten}
            onWaarnemingToegevoegd={waarnemingToegevoegd}
            onWaarnemingChange={waarnemingChange}
            onWaarnemingVerwijderd={waarnemingVerwijderd}
            onDocumentGeupload={documentGeupload}
          />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-white px-4 py-3">
        <Button type="button" variant="outline" onClick={vorige} disabled={huidigeIndex === 0} className="min-h-11 flex-1">
          <ArrowLeft size={16} /> Vorige
        </Button>
        <Button type="button" onClick={volgende} disabled={huidigeIndex === STAPPEN.length - 1} className="min-h-11 flex-1">
          Volgende <ArrowRight size={16} />
        </Button>
      </div>
    </>
  )
}
