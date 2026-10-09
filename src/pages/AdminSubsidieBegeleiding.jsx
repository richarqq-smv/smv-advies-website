import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowSquareOut, FileArrowDown, Info, WarningCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { AdminTerugKnop } from '../components/admin/AdminTerugKnop'
import { ROUTES } from '../lib/routes'
import {
  getDossier,
  listDossierSubsidieSpecificaties,
  upsertDossierSubsidieSpecificatie,
  listOpnamesVoorDossier,
  listOpnameWaarnemingen,
  listDossierTaken,
  addDossierTakenBulk,
  updateDossierTaak,
  uploadDocument,
  getMijnProfiel,
  addDossierSubsidie,
  listDossierSubsidies,
} from '../lib/klantOmgeving/api'
import { bouwSubsidieAanvraagChecklist } from '../lib/dossier/dossierTaken'
import { ONDERSTEUNDE_MAATREGELEN, TECHNISCHE_EENHEID_PER_MAATREGEL } from '../lib/subsidie/isdeIsolatieRegels'
import { ONDERSTEUNDE_APPARAATMAATREGELEN } from '../lib/subsidie/isdeApparaatRegels'
import { SUBSIDIE_STATUSSEN } from '../lib/subsidie/subsidieEligibility'
import { bouwSubsidieDocumentData } from '../lib/subsidie/subsidieDocumentData'
import { genereerSubsidieDocumentDocxBlob, bouwSubsidieDocumentBestandsnaam } from '../lib/subsidie/subsidieDocumentDocx'
import { naarCamelCaseSpecificatie } from '../lib/subsidie/subsidieSpecificatieMapping'
import { IsolatieInvoerVelden, ApparaatInvoerVelden, VentilatieInvoerVelden } from '../components/subsidie/SubsidieInvoerVelden'
import { FISCAAL_RELEVANTIE_STATUS_LABELS } from '../lib/subsidie/fiscaleKoppeling'
import { FISCALE_REGELING_PARAMETERS, FISCALE_REGELING_SOORT_LABELS } from '../lib/subsidie/fiscaleRegelingParameters'
import { buildInsights } from '../lib/mjop/linking'
import { buildEnergieInsights } from '../lib/dossier/energieInsights'
import { isZakelijkPand } from '../lib/klantOmgeving/afspraakBeschikbaarheid'
import NotFound from './NotFound'

const INPUT_CLASSNAME = 'w-full rounded-lg border border-border px-3 py-2 text-sm'
const SELECT_CLASSNAME = 'w-full rounded-lg border border-border px-3 py-2 text-sm'

const STATUS_BADGE = {
  [SUBSIDIE_STATUSSEN.VAN_TOEPASSING]: 'bg-primary/10 text-primary',
  [SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING]: 'bg-accent/10 text-accent',
  [SUBSIDIE_STATUSSEN.CONTROLE_VEREIST]: 'bg-amber-100 text-amber-800',
  [SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS]: 'bg-muted text-foreground-muted',
  [SUBSIDIE_STATUSSEN.NIET_VAN_TOEPASSING]: 'bg-error-bg text-error',
  [SUBSIDIE_STATUSSEN.VOORWAARDE_ONTBREEKT]: 'bg-amber-100 text-amber-800',
}

const FISCAAL_STATUS_BADGE = {
  mogelijk_relevant: 'bg-accent/10 text-accent',
  controle_vereist: 'bg-amber-100 text-amber-800',
  niet_van_toepassing: 'bg-error-bg text-error',
}

const ONDERDEEL_PER_MAATREGEL = { dakisolatie: 'dak', gevelisolatie: 'gevel', vloerisolatie: 'vloer', glasHrpp: 'glas', glasTriple: 'glas' }

const ALLE_MAATREGEL_KEYS = [...ONDERSTEUNDE_MAATREGELEN, ...ONDERSTEUNDE_APPARAATMAATREGELEN, 'ventilatie']

// "zakelijk" toegevoegd in de EIA/MIA/Vamil-uitbreidingsronde
// (2026-10-09, 0042_dossier_subsidie_specificaties_doelgroep_zakelijk.sql):
// ISDE in deze engine is onderzocht voor woningeigenaren — een zakelijk
// pand (kantoor/horeca/bedrijfshal e.d.) hoort hier expliciet niet
// stilzwijgend als "eigenaar_bewoner" te worden behandeld.
const DOELGROEP_OPTIES = [
  { waarde: 'eigenaar_bewoner', label: 'Eigenaar-bewoner (ISDE)' },
  { waarde: 'zakelijk', label: 'Zakelijk pand / ondernemer (EIA/MIA/Vamil)' },
  { waarde: 'vve', label: 'VvE' },
  { waarde: 'overig', label: 'Verhuurder / overig' },
]

/**
 * Subsidie-aanvraagbegeleiding (opdracht: "Subsidiehulp voor adviseur
 * volledig herontwerpen", uitgebreid in de inhoudelijke uitbreidingsronde
 * naar vloer-/bodemisolatie en apparaatmaatregelen) —
 * `/admin/dossiers/:dossierId/subsidie`. Eén overzichtspagina die de
 * subsidie-engine (lib/subsidie/) generiek voedt voor alle ondersteunde
 * maatregelen (isolatie + apparaten) met admin-ingevoerde technische
 * input (dossier_subsidie_specificaties) en de bestaande opname-
 * waarnemingen puur ter referentie toont (nooit automatisch
 * geïnterpreteerd, opdracht §12/75). Admin-only: deze route zit alleen
 * onder RequireAuth -> RequireAdmin -> AdminLayout (App.jsx), en de
 * onderliggende tabel heeft uitsluitend is_admin()-RLS.
 */
export default function AdminSubsidieBegeleiding() {
  const { dossierId } = useParams()
  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [dossier, setDossier] = useState(null)
  const [specificaties, setSpecificaties] = useState({})
  const [waarnemingen, setWaarnemingen] = useState([])
  const [taken, setTaken] = useState([])
  const [adviseurNaam, setAdviseurNaam] = useState(null)
  const [uitvoeringsjaar, setUitvoeringsjaar] = useState('')
  const [doelgroep, setDoelgroep] = useState('eigenaar_bewoner')
  const [opslaanBezig, setOpslaanBezig] = useState(null)
  const [genererenBezig, setGenererenBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [laatstGegenereerd, setLaatstGegenereerd] = useState(null)
  const [bestaandeSubsidies, setBestaandeSubsidies] = useState([])
  const [toevoegenBezigId, setToevoegenBezigId] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setNietGevonden(false)
    Promise.all([
      getDossier(dossierId),
      listDossierSubsidieSpecificaties(dossierId),
      listOpnamesVoorDossier(dossierId),
      listDossierTaken(dossierId),
      getMijnProfiel(),
      listDossierSubsidies(dossierId),
    ])
      .then(async ([dossierRij, specs, opnames, takenRijen, profiel, subsidieRijen]) => {
        if (!actief) return
        setDossier(dossierRij)
        const perMaatregel = {}
        specs.forEach((s) => {
          perMaatregel[s.maatregel_key] = naarCamelCaseSpecificatie(s)
        })
        setSpecificaties(perMaatregel)
        const eersteJaar = specs.find((s) => s.uitvoeringsjaar)?.uitvoeringsjaar
        if (eersteJaar) setUitvoeringsjaar(String(eersteJaar))
        const eersteDoelgroep = specs.find((s) => s.doelgroep && s.doelgroep !== 'eigenaar_bewoner')?.doelgroep
        if (eersteDoelgroep) {
          setDoelgroep(eersteDoelgroep)
        } else if (specs.length === 0 && isZakelijkPand(dossierRij.panden?.gebruikstype)) {
          // Nog niets opgeslagen voor dit dossier én het pandtype is al
          // bekend als zakelijk — toon direct de juiste suggestie i.p.v.
          // "eigenaar_bewoner" te laten staan totdat de adviseur het zelf
          // opmerkt. Puur een UI-default: pas bij de eerste daadwerkelijke
          // wijziging (opslaanDoelgroep) wordt dit ook echt opgeslagen.
          setDoelgroep('zakelijk')
        }
        setTaken(takenRijen.filter((t) => t.categorie === 'subsidie'))
        setAdviseurNaam(profiel?.naam ?? null)
        setBestaandeSubsidies(subsidieRijen)
        const alleWaarnemingen = (await Promise.all(opnames.map((o) => listOpnameWaarnemingen(o.opname_id)))).flat()
        if (actief) setWaarnemingen(alleWaarnemingen)
      })
      .catch(() => actief && setNietGevonden(true))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  // EIA/MIA/Vamil-uitbreidingsronde (2026-10-09): zelfde insights-functies
  // als SubsidieCheck.jsx/DossierDetail.jsx al gebruiken — geen nieuwe
  // berekeningslogica, puur hergebruik. bouwSubsidieDocumentData() kan deze
  // functies niet zelf importeren (zie de moduledoc daar), dus deze pagina
  // berekent ze en geeft de resultaten door.
  const mjopInsights = useMemo(() => (dossier?.mjop_snapshot?.components ? buildInsights(dossier.mjop_snapshot) : []), [dossier])
  const energieInsights = useMemo(() => buildEnergieInsights(dossier?.energie_snapshot), [dossier])

  const documentData = useMemo(() => {
    if (!dossier) return null
    return bouwSubsidieDocumentData({
      dossier,
      specificatiesPerMaatregel: specificaties,
      waarnemingen,
      uitvoeringsjaar: uitvoeringsjaar ? Number(uitvoeringsjaar) : null,
      adviseurNaam,
      mjopInsights,
      energieInsights,
    })
  }, [dossier, specificaties, waarnemingen, uitvoeringsjaar, adviseurNaam, mjopInsights, energieInsights])

  const bestaandeRegelingNamen = useMemo(() => new Set(bestaandeSubsidies.map((s) => s.regeling_naam.trim().toLowerCase())), [bestaandeSubsidies])

  /**
   * "Toevoegen aan dossier" voor een EIA/MIA/Vamil-bedrijfsmiddel —
   * hergebruikt EXACT dezelfde addDossierSubsidie()/dossier_subsidies als
   * de ISDE-regelingen en de generieke RVO-index (SubsidieCheck.jsx): geen
   * tweede opslagpad, geen nieuwe tabel. De regelingnaam bevat de code en
   * regeling(en) zodat de rij in de dossier_subsidies-lijst zelfstandig
   * herkenbaar blijft.
   */
  async function fiscaalToevoegenAlsTraject(bedrijfsmiddel) {
    setToevoegenBezigId(bedrijfsmiddel.id)
    setFout(null)
    try {
      const regelingNaam = `${bedrijfsmiddel.regelingen.map((r) => r.toUpperCase()).join('/')} — ${bedrijfsmiddel.titel}${bedrijfsmiddel.bedrijfsmiddelcode ? ` (code ${bedrijfsmiddel.bedrijfsmiddelcode})` : ''}`
      const nieuw = await addDossierSubsidie(dossierId, { regelingNaam })
      setBestaandeSubsidies((v) => [...v, nieuw])
    } catch {
      setFout('Toevoegen aan dossier is niet gelukt. Probeer het opnieuw.')
    } finally {
      setToevoegenBezigId(null)
    }
  }

  async function opslaanJaar(waarde) {
    setUitvoeringsjaar(waarde)
    const jaar = waarde ? Number(waarde) : null
    await Promise.all(ALLE_MAATREGEL_KEYS.map((m) => upsertDossierSubsidieSpecificatie(dossierId, m, { uitvoeringsjaar: jaar })))
    setSpecificaties((v) => {
      const bijgewerkt = { ...v }
      ALLE_MAATREGEL_KEYS.forEach((m) => {
        bijgewerkt[m] = { ...(v[m] ?? {}), uitvoeringsjaar: jaar }
      })
      return bijgewerkt
    })
  }

  async function opslaanDoelgroep(waarde) {
    setDoelgroep(waarde)
    await Promise.all(ALLE_MAATREGEL_KEYS.map((m) => upsertDossierSubsidieSpecificatie(dossierId, m, { doelgroep: waarde })))
    setSpecificaties((v) => {
      const bijgewerkt = { ...v }
      ALLE_MAATREGEL_KEYS.forEach((m) => {
        bijgewerkt[m] = { ...(v[m] ?? {}), doelgroep: waarde }
      })
      return bijgewerkt
    })
  }

  async function wijzigSpecificatie(maatregelKey, veld, waarde) {
    setOpslaanBezig(maatregelKey)
    setFout(null)
    try {
      const payload = { [veld]: waarde }
      const bijgewerkt = await upsertDossierSubsidieSpecificatie(dossierId, maatregelKey, payload)
      setSpecificaties((v) => ({ ...v, [maatregelKey]: naarCamelCaseSpecificatie(bijgewerkt) }))
    } catch {
      setFout('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally {
      setOpslaanBezig(null)
    }
  }

  async function vulStandaardChecklist() {
    const nieuw = await addDossierTakenBulk(dossierId, bouwSubsidieAanvraagChecklist())
    setTaken((v) => [...v, ...nieuw])
  }

  async function wijzigTaakStatus(taakId, afgerond) {
    const bijgewerkt = await updateDossierTaak(taakId, { status: afgerond ? 'afgerond' : 'open' })
    setTaken((v) => v.map((t) => (t.taak_id === taakId ? bijgewerkt : t)))
  }

  async function genereerSubsidieblad() {
    if (!documentData || !dossier) return
    setGenererenBezig(true)
    setFout(null)
    try {
      const blob = await genereerSubsidieDocumentDocxBlob(documentData)
      const bestandsnaam = bouwSubsidieDocumentBestandsnaam(documentData)
      const file = new File([blob], bestandsnaam, { type: blob.type })
      await uploadDocument({ klantId: dossier.klant_id, dossierId: dossier.dossier_id, file, omschrijving: 'Subsidieadvies (gegenereerd)' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = bestandsnaam
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setLaatstGegenereerd(bestandsnaam)
    } catch {
      setFout('Het genereren van het subsidieblad is niet gelukt. Probeer het opnieuw.')
    } finally {
      setGenererenBezig(false)
    }
  }

  if (laden) return null
  if (nietGevonden || !dossier) return <NotFound />

  const officieleBron = documentData?.bronnen?.[0] ?? null
  const isolatieMaatregelen = documentData?.maatregelen.filter((m) => m.soort === 'isolatie') ?? []
  const apparaatMaatregelen = documentData?.maatregelen.filter((m) => m.soort === 'apparaat') ?? []
  const ventilatieMaatregel = documentData?.maatregelen.find((m) => m.soort === 'ventilatie') ?? null

  return (
    <>
      <Seo title="Subsidiebegeleiding" description="Subsidiebegeleiding voor dit dossier." noindex />
      <Section tone="white" noTopPadding>
        <Container wide>
          <AdminTerugKnop to={ROUTES.adminDossierDetail(dossierId)} label="Terug naar dossier" />

          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Subsidiebegeleiding</p>
          <h1 className="mb-1 text-2xl text-primary sm:text-3xl">Subsidieaanvraag voorbereiden</h1>
          <p className="mb-6 text-sm text-foreground-muted">
            {dossier.klanten?.bedrijfsnaam || dossier.klanten?.naam || 'Dit dossier'} — {dossier.panden?.adres ?? 'adres onbekend'}
          </p>

          <div className="mb-6 grid gap-4 sm:max-w-md sm:grid-cols-2">
            <div>
              <label htmlFor="uitvoeringsjaar" className="mb-1 block text-xs font-medium text-foreground-muted">
                Uitvoeringsjaar
              </label>
              <input
                id="uitvoeringsjaar"
                type="number"
                inputMode="numeric"
                placeholder="Bijv. 2026"
                className={INPUT_CLASSNAME}
                value={uitvoeringsjaar}
                onChange={(e) => opslaanJaar(e.target.value)}
              />
              {!uitvoeringsjaar ? <p className="mt-1 text-xs text-amber-700">Uitvoeringsjaar ontbreekt — subsidie kan nog niet definitief worden bepaald.</p> : null}
            </div>
            <div>
              <label htmlFor="doelgroep" className="mb-1 block text-xs font-medium text-foreground-muted">
                Doelgroep
              </label>
              <select id="doelgroep" className={SELECT_CLASSNAME} value={doelgroep} onChange={(e) => opslaanDoelgroep(e.target.value)}>
                {DOELGROEP_OPTIES.map((o) => (
                  <option key={o.waarde} value={o.waarde}>
                    {o.label}
                  </option>
                ))}
              </select>
              {doelgroep === 'zakelijk' ? (
                <p className="mt-1 text-xs text-amber-700">ISDE hierboven geldt niet voor een zakelijk pand — bekijk de EIA/MIA/Vamil-sectie verderop.</p>
              ) : doelgroep !== 'eigenaar_bewoner' ? (
                <p className="mt-1 text-xs text-amber-700">Deze doelgroep (SVVE/SVOH) is nog niet in de engine geïmplementeerd — controleer de officiële voorwaarden zelf.</p>
              ) : null}
            </div>
          </div>

          {fout ? (
            <p role="alert" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-error">
              <WarningCircle size={15} weight="fill" /> {fout}
            </p>
          ) : null}

          <div className="flex flex-col gap-5">
            {isolatieMaatregelen.length > 0 ? <h2 className="text-sm font-semibold tracking-[0.1em] text-foreground-muted uppercase">Isolatiemaatregelen</h2> : null}
            {isolatieMaatregelen.map((m) => (
              <IsolatieMaatregelKaart
                key={m.maatregelKey}
                m={m}
                opslaanBezig={opslaanBezig}
                onWijzig={wijzigSpecificatie}
                onderdeelCode={ONDERDEEL_PER_MAATREGEL[m.maatregelKey]}
              />
            ))}

            {apparaatMaatregelen.length > 0 ? <h2 className="mt-2 text-sm font-semibold tracking-[0.1em] text-foreground-muted uppercase">Installaties</h2> : null}
            {apparaatMaatregelen.map((m) => (
              <ApparaatMaatregelKaart key={m.maatregelKey} m={m} opslaanBezig={opslaanBezig} onWijzig={wijzigSpecificatie} />
            ))}

            {ventilatieMaatregel ? (
              <>
                <h2 className="mt-2 text-sm font-semibold tracking-[0.1em] text-foreground-muted uppercase">Ventilatie</h2>
                <VentilatieMaatregelKaart m={ventilatieMaatregel} opslaanBezig={opslaanBezig} onWijzig={wijzigSpecificatie} />
              </>
            ) : null}

            {documentData ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-5">
                <h2 className="text-base font-medium text-primary">Combinatie-effect</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  {documentData.combinatie.combinatieVanToepassing
                    ? `Meerdere subsidiabele maatregelen (${documentData.combinatie.combinatieAantal}) zijn in dit dossier vastgesteld — het isolatietarief per m² verdubbelt volgens de officiële regeling.`
                    : 'Nog geen combinatie-effect — daarvoor moeten minimaal twee maatregelen subsidiabel zijn.'}
                </p>
                {documentData.combinatie.totaalBerekenbaar ? (
                  <p className="mt-2 text-base font-semibold text-primary">
                    Totaal indicatief/berekend bedrag: € {documentData.combinatie.totaalBedrag.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-amber-700">Totaalbedrag nog niet berekenbaar.</p>
                )}
              </div>
            ) : null}

            {documentData ? (
              <div className={`rounded-2xl border p-5 ${documentData.regionaal.locatieBekend ? 'border-amber-300 bg-amber-50' : 'border-border bg-muted/40'}`}>
                <h2 className="text-base font-medium text-primary">Regionale/lokale subsidie</h2>
                <p className={`mt-1 text-sm ${documentData.regionaal.locatieBekend ? 'text-amber-900' : 'text-foreground-muted'}`}>{documentData.regionaal.boodschap}</p>
              </div>
            ) : null}

            <div id="eia-mia-vamil-sectie">
              <h2 className="mb-1 text-sm font-semibold tracking-[0.1em] text-foreground-muted uppercase">EIA / MIA / Vamil — fiscale regelingen</h2>
              <p className="mb-3 text-xs text-foreground-muted">
                Dit zijn géén directe subsidies, maar fiscale regelingen (investeringsaftrek resp. willekeurige afschrijving). Het daadwerkelijke
                belastingvoordeel hangt af van het belastingtarief en de fiscale positie van de onderneming — dat wordt hier niet berekend.
              </p>
              {documentData?.fiscaleRegelingen.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {documentData.fiscaleRegelingen.map((r) => (
                    <FiscaleRegelingKaart
                      key={r.bedrijfsmiddel.id}
                      resultaat={r}
                      alAanDossierToegevoegd={bestaandeRegelingNamen.has(
                        `${r.bedrijfsmiddel.regelingen.map((reg) => reg.toUpperCase()).join('/')} — ${r.bedrijfsmiddel.titel}${r.bedrijfsmiddel.bedrijfsmiddelcode ? ` (code ${r.bedrijfsmiddel.bedrijfsmiddelcode})` : ''}`
                          .trim()
                          .toLowerCase(),
                      )}
                      toevoegenBezig={toevoegenBezigId === r.bedrijfsmiddel.id}
                      onToevoegen={() => fiscaalToevoegenAlsTraject(r.bedrijfsmiddel)}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-foreground-muted">
                  Op basis van de huidige dossiergegevens (MJOP/Energie-indicatie/opname) is nog geen concrete aanleiding gevonden voor een EIA-,
                  MIA- of Vamil-bedrijfsmiddel.
                </p>
              )}
            </div>

            {documentData?.ontbrekendeVelden.length > 0 ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                <h2 className="text-base font-medium text-primary">Nog aan te vullen</h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {documentData.ontbrekendeVelden.map((v) => (
                    <li key={v} className="text-sm text-amber-900">
                      ☐ {v}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-800">Deze gegevens aanvullen om de subsidie te kunnen bepalen.</p>
              </div>
            ) : null}

            {documentData?.actielijst.length > 0 ? (
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-3 text-base font-medium text-primary">Wat moet u nu doen?</h2>
                <ol className="flex flex-col gap-1.5">
                  {documentData.actielijst.map((stap, i) => (
                    <li key={i} className="text-sm text-foreground">
                      {i + 1}. {stap}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-3 text-base font-medium text-primary">Subsidiebegeleiding — checklist</h2>
              {taken.length === 0 ? (
                <Button type="button" variant="outline" size="sm" onClick={vulStandaardChecklist}>
                  Vul standaard checklist
                </Button>
              ) : (
                <ul className="flex flex-col gap-1">
                  {taken.map((t) => (
                    <li key={t.taak_id}>
                      {/* Hele rij tikbaar (min. ~44px), niet alleen de 16px-checkbox zelf (opdracht §27). */}
                      <label className="flex min-h-11 items-center gap-2.5 rounded-md px-1 py-2 text-sm hover:bg-muted/60">
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0"
                          checked={t.status === 'afgerond'}
                          onChange={(e) => wijzigTaakStatus(t.taak_id, e.target.checked)}
                        />
                        <span className={t.status === 'afgerond' ? 'text-foreground-muted line-through' : 'text-foreground'}>{t.omschrijving}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="primary" onClick={genereerSubsidieblad} disabled={genererenBezig}>
                <FileArrowDown size={16} /> {genererenBezig ? 'Subsidiedocument wordt gegenereerd...' : 'Subsidieblad genereren'}
              </Button>
              {officieleBron ? (
                <Button href={officieleBron.url} target="_blank" rel="noopener noreferrer" variant="outline">
                  <ArrowSquareOut size={16} /> Open officiële aanvraagpagina
                </Button>
              ) : null}
            </div>
            {laatstGegenereerd ? <p className="text-sm text-primary">"{laatstGegenereerd}" is gegenereerd, gedownload en opgeslagen bij de documenten van dit dossier.</p> : null}
          </div>
        </Container>
      </Section>
    </>
  )
}

function IsolatieMaatregelKaart({ m, opslaanBezig, onWijzig, onderdeelCode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-primary">{m.label}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[m.status]}`}>{m.statusLabel}</span>
      </div>

      <IsolatieInvoerVelden
        maatregelKey={m.maatregelKey}
        specificatie={m.specificatie}
        opslaanBezig={opslaanBezig}
        onWijzig={onWijzig}
        technischeEenheidLabel={TECHNISCHE_EENHEID_PER_MAATREGEL[m.maatregelKey]}
      />

      <p className="mt-3 text-xs text-foreground-muted italic">{m.redenen.join(' ')}</p>

      {m.ontbrekendeGegevens.length > 0 ? (
        <div className="mt-2 rounded-lg bg-muted px-3 py-2">
          <p className="text-xs font-medium text-primary">Nog aan te vullen</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {m.ontbrekendeGegevens.map((g) => (
              <li key={g} className="text-xs text-foreground-muted">
                ☐ {g}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {m.berekening?.berekenbaar ? (
        <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-foreground-muted">
          {m.berekening.toelichtingRegels.map((r, i) => (
            <p key={i}>{r}</p>
          ))}
          <p className="mt-1 font-semibold text-primary">Indicatief bedrag: € {m.berekening.bedrag.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
        </div>
      ) : null}

      {m.opnameReferentie.length > 0 ? (
        <div className="mt-3 border-t border-border/60 pt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted">
            <Info size={13} /> Uit de opname ({onderdeelCode}) — puur ter referentie, niet automatisch overgenomen
          </p>
          {m.opnameReferentie.map((o, i) => (
            <p key={i} className="mt-1 text-xs text-foreground-muted">
              {[o.huidigeSituatie, o.maatvoering, o.mogelijkeMaatregel].filter(Boolean).join(' — ')}
            </p>
          ))}
        </div>
      ) : null}

      {m.regel ? (
        <p className="mt-3 text-[11px] text-foreground-muted">
          Bron: {m.regel.bron.label} — gecontroleerd op {m.regel.bron.gecontroleerdOp}
        </p>
      ) : null}
    </div>
  )
}

function ApparaatMaatregelKaart({ m, opslaanBezig, onWijzig }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-primary">{m.label}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[m.status]}`}>{m.statusLabel}</span>
      </div>

      <ApparaatInvoerVelden maatregelKey={m.maatregelKey} specificatie={m.specificatie} opslaanBezig={opslaanBezig} onWijzig={onWijzig} />

      <p className="mt-3 text-xs text-foreground-muted italic">{m.redenen.join(' ')}</p>

      {m.ontbrekendeGegevens.length > 0 ? (
        <div className="mt-2 rounded-lg bg-muted px-3 py-2">
          <p className="text-xs font-medium text-primary">Nog aan te vullen</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {m.ontbrekendeGegevens.map((g) => (
              <li key={g} className="text-xs text-foreground-muted">
                ☐ {g}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {m.berekening?.berekenbaar ? (
        <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-foreground-muted">
          {m.berekening.toelichtingRegels.map((r, i) => (
            <p key={i}>{r}</p>
          ))}
          <p className="mt-1 font-semibold text-primary">Indicatief bedrag: € {m.berekening.bedrag.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
        </div>
      ) : null}

      {m.regel?.bron ? (
        <p className="mt-3 text-[11px] text-foreground-muted">
          Algemene bron: {m.regel.bron.label} — gecontroleerd op {m.regel.bron.gecontroleerdOp}
        </p>
      ) : null}
    </div>
  )
}

/** Ventilatie heeft geen oppervlakte/Rd (vast bedrag) en geen adviseur-ingevoerd bedrag (altijd €400, zie isdeVentilatieRegel.js) — daarom een eigen, kleinere kaart dan isolatie/apparaat. */
function VentilatieMaatregelKaart({ m, opslaanBezig, onWijzig }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-primary">{m.label}</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[m.status]}`}>{m.statusLabel}</span>
      </div>
      <p className="mb-3 text-xs text-foreground-muted">Alleen subsidiabel in combinatie met minimaal één andere subsidiabele isolatiemaatregel in dit dossier (harde RVO-voorwaarde).</p>

      <VentilatieInvoerVelden specificatie={m.specificatie} opslaanBezig={opslaanBezig} onWijzig={onWijzig} />

      <p className="mt-3 text-xs text-foreground-muted italic">{m.redenen.join(' ')}</p>

      {m.ontbrekendeGegevens.length > 0 ? (
        <div className="mt-2 rounded-lg bg-muted px-3 py-2">
          <p className="text-xs font-medium text-primary">Nog aan te vullen</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {m.ontbrekendeGegevens.map((g) => (
              <li key={g} className="text-xs text-foreground-muted">
                ☐ {g}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {m.berekening?.berekenbaar ? (
        <div className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-foreground-muted">
          {m.berekening.toelichtingRegels.map((r, i) => (
            <p key={i}>{r}</p>
          ))}
          <p className="mt-1 font-semibold text-primary">Indicatief bedrag: € {m.berekening.bedrag.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</p>
        </div>
      ) : null}

      {m.regel?.bron ? (
        <p className="mt-3 text-[11px] text-foreground-muted">
          Bron: {m.regel.bron.label} — gecontroleerd op {m.regel.bron.gecontroleerdOp}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Compacte kaart voor één EIA/MIA/Vamil-bedrijfsmiddel (opdracht §8.3): in
 * één oogopslag naam/code/regeling/reden/status/bron, de volledige
 * voorwaarden/bewijsstukken/procedure pas achter een <details>-uitklap —
 * geen lange pagina met alle tekst meteen zichtbaar. Eén primaire actie
 * ("Toevoegen aan dossier"), geen meerdere gelijkwaardige knoppen.
 */
function FiscaleRegelingKaart({ resultaat, alAanDossierToegevoegd, toevoegenBezig, onToevoegen }) {
  const { bedrijfsmiddel: b, status, redenen, ontbrekendeGegevens, gekoppeldeGegevens = [] } = resultaat
  const regelingLabels = b.regelingen.map((r) => FISCALE_REGELING_PARAMETERS[r]?.naam ?? r.toUpperCase()).join(' + ')
  const percentages = [
    b.fiscaalParameter?.percentage != null ? `${FISCALE_REGELING_SOORT_LABELS[b.fiscaalParameter.type]}: ${b.fiscaalParameter.percentage}%` : null,
    b.fiscaalParameterVamil?.percentage != null ? `Vamil: tot ${b.fiscaalParameterVamil.percentage}% willekeurig afschrijven` : null,
  ].filter(Boolean)

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-primary">
            {b.titel}
            {b.bedrijfsmiddelcode ? <span className="text-foreground-muted"> (code {b.bedrijfsmiddelcode})</span> : null}
          </p>
          <p className="text-xs text-foreground-muted">{regelingLabels}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${FISCAAL_STATUS_BADGE[status]}`}>
          {FISCAAL_RELEVANTIE_STATUS_LABELS[status]}
        </span>
      </div>

      <p className="text-xs text-foreground-muted italic">{redenen[0]}</p>

      {percentages.length > 0 ? <p className="mt-2 text-sm font-medium text-primary">{percentages.join(' · ')}</p> : null}

      {gekoppeldeGegevens.length > 0 ? (
        <p className="mt-2 text-xs text-foreground-muted">
          Al bekend uit dossier: {gekoppeldeGegevens.map((g) => `${g.label}: ${g.waarde}`).join('; ')}.
        </p>
      ) : null}

      {ontbrekendeGegevens.length > 0 ? (
        <p className="mt-2 text-xs text-amber-700">Nog te controleren: {ontbrekendeGegevens.join(', ')}.</p>
      ) : null}

      <details className="mt-3 text-xs text-foreground-muted">
        <summary className="cursor-pointer font-medium text-accent select-none">Volledige voorwaarden en procedure</summary>
        <div className="mt-2 flex flex-col gap-2">
          <p>{b.toepassingsgebied}</p>
          {b.technischeVoorwaarden.length > 0 ? (
            <div>
              <p className="font-medium text-foreground">Technische voorwaarden</p>
              <ul className="mt-0.5 list-disc pl-4">
                {b.technischeVoorwaarden.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {b.uitsluitingen.length > 0 ? (
            <div>
              <p className="font-medium text-foreground">Uitsluitingen</p>
              <ul className="mt-0.5 list-disc pl-4">
                {b.uitsluitingen.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {b.samenloop.length > 0 ? (
            <div>
              <p className="font-medium text-foreground">Samenloop met andere regelingen</p>
              <ul className="mt-0.5 list-disc pl-4">
                {b.samenloop.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p>
            <span className="font-medium text-foreground">Vereiste bewijsstukken: </span>
            {b.vereisteBewijsstukken.join(', ')}
          </p>
          <p>
            <span className="font-medium text-foreground">Procedure: </span>
            {b.procedure.omschrijving}
          </p>
          <p>
            <span className="font-medium text-foreground">Officiële bron: </span>
            <a href={b.bron.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {b.bron.label}
            </a>{' '}
            — gecontroleerd op {b.bron.gecontroleerdOp}
          </p>
        </div>
      </details>

      <div className="mt-3">
        {alAanDossierToegevoegd ? (
          <span className="text-xs font-medium text-primary">Al toegevoegd aan dit dossier</span>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={onToevoegen} disabled={toevoegenBezig}>
            {toevoegenBezig ? 'Bezig...' : 'Toevoegen aan dossier'}
          </Button>
        )}
      </div>
    </div>
  )
}
