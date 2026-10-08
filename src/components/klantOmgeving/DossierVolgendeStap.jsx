import { ArrowRight, ArrowCounterClockwise, CheckCircle } from '@phosphor-icons/react'
import { bepaalVolgendeStap } from '../../lib/klantOmgeving/dossierHealthCheck'
import { Button } from '../ui/Button'

/**
 * UX-herontwerp (2026-10-08) — prominente banner boven aan de dossierpagina:
 * "weet ik wat ik nu moet doen?" in één oogopslag, zonder eerst de
 * uitgeklapte Health Check te moeten lezen. Zelf geen logica — puur
 * presentatie van bepaalVolgendeStap() (dossierHealthCheck.js), dat zelf
 * weer uitsluitend de al bestaande, feitelijke categorieën hergebruikt.
 * Bewust NIET in een Accordion: dit is precies het ene ding dat altijd
 * zichtbaar moet zijn, ook ingeklapt.
 *
 * `magBeheren`/`onHeropenenClick` (2026-10-08, vervolgronde): bij een
 * afgerond dossier is `stap.actie` altijd null (bepaalVolgendeStap() kent
 * zelf geen "heropenen"-begrip — dat is een UI-actie, geen gezondheidsfeit),
 * dus deze knop vervangt die lege actieplek uitsluitend voor een admin. De
 * daadwerkelijke bevestiging/aanroep gebeurt in DossierDetail.jsx (zelfde
 * dubbele-bevestiging-patroon als "Naar archief"), hier alleen de trigger.
 */
export function DossierVolgendeStap({ categorieen, dossierStatus, magBeheren = false, onHeropenenClick }) {
  const stap = bepaalVolgendeStap({ categorieen, dossierStatus })
  const afgerond = dossierStatus === 'afgerond'

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 sm:p-6 ${
        afgerond ? 'border-border bg-white' : 'border-accent/40 bg-accent/5'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {afgerond ? <CheckCircle size={22} weight="fill" className="shrink-0 text-accent" /> : null}
        <div>
          <p className="mb-0.5 text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            {afgerond ? 'Dossierstatus' : 'Volgende stap'}
          </p>
          <p className="text-lg font-medium text-primary">{stap.titel}</p>
          {stap.toelichting ? <p className="mt-0.5 text-sm text-foreground-muted">{stap.toelichting}</p> : null}
        </div>
      </div>
      {stap.actie ? (
        <Button {...(stap.actie.href ? { href: stap.actie.href } : { to: stap.actie.to })} size="sm">
          {stap.actie.label} <ArrowRight size={15} />
        </Button>
      ) : afgerond && magBeheren ? (
        <Button type="button" variant="outline" size="sm" onClick={onHeropenenClick}>
          <ArrowCounterClockwise size={15} /> Dossier heropenen
        </Button>
      ) : null}
    </div>
  )
}
