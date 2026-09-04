import { Link } from 'react-router-dom'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { Badge } from '../ui/Badge'
import { Reveal } from '../ui/Reveal'

const LINK_CLASSNAME = 'font-medium text-accent underline underline-offset-2 hover:text-secondary'

export function CaseDetailCard({ item, delay = 0 }) {
  return (
    <Reveal as="article" delay={delay} className="grid gap-8 rounded-xl border border-border bg-white p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div>
        <ImagePlaceholder label={item.imageLabel} aspect="aspect-[4/3]" />
        <div className="mt-4 flex items-center gap-3">
          <Badge tone="muted">{item.package}</Badge>
          <p className="text-xs text-foreground-muted">
            {item.sector} · {item.location}
          </p>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-primary">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.description}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-foreground-muted uppercase">Voor</p>
          <ul className="mt-3 space-y-2">
            {item.voor.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-primary">
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">Na</p>
          <ul className="mt-3 space-y-2">
            {item.na.map((line) => (
              <li key={line} className="text-sm leading-relaxed text-primary">
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="sm:col-span-2 mt-2 rounded-lg bg-accent/8 px-4 py-3.5 text-sm font-medium text-primary">
          {item.resultaat}
        </p>

        {item.relatedArticles?.length ? (
          <div className="sm:col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground-muted">
            <span>Meer lezen:</span>
            {item.relatedArticles.map((article, index) => (
              <span key={article.to}>
                <Link to={article.to} className={LINK_CLASSNAME}>
                  {article.label}
                </Link>
                {index < item.relatedArticles.length - 1 ? ',' : ''}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Reveal>
  )
}
