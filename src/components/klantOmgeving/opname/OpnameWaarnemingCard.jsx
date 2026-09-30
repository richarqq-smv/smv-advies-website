import { useEffect, useMemo, useRef, useState } from 'react'
import { useLatestRef } from '../../../hooks/useLatestRef'
import { Camera, Trash, WarningCircle } from '@phosphor-icons/react'
import { debounce } from '../../../lib/klantOmgeving/debounce'
import { updateOpnameWaarneming, removeOpnameWaarneming, uploadDocument } from '../../../lib/klantOmgeving/api'

const VELD_LABELS = [
  { veld: 'huidige_situatie', label: 'Huidige situatie', multiline: true },
  { veld: 'beoordeling', label: 'Beoordeling', multiline: true },
  { veld: 'maatvoering', label: 'Maatvoering', multiline: false },
  { veld: 'aandachtspunt', label: 'Aandachtspunt', multiline: true },
  { veld: 'mogelijke_maatregel', label: 'Mogelijke maatregel', multiline: true },
  { veld: 'opmerkingen', label: 'Opmerkingen', multiline: true },
]

const INPUT_CLASSNAME =
  'w-full rounded-lg border border-border px-3.5 py-2.5 text-base text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:bg-muted disabled:text-foreground-muted'

/**
 * Eén waarnemingsregel uit het opnameformulier (mobiele-opnameronde) —
 * exact de 6 tekstvelden uit het brondocument ("Foto nr." is vervangen
 * door echte fotokoppeling hieronder, zie 0030-migratie/eindrapport).
 * Autosave: elke veldwijziging wordt 800ms na de laatste toetsaanslag
 * weggeschreven (gedebounced per waarneming, niet per veld — één PATCH
 * met alle op dat moment gewijzigde velden), met flush bij het verlaten
 * van het veld (blur) of het verlaten van de pagina/stap (zie
 * OpnameOnderdeelStap, dat cleanup via de returned flush-functie
 * afdwingt). Een korte verbindingsonderbreking kan dus hoogstens de
 * laatste, nog niet weggeschreven toetsaanslagen raken — nooit al
 * bevestigd opgeslagen gegevens (zie opdracht §5/§16, geen aparte
 * offline-queue: geen concrete aanleiding om aan te nemen dat inspecteurs
 * structureel zonder dekking werken).
 */
export function OpnameWaarnemingCard({ waarneming, magBewerken, documenten, klantId, opnameId, onWaarnemingChange, onVerwijderd, onDocumentGeupload }) {
  const [velden, setVelden] = useState(() => Object.fromEntries(VELD_LABELS.map((v) => [v.veld, waarneming[v.veld] ?? ''])))
  const [opslaanStatus, setOpslaanStatus] = useState('opgeslagen') // 'opgeslagen' | 'bezig' | 'fout'
  const [verwijderBevestiging, setVerwijderBevestiging] = useState(false)
  const [uploadBezig, setUploadBezig] = useState(false)
  const [uploadFout, setUploadFout] = useState(false)
  const pendingRef = useRef({})
  const onWaarnemingChangeRef = useLatestRef(onWaarnemingChange)
  const waarnemingIdRef = useLatestRef(waarneming.waarneming_id)

  const eigenDocumenten = useMemo(() => documenten.filter((d) => d.opname_waarneming_id === waarneming.waarneming_id), [documenten, waarneming.waarneming_id])

  // Lazy useState-initializer: draait maar één keer (nooit opnieuw, ook
  // niet als onWaarnemingChange een nieuwe identity krijgt) — anders zou
  // een tussentijdse parent-render een al lopende debounce-timer laten
  // vallen, met dataverlies van een net getypt veld tot gevolg. Actuele
  // waarden komen uit de refs hierboven.
  const [opslaan] = useState(() =>
    debounce(async () => {
      const teVersturen = pendingRef.current
      pendingRef.current = {}
      if (Object.keys(teVersturen).length === 0) return
      setOpslaanStatus('bezig')
      try {
        const bijgewerkt = await updateOpnameWaarneming(waarnemingIdRef.current, teVersturen)
        onWaarnemingChangeRef.current(bijgewerkt)
        setOpslaanStatus('opgeslagen')
      } catch {
        setOpslaanStatus('fout')
      }
    }, 800),
  )

  // Flush bij unmount (stap-navigatie/afsluiten) — voorkomt dataverlies van
  // een net getypt veld dat de debounce-wachttijd nog niet had gehaald.
  useEffect(() => () => opslaan.flush(), [opslaan])

  function veldChange(veld, waarde) {
    setVelden((v) => ({ ...v, [veld]: waarde }))
    pendingRef.current[veld] = waarde
    opslaan()
  }

  async function verwijderen() {
    try {
      await removeOpnameWaarneming(waarneming.waarneming_id)
      onVerwijderd(waarneming.waarneming_id)
    } catch {
      setVerwijderBevestiging(false)
    }
  }

  async function fotoToevoegen(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadFout(false)
    setUploadBezig(true)
    try {
      const doc = await uploadDocument({ klantId, opnameId, opnameWaarnemingId: waarneming.waarneming_id, file })
      onDocumentGeupload(doc)
    } catch {
      setUploadFout(true)
    } finally {
      setUploadBezig(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground-muted">
          {opslaanStatus === 'bezig' ? 'Bezig met opslaan...' : opslaanStatus === 'fout' ? 'Opslaan mislukt' : 'Opgeslagen'}
        </span>
        {magBewerken ? (
          verwijderBevestiging ? (
            <div className="flex items-center gap-1 text-sm">
              <span className="mr-1 text-primary">Verwijderen?</span>
              <button type="button" onClick={verwijderen} className="flex min-h-11 items-center rounded-md px-3 font-medium text-error hover:bg-muted">
                Ja
              </button>
              <button type="button" onClick={() => setVerwijderBevestiging(false)} className="flex min-h-11 items-center rounded-md px-3 text-foreground-muted hover:bg-muted">
                Nee
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setVerwijderBevestiging(true)}
              aria-label="Waarneming verwijderen"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground-muted hover:bg-muted hover:text-error"
            >
              <Trash size={16} />
            </button>
          )
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {VELD_LABELS.map(({ veld, label, multiline }) => (
          <label key={veld} className="block">
            <span className="mb-1 block text-xs font-medium text-foreground-muted">{label}</span>
            {multiline ? (
              <textarea
                rows={2}
                value={velden[veld]}
                disabled={!magBewerken}
                onChange={(e) => veldChange(veld, e.target.value)}
                onBlur={() => opslaan.flush()}
                className={INPUT_CLASSNAME}
              />
            ) : (
              <input
                type="text"
                value={velden[veld]}
                disabled={!magBewerken}
                onChange={(e) => veldChange(veld, e.target.value)}
                onBlur={() => opslaan.flush()}
                className={INPUT_CLASSNAME}
              />
            )}
          </label>
        ))}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium text-foreground-muted">Foto's ({eigenDocumenten.length})</p>
        {eigenDocumenten.length > 0 ? (
          <ul className="mb-2 flex flex-col gap-1">
            {eigenDocumenten.map((d) => (
              <li key={d.document_id} className="truncate text-xs text-foreground-muted">{d.bestandsnaam}</li>
            ))}
          </ul>
        ) : null}
        {magBewerken ? (
          <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-primary hover:bg-muted">
            <Camera size={18} />
            {uploadBezig ? 'Bezig met uploaden...' : "Foto toevoegen"}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={fotoToevoegen} disabled={uploadBezig} />
          </label>
        ) : null}
        {uploadFout ? (
          <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-error">
            <WarningCircle size={13} weight="fill" /> Foto uploaden is niet gelukt.
          </p>
        ) : null}
      </div>
    </div>
  )
}
