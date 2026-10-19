import { cn } from '../../lib/cn'

/**
 * Een echt aan/uit-schuifje in iOS-stijl (projectplan "Klantwaarde-
 * uitbreidingen", Fase 6 — #10) — generieke UI-primitive, niet gebonden
 * aan het Opties-paneel specifiek, zodat 'm ook elders bruikbaar is.
 * `onChange` krijgt de NIEUWE gewenste waarde — deze component wijzigt
 * nooit zelf stilzwijgend state, de aanroeper beslist (bv. eerst een
 * bevestigingsdialoog tonen vóór de waarde echt wijzigt).
 */
export function Switch({ id, checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-default',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        checked ? 'bg-accent' : 'bg-border',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-default',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
