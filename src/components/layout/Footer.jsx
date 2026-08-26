import { NavLink } from 'react-router-dom'
import { EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react'
import { Container } from '../ui/Container'
import { Logo } from '../ui/Logo'
import { NAV_ITEMS, FOOTER_LEGAL_ITEMS } from '../../data/navigation'
import { COMPANY } from '../../data/company'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary text-white">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="light" />
          <p className="mt-4 max-w-[32ch] text-sm leading-relaxed text-white/70">
            Onafhankelijk verduurzamingsadvies voor mkb-bedrijfspanden in de Hoeksche Waard.{' '}
            {COMPANY.tagline}.
          </p>
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
