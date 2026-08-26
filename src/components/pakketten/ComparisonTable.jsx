import { Check, Minus } from '@phosphor-icons/react'
import { Badge } from '../ui/Badge'
import { Reveal } from '../ui/Reveal'
import { PACKAGES } from '../../data/packages'
import { COMPARISON_ROWS, COMPARISON_NOTE } from '../../data/packageComparison'
import { cn } from '../../lib/cn'

function Cell({ value }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center" aria-label="Inbegrepen">
        <Check size={18} weight="bold" className="text-accent" />
      </span>
    )
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center" aria-label="Niet inbegrepen">
        <Minus size={16} className="text-foreground-muted/40" />
      </span>
    )
  }

  return <span className="text-sm text-primary">{value}</span>
}

export function ComparisonTable() {
  return (
    <Reveal>
      <p className="mb-3 text-xs text-foreground-muted lg:hidden">
        Scroll horizontaal om alle pakketten te vergelijken.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <caption className="sr-only">Vergelijking van de drie SMV Advies-pakketten</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="w-2/5 px-5 py-4 text-sm font-semibold text-primary">
                &nbsp;
              </th>
              {PACKAGES.map((pkg, index) => (
                <th
                  key={pkg.id}
                  scope="col"
                  className={cn(
                    'px-5 py-4 text-center align-bottom',
                    index === 1 && 'bg-accent/5',
                  )}
                >
                  <span className="block text-sm font-semibold text-primary">{pkg.name}</span>
                  {pkg.badge ? (
                    <Badge className="mt-2">{pkg.badge}</Badge>
                  ) : (
                    <span className="mt-2 block h-[22px]" aria-hidden="true" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-5 py-4 text-sm font-medium text-primary">
                  {row.label}
                </th>
                {row.values.map((value, index) => (
                  <td
                    key={`${row.label}-${index}`}
                    className={cn('px-5 py-4 text-center', index === 1 && 'bg-accent/5')}
                  >
                    <Cell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-foreground-muted">{COMPARISON_NOTE}</p>
    </Reveal>
  )
}
