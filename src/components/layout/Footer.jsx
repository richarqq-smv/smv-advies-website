import { NavLink } from 'react-router-dom'
import { EnvelopeSimple, MapPin, Phone, Star, LinkedinLogo, InstagramLogo } from '@phosphor-icons/react'
import { Container } from '../ui/Container'
import { NAV_ITEMS, FOOTER_LEGAL_ITEMS } from '../../data/navigation'
import { COMPANY } from '../../data/company'
import { ROUTES } from '../../lib/routes'

const SOCIAL_ICON_CLASSNAME = 'flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 transition-colors'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary text-white">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="sm:col-span-2 lg:col-span-1">
          {/* logo-footer-light.png is logo-header.png zelf, puur
              herkleurd naar wit-op-transparant (alpha afgeleid uit de
              luminantie van het origineel, geen nieuw logo getekend) —
              zodat het losstaand op de donkere footer-achtergrond past,
              zonder wit kaartje eromheen. */}
          <img src="/logo-footer-light.png" alt="SMV Advies" width="199" height="112" className="h-9 w-auto" />
          <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-white/70">
            Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in de Hoeksche Waard.{' '}
            {COMPANY.tagline}.
          </p>
          {/* Trustpilot TrustBox "Review Collector" — officiële, gratis
              widget uit het Trustpilot-dashboard (Deel en promoot >
              Website-widgets). De bootstrap-script (index.html) vervangt
              de fallback-link hieronder client-side door de live widget;
              zonder JS (of voor crawlers) blijft dit gewoon een werkende
              link naar de reviewpagina. */}
          <div
            className="trustpilot-widget mt-5"
            data-locale="nl-NL"
            data-template-id="56278e9abfbbba0bdcd568bc"
            data-businessunit-id="6abf610ed4ea2cdc6ac6b813"
            data-style-height="52px"
            data-style-width="100%"
            data-token="b49c3545-1baa-4fc6-866c-8bcabd166184"
          >
            <a href="https://nl.trustpilot.com/review/smv-advies.nl" target="_blank" rel="noopener noreferrer">
              Trustpilot
            </a>
          </div>

          {/* Social-iconenrij (2026-10-14). Instagram heeft bewust geen
              href: er bestaat nog geen account (zie COMPANY.instagramUrl),
              dus een span i.p.v. een link die nergens heen gaat. */}
          <div className="mt-5 flex items-center gap-3">
            <a
              href={COMPANY.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SMV Advies op LinkedIn"
              className={`${SOCIAL_ICON_CLASSNAME} hover:bg-white/20`}
            >
              <LinkedinLogo size={20} weight="light" className="text-white" />
            </a>
            <span
              aria-label="Instagram-pagina volgt nog"
              title="Instagram-pagina volgt nog"
              className={`${SOCIAL_ICON_CLASSNAME} cursor-not-allowed opacity-40`}
            >
              <InstagramLogo size={20} weight="light" className="text-white" />
            </span>
            <NavLink
              to={ROUTES.trustpilot}
              aria-label="Beoordelingen van SMV Advies op Trustpilot"
              className={`${SOCIAL_ICON_CLASSNAME} hover:bg-white/20`}
            >
              <Star size={20} weight="light" className="text-white" />
            </NavLink>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Navigatie</h3>
          <ul className="mt-4 space-y-2.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className="inline-block py-1 text-sm text-white/80 hover:text-white">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-2.5">
              <EnvelopeSimple size={18} className="mt-0.5 shrink-0 text-accent-light" />
              <a href={`mailto:${COMPANY.email}`} className="inline-block py-1 hover:text-white">
                {COMPANY.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone size={18} className="mt-0.5 shrink-0 text-accent-light" />
              <a href={COMPANY.phoneHref} className="inline-block py-1 hover:text-white">
                {COMPANY.phone}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={18} className="mt-0.5 shrink-0 text-accent-light" />
              <span>
                {COMPANY.address.street}, {COMPANY.address.postalCode} {COMPANY.address.city}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Star size={18} className="mt-0.5 shrink-0 text-accent-light" />
              <a
                href={COMPANY.trustpilotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-1 hover:text-white"
              >
                Beoordeel ons op Trustpilot
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Service</h3>
          <ul className="mt-4 space-y-2.5">
            {FOOTER_LEGAL_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className="inline-block py-1 text-sm text-white/80 hover:text-white">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {COMPANY.legalName}. {COMPANY.address.city}
            {COMPANY.kvk ? ` — KvK ${COMPANY.kvk}` : ''}.
          </p>
          <p>{COMPANY.tagline}</p>
        </Container>
      </div>
    </footer>
  )
}
