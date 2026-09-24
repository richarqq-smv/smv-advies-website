import { useMemo } from 'react'
import { Printer, Download, PaperPlaneTilt, FloppyDisk, SpinnerGap, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { TextField } from '../ui/TextField'
import { StatusBadge } from './StatusBadge'
import { Timeline } from './Timeline'
import { getComponentTypeLabel, optionLabel, BUILDING_USE_OPTIONS, STATUSES } from '../../lib/mjop/constants'
import { groupByStatus, buildTimeline, buildAdviesSummary } from '../../lib/mjop/linking'

const PRESENCE_TEKST = { ja: 'Aanwezig', nee: 'Niet aanwezig', onbekend: 'Aanwezigheid onbekend' }
const STATUS_ORDER = ['nu_onderzoeken', 'meenemen_bij_vervanging', 'later_beoordelen', 'geen_actie_nodig', 'onvoldoende_informatie']

function OverviewSection({ title, description, children }) {
  return (
    <section className="border-t border-border pt-8 first:border-t-0 first:pt-0">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      {description ? <p className="mt-1 mb-4 text-sm text-foreground-muted">{description}</p> : <div className="mb-4" />}
      {children}
    </section>
  )
}

function PandVeld({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-foreground-muted uppercase">{label}</p>
      <p className="mt-0.5 text-sm text-primary">{value}</p>
    </div>
  )
}

function SendStatusNote({ status }) {
  if (status === 'sending') {
    return (
      <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
        <SpinnerGap size={15} weight="bold" className="animate-spin motion-reduce:animate-none" />
        Bezig met versturen...
      </p>
    )
  }
  if (status === 'sent') {
    return (
      <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-primary">
        <CheckCircle size={15} weight="fill" className="text-accent" />
        Analyse verzonden.
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
        <WarningCircle size={15} weight="fill" />
        Het verzenden is niet gelukt. Uw gegevens zijn wel lokaal bewaard. Probeer het opnieuw.
      </p>
    )
  }
  return null
}

function SaveMjopStatusNote({ status }) {
  if (status === 'saving') {
    return (
      <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
        <SpinnerGap size={15} weight="bold" className="animate-spin motion-reduce:animate-none" />
        Bezig met opslaan...
      </p>
    )
  }
  if (status === 'saved') {
    return (
      <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-primary">
        <CheckCircle size={15} weight="fill" className="text-accent" />
        MJOP opgeslagen bij dit pand.
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
        <WarningCircle size={15} weight="fill" />
        Opslaan is niet gelukt. Uw huidige MJOP-invoer is behouden. Probeer het opnieuw.
      </p>
    )
  }
  return null
}

export function StepAdvies({ building, insights, onExport, onSend, sendStatus, onSaveMjop, saveMjopStatus, setContactField, onBack }) {
  const groups = useMemo(() => groupByStatus(insights), [insights])
  const timeline = useMemo(() => buildTimeline(insights), [insights])
  const summary = useMemo(() => buildAdviesSummary(insights), [insights])
  const isSending = sendStatus === 'sending'
  const isSavingMjop = saveMjopStatus === 'saving'

  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase print:hidden">Stap 7 van 7</p>
      <h2 className="text-2xl text-primary sm:text-3xl">Adviesoverzicht</h2>
      <p className="mt-2 mb-8 text-sm text-foreground-muted print:hidden">
        Dit overzicht is bedoeld om samen met een adviseur te bespreken. Het is een signalering op basis van de
        ingevoerde gegevens, geen bindend technisch advies.
      </p>

      <div className="flex flex-col gap-8">
        <OverviewSection title="Pand">
          <div className="grid gap-4 sm:grid-cols-3">
            <PandVeld label="Naam" value={building.name || 'Niet opgegeven'} />
            <PandVeld label="Plaats" value={building.location || 'Niet opgegeven'} />
            <PandVeld label="Bouwjaar" value={building.constructionYear ?? 'Onbekend'} />
            <PandVeld label="Gebruikstype" value={optionLabel(BUILDING_USE_OPTIONS, building.buildingUse)} />
            <PandVeld label="Bruto vloeroppervlak" value={building.floorArea ? `${building.floorArea} m²` : 'Onbekend'} />
            <PandVeld label="Aantal verdiepingen" value={building.floors ?? 'Onbekend'} />
          </div>
          {building.notes ? (
            <p className="mt-4 text-sm leading-relaxed text-foreground-muted">{building.notes}</p>
          ) : null}
        </OverviewSection>

        <OverviewSection title="Huidige situatie" description="Wat aanwezig is in het pand, en wat daarvan bekend is.">
          <ul className="flex flex-col gap-2">
            {building.components.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-white px-4 py-3 text-sm">
                <span className="font-medium text-primary">{getComponentTypeLabel(c.typeId, c.customLabel)}:</span>{' '}
                <span className="text-foreground-muted">{PRESENCE_TEKST[c.present] ?? PRESENCE_TEKST.onbekend}</span>
                {c.present !== 'nee' && c.currentSituation ? (
                  <span className="text-foreground-muted">, {c.currentSituation}</span>
                ) : null}
                {c.present !== 'nee' && c.installationYear ? (
                  <span className="text-foreground-muted"> (jaar: {c.installationYear})</span>
                ) : null}
              </li>
            ))}
          </ul>
        </OverviewSection>

        <OverviewSection
          title="Onderhoud en vervanging"
          description="Bekende onderhouds- en vervangingsmomenten, en waar dat nog ontbreekt."
        >
          <ul className="flex flex-col gap-2">
            {insights.map((i) => (
              <li key={i.componentId} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3">
                <span className="text-sm font-medium text-primary">
                  {i.componentLabel}
                  {i.relevantYear ? <span className="ml-2 font-normal text-foreground-muted">({i.relevantYear})</span> : null}
                </span>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        </OverviewSection>

        <OverviewSection title="Verduurzaming" description="Per status, met de eventueel bijpassende maatregelen.">
          <div className="flex flex-col gap-5">
            {STATUS_ORDER.filter((status) => groups[status].length > 0).map((status) => (
              <div key={status}>
                <p className="mb-2 text-sm font-semibold text-primary">{STATUSES[status].label}</p>
                <ul className="flex flex-col gap-2">
                  {groups[status].map((i) => (
                    <li key={i.componentId} className="rounded-lg border border-border bg-white px-4 py-3 text-sm">
                      <span className="font-medium text-primary">{i.componentLabel}</span>
                      {i.recommendations.some((r) => r.measureName) ? (
                        <span className="text-foreground-muted">
                          : {i.recommendations.map((r) => r.measureName).filter(Boolean).join(', ')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </OverviewSection>

        <OverviewSection title="Planning">
          <Timeline years={timeline.years} unknown={timeline.unknown} />
        </OverviewSection>

        <OverviewSection title="Adviesoverzicht">
          <div className="flex flex-col gap-3">
            {summary.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </OverviewSection>

        <OverviewSection
          title="Contactgegevens"
          description="Optioneel, alleen gebruikt wanneer u deze analyse naar SMV Advies verstuurt."
        >
          <div className="grid gap-4 sm:grid-cols-3 print:hidden">
            <TextField
              id="mjop-contact-naam"
              label="Naam"
              value={building.contact?.naam ?? ''}
              onChange={(v) => setContactField('naam', v)}
            />
            <TextField
              id="mjop-contact-email"
              label="E-mailadres"
              type="email"
              value={building.contact?.email ?? ''}
              onChange={(v) => setContactField('email', v)}
            />
            <TextField
              id="mjop-contact-telefoon"
              label="Telefoonnummer"
              type="tel"
              value={building.contact?.telefoon ?? ''}
              onChange={(v) => setContactField('telefoon', v)}
            />
          </div>
        </OverviewSection>
      </div>

      <div className="mt-10 flex flex-col gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground-muted">
            Bewaar de huidige MJOP-gegevens bij het pandprofiel, los van het versturen van deze analyse.
          </p>
          <Button type="button" variant="outline" onClick={onSaveMjop} disabled={isSavingMjop}>
            <FloppyDisk size={17} /> MJOP opslaan bij dit pand
          </Button>
        </div>
        <SaveMjopStatusNote status={saveMjopStatus} />
      </div>

      <div className="mt-4 flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSending}>
            Terug
          </Button>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => window.print()}>
              <Printer size={17} /> Afdrukken / PDF
            </Button>
            <Button type="button" variant="outline" onClick={onExport}>
              <Download size={17} /> JSON exporteren
            </Button>
            <Button type="button" onClick={onSend} disabled={isSending}>
              <PaperPlaneTilt size={17} /> Analyse naar SMV Advies sturen
            </Button>
          </div>
        </div>
        <SendStatusNote status={sendStatus} />
      </div>
    </div>
  )
}
