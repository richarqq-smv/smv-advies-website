import { cn } from '../../lib/cn'
import { STATUSES } from '../../lib/mjop/constants'

// Eigen, kleine badge (niet de gedeelde ui/Badge) omdat de vijf MJOP-statussen
// een eigen kleurbetekenis hebben die niet in het bestaande accent/muted-
// onderscheid past. Geen wijziging aan de gedeelde Badge nodig.
const TONES = {
  nu_onderzoeken: 'bg-accent/10 text-accent',
  meenemen_bij_vervanging: 'bg-primary/10 text-primary',
  later_beoordelen: 'bg-muted text-foreground-muted',
  geen_actie_nodig: 'bg-muted text-foreground-muted',
  onvoldoende_informatie: 'border border-dashed border-border text-foreground-muted',
}

export function StatusBadge({ status, className }) {
  const info = STATUSES[status]
  if (!info) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        TONES[status],
        className,
      )}
    >
      {info.label}
    </span>
  )
}
