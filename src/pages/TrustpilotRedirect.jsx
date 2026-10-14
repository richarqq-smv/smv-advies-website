import { Navigate, Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { ROUTES } from '../lib/routes'

/**
 * Gedeelde doorverwijzing voor /beoordelingen en /recensies (Trustpilot-
 * ronde 2026-10-14) — twee synoniem-URL's die alleen bestaan zodat beide
 * zoektermen een werkende pagina vinden, zonder de inhoud van /trustpilot
 * te dupliceren (dubbele content is slecht voor SEO). noindex: deze URL's
 * zelf horen niet in zoekresultaten te verschijnen, alleen /trustpilot.
 * De zichtbare link eronder is de fallback voor het korte moment vóór
 * React's <Navigate> client-side doorstuurt (en voor de geprerenderde
 * HTML, voordat JS geladen is).
 */
export default function TrustpilotRedirect() {
  return (
    <>
      <Seo title="Beoordelingen en recensies" description="Deze pagina is verplaatst naar /trustpilot." noindex />
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-24 text-center">
        <p className="text-base text-foreground-muted">
          Deze pagina is verplaatst naar{' '}
          <Link to={ROUTES.trustpilot} className="font-medium text-accent underline underline-offset-2 hover:text-secondary">
            onze beoordelingenpagina
          </Link>
          .
        </p>
      </div>
      <Navigate to={ROUTES.trustpilot} replace />
    </>
  )
}
