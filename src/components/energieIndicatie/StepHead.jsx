export function StepHead({ eyebrow, title, description }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>
      <h2 className="text-2xl text-primary sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-foreground-muted">{description}</p>
    </div>
  )
}
