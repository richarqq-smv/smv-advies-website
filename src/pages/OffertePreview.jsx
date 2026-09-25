import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { Button } from '../components/ui/Button'
import { OfferteDocument } from '../components/klantOmgeving/OfferteDocument'
import { getOfferte } from '../lib/klantOmgeving/api'
import { ROUTES } from '../lib/routes'

/**
 * Preview- en printpagina voor één opgeslagen offerte (Fase 3). Bewust
 * buiten <MainLayout /> gerouteerd (zie App.jsx) — geen header/nav/footer
 * om te verbergen bij het afdrukken, in plaats van die her en der met
 * print-CSS te moeten wegwerken.
 *
 * Eén renderbron: dezelfde <OfferteDocument /> wordt zowel op het scherm
 * getoond als afgedrukt — window.print() print exact de op dat moment
 * zichtbare DOM, er is geen apart "PDF-generatie"-pad. De knoppen hieronder
 * zijn zelf `print:hidden` zodat ze nooit meeprinten.
 */
export default function OffertePreview() {
  const { dossierId, offerteId } = useParams()
  const [laden, setLaden] = useState(true)
  const [nietGevonden, setNietGevonden] = useState(false)
  const [offerte, setOfferte] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setNietGevonden(false)
    getOfferte(offerteId)
      .then((o) => {
        if (!actief) return
        // Defensief: een offerte-id dat niet bij dit dossier-id in de URL
        // hoort, behandelen we hetzelfde als "niet gevonden" — RLS staat
        // dit sowieso al alleen aan een admin toe, dit voorkomt alleen een
        // verwarrende weergave bij een verkeerd samengestelde URL.
        if (o.dossier_id !== dossierId) {
          setNietGevonden(true)
        } else {
          setOfferte(o)
        }
      })
      .catch(() => {
        if (actief) setNietGevonden(true)
      })
      .finally(() => {
        if (actief) setLaden(false)
      })
    return () => {
      actief = false
    }
  }, [dossierId, offerteId])

  return (
    <>
      <Seo title="Offerte" description="Offertepreview." noindex />
      <div className="min-h-dvh bg-muted/40 print:bg-white">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-4 px-4 py-4 print:hidden sm:px-6">
          <Button as="link" to={ROUTES.dossier(dossierId)} variant="ghost" size="sm">
            <ArrowLeft size={16} /> Terug
          </Button>
          {offerte ? (
            <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={16} /> Afdrukken / Opslaan als PDF
            </Button>
          ) : null}
        </div>

        <div className="mx-auto max-w-[900px] px-4 pb-16 print:p-0 sm:px-6">
          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : nietGevonden || !offerte ? (
            <p className="rounded-lg border border-dashed border-border bg-white px-5 py-6 text-center text-sm text-foreground-muted">
              Deze offerte bestaat niet, of u heeft er geen toegang toe.
            </p>
          ) : (
            <div className="rounded-2xl border border-border bg-white p-8 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-12">
              <OfferteDocument offerte={offerte} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
