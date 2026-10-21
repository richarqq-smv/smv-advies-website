/**
 * Anti-slop-ronde (2026-10-21): de voortgangsregel ("Stap 1 van 4") staat
 * onder de stapkop in gewone zinsopbouw i.p.v. als klein goud hoofdletter-
 * label erboven; de toelichting op leesbare grootte (16px i.p.v. 14px).
 */
export function StepHead({ eyebrow, title, description }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl text-primary sm:text-3xl">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-accent">{eyebrow}</p>
      <p className="mt-3 text-base text-foreground">{description}</p>
    </div>
  )
}
