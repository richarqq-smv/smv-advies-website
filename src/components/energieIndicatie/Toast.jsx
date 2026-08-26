import { WarningCircle } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

export function Toast({ message }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-8',
        'transition-all duration-300 ease-default',
        message ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
    >
      {message ? (
        <div className="flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg">
          <WarningCircle size={18} weight="fill" className="shrink-0 text-accent-light" />
          {message}
        </div>
      ) : null}
    </div>
  )
}
