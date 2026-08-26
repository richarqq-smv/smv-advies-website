import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { Badge } from '../ui/Badge'
import { Reveal } from '../ui/Reveal'

export function CaseCard({ item, delay = 0 }) {
  return (
    <Reveal as="article" delay={delay} className="flex h-full flex-col">
      <ImagePlaceholder label={item.imageLabel} aspect="aspect-[16/10]" />

      <div className="mt-5 flex items-center gap-3">
        <Badge tone="muted">{item.package}</Badge>
        <p className="text-xs text-foreground-muted">
          {item.sector} · {item.location}
        </p>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-primary">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.description}</p>

      <ul className="mt-4 space-y-1.5">
        {item.highlights.map((highlight) => (
          <li key={highlight} className="text-sm text-primary">
            {highlight}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm font-semibold text-accent">{item.result}</p>
    </Reveal>
  )
}
