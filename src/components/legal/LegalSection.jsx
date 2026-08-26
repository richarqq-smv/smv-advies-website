import { Badge } from '../ui/Badge'

/**
 * Renders one section of a legal page. When `content` is filled in, it
 * shows as real paragraph text; when it's still `null`, a "nog aan te
 * leveren" marker shows instead. See src/data/legalContent.js for how to
 * fill sections in.
 */
export function LegalSection({ title, content }) {
  const paragraphs = Array.isArray(content) ? content : content ? [content] : []

  return (
    <div className="border-t border-border py-6 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {paragraphs.length === 0 ? <Badge tone="muted">Nog aan te leveren</Badge> : null}
      </div>

      {paragraphs.length > 0 ? (
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-foreground-muted">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-foreground-muted italic">
          Deze paragraaf wacht nog op de definitieve, aangeleverde tekst.
        </p>
      )}
    </div>
  )
}
