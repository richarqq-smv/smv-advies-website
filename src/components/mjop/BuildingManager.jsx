import { useRef, useState } from 'react'
import { Download, Upload, TrashSimple } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { buildTestpandA, buildTestpandB, buildTestpandC } from '../../lib/mjop/testData'

/**
 * Beheerbalk boven de tool: export/import van het JSON-pandprofiel en een
 * bevestigde reset. De testdata-knoppen bestaan alleen in development
 * (`import.meta.env.DEV`, door Vite statisch op `false` gezet in de
 * productiebuild) en verschijnen dus nooit op de live site — zie opdracht
 * sectie 42.
 */
export function BuildingManager({ onExport, onImportText, onReset, onLoadTestBuilding }) {
  const fileInputRef = useRef(null)
  const [confirmingReset, setConfirmingReset] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onImportText(reader.result)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 print:hidden">
      <p className="text-sm font-medium text-primary">Pandprofiel wordt lokaal in deze browser bewaard.</p>

      <div className="flex flex-wrap items-center gap-2">
        {import.meta.env.DEV ? (
          <div className="flex items-center gap-1.5 border-r border-border pr-2 mr-1">
            <span className="text-xs text-foreground-muted">Testdata:</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onLoadTestBuilding(buildTestpandA())}>
              A
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onLoadTestBuilding(buildTestpandB())}>
              B
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onLoadTestBuilding(buildTestpandC())}>
              C
            </Button>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload size={15} /> Importeren
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onExport}>
          <Download size={15} /> Exporteren
        </Button>

        {confirmingReset ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-error">Weet u het zeker?</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-error text-error hover:bg-error-bg"
              onClick={() => {
                onReset()
                setConfirmingReset(false)
              }}
            >
              Ja, wissen
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingReset(false)}>
              Annuleren
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingReset(true)}>
            <TrashSimple size={15} /> Nieuw pand
          </Button>
        )}
      </div>
    </div>
  )
}
