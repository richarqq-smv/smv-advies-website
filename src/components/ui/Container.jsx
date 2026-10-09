import { cn } from '../../lib/cn'

/**
 * Constrains content to a readable max width with consistent horizontal
 * gutters. Use inside every <Section> instead of ad-hoc max-w utilities.
 *
 * `wide` (adminbreedte-ronde, 2026-10-09): de publieke/klantgerichte
 * marketingpagina's blijven bewust op de smalle, leesbare 1200px-kolom —
 * dat is precies wat die pagina's nodig hebben. De admin-werkruimte
 * (tabellen, formulieren, kaarten naast elkaar) kan juist niet uit de
 * voeten met zo'n smalle kolom op een groot scherm. `wide` is een pure
 * opt-in variant (default-gedrag blijft ongewijzigd, zie opdracht §9:
 * "wijzig de specifieke pagina('s)" i.p.v. een brede, ongevraagde
 * layoutwijziging voor elke <Container>-gebruiker) — gebruikt door de
 * admin-only paginas (AdminSubsidieBegeleiding.jsx e.a.), nooit door
 * DossierDetail.jsx (gedeeld met de klantomgeving) of een publieke pagina.
 * ~92% van de viewport vanaf 1280px, met een ruime maar begrensde
 * max-breedte zodat regels op zeer brede schermen leesbaar blijven.
 */
export function Container({ className, wide = false, children, ...props }) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', wide ? 'max-w-[1800px] xl:w-[92%]' : 'max-w-[1200px]', className)} {...props}>
      {children}
    </div>
  )
}
