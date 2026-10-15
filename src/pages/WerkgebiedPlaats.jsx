import { CheckCircle, MapPin } from '@phosphor-icons/react'
import { useParams, Link } from 'react-router-dom'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { ClosingCta } from '../components/home/ClosingCta'
import { getBreadcrumbSchema, getFaqSchema } from '../lib/structuredData'
import { ROUTES } from '../lib/routes'
import { WERKGEBIED_PLAATSEN, getWerkgebiedPlaatsBySlug } from '../data/werkgebiedPlaatsen'
import NotFound from './NotFound'

/**
 * Dorpspagina's (SEO-ronde 2026-10-15) — gebaseerd op dezelfde eerlijke
 * opzet als Cases.jsx: we hebben nog geen geverifieerde praktijkcases per
 * dorp, dus die worden hier ook niet gesuggereerd. Wat wel per dorp
 * verschilt is `intro`/`feit` (zie werkgebiedPlaatsen.js) — echte,
 * controleerbare lokale feiten, geen sjabloonzin met alleen de dorpsnaam
 * verwisseld.
 */
export default function WerkgebiedPlaats() {
  const { plaats: slug } = useParams()
  const plaats = getWerkgebiedPlaatsBySlug(slug)

  if (!plaats) {
    return <NotFound />
  }

  const anderePlaatsen = WERKGEBIED_PLAATSEN.filter((p) => p.slug !== plaats.slug).slice(0, 4)

  return (
    <>
      <Seo
        title={plaats.title}
        description={plaats.metaDescription}
        structuredData={[
          getBreadcrumbSchema([{ name: plaats.naam, path: ROUTES.werkgebiedPlaats(plaats.slug) }]),
          getFaqSchema([{ items: plaats.faq }]),
        ]}
      />

      <PageHero
        eyebrow="Hoeksche Waard"
        title={`Verduurzamingsadvies in ${plaats.naam}`}
        description={plaats.intro}
      />

      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 px-6 py-5">
            <MapPin size={20} weight="light" className="mt-0.5 shrink-0 text-accent" />
            <p className="text-sm leading-relaxed text-foreground-muted">{plaats.feit}</p>
          </div>

          <p className="mt-8 text-base leading-relaxed text-foreground-muted">
            Op dit moment publiceren we geen geverifieerde praktijkcases specifiek voor{' '}
            {plaats.naam}. Cijfers, resultaten of klantverhalen die we niet met zekerheid kunnen
            onderbouwen, laten we daarom liever weg. Wel werken we hier op precies dezelfde manier
            als in de rest van de Hoeksche Waard:
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {[
              `Onafhankelijk advies voor uw bedrijfspand in ${plaats.naam}, zonder verkoop van installaties.`,
              'Een gratis energie-indicatie als vrijblijvende eerste stap.',
              plaats.bedrijventerrein
                ? `Lokale kennis van ${plaats.bedrijventerrein} en de bedrijfspanden daaromheen.`
                : `Lokale kennis van de bedrijfspanden in en rond ${plaats.naam}.`,
              'Een helder rapport met prioritering: wat eerst, en wat kan wachten.',
            ].map((punt) => (
              <li key={punt} className="flex items-start gap-2.5">
                <CheckCircle size={18} weight="light" className="mt-0.5 shrink-0 text-accent" />
                <span className="text-sm leading-relaxed text-foreground-muted">{punt}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={ROUTES.energieIndicatie}>Start de gratis energie-indicatie</Button>
            <Button to={ROUTES.cases} variant="outline">
              Hoe een advies tot stand komt
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container className="max-w-2xl">
          <h2 className="text-xl font-semibold text-primary">Veelgestelde vragen over {plaats.naam}</h2>
          <dl className="mt-6 flex flex-col gap-6">
            {plaats.faq.map((item) => (
              <div key={item.question}>
                <dt className="text-base font-semibold text-primary">{item.question}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section tone="white">
        <Container className="max-w-2xl">
          <h2 className="text-lg font-semibold text-primary">Ook actief in de rest van de Hoeksche Waard</h2>
          <nav aria-label="Andere plaatsen" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {anderePlaatsen.map((p) => (
              <Link
                key={p.slug}
                to={ROUTES.werkgebiedPlaats(p.slug)}
                className="text-sm font-medium text-accent underline underline-offset-2 hover:text-secondary"
              >
                {p.naam}
              </Link>
            ))}
            <Link
              to={ROUTES.werkgebied}
              className="text-sm font-medium text-accent underline underline-offset-2 hover:text-secondary"
            >
              Alle plaatsen
            </Link>
          </nav>
        </Container>
      </Section>

      <ClosingCta
        heading={`Uw bedrijfspand in ${plaats.naam}?`}
        description={`We bespreken graag hoe we voor uw pand in ${plaats.naam} van nut kunnen zijn, of start eerst de gratis energie-indicatie.`}
      />
    </>
  )
}
