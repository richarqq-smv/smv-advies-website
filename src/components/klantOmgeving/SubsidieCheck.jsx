import { useEffect, useMemo, useState } from 'react'
import { ArrowSquareOut, Plus, CheckCircle, WarningCircle, ArrowBendUpLeft, ArrowRight } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { ROUTES } from '../../lib/routes'
import { buildInsights } from '../../lib/mjop/linking'
import { buildEnergieInsights } from '../../lib/dossier/energieInsights'
import { adminListRvoSubsidieIndex, addDossierSubsidie, koppelSubsidieMaatregel, listDossierSubsidieSpecificaties } from '../../lib/klantOmgeving/api'
import {
  bepaalSubsidieSignalen,
  koppelRvoRegelingenAanDossier,
  vindGekoppeldAdviespunt,
  sorteerSubsidieCheck,
  SUBSIDIE_CHECK_STATUSSEN,
  SUBSIDIE_CHECK_STATUS_LABELS,
} from '../../lib/dossier/subsidieCheck'
import { naarSpecificatiesPerMaatregel } from '../../lib/subsidie/subsidieSpecificatieMapping'
import { bouwSubsidieDocumentData } from '../../lib/subsidie/subsidieDocumentData'
import { SUBSIDIE_STATUSSEN } from '../../lib/subsidie/subsidieEligibility'
import { FISCAAL_RELEVANTIE_STATUS } from '../../lib/subsidie/fiscaleKoppeling'

const RVO_BASIS_URL = 'https://www.rvo.nl'

const STATUS_BADGE = {
  [SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD]: 'bg-primary/10 text-primary',
  [SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT]: 'bg-accent/10 text-accent',
  [SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN]: 'bg-muted text-foreground-muted',
}

const ISDE_RELEVANT_STATUSSEN = [SUBSIDIE_STATUSSEN.VAN_TOEPASSING, SUBSIDIE_STATUSSEN.WAARSCHIJNLIJK_VAN_TOEPASSING]

/** Compacte categoriekaart met één primaire actie — gedeeld layout voor ISDE/EIA-MIA-Vamil/Regionaal. Geen closures, dus op moduleniveau (niet opnieuw aangemaakt per render). */
function CategorieKaart({ titel, samenvatting, actieLabel, actieHref, toon }) {
  if (!toon) return null
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-primary">{titel}</p>
        <p className="mt-0.5 text-xs text-foreground-muted">{samenvatting}</p>
      </div>
      {actieHref ? (
        <Button as="link" to={actieHref} variant="outline" size="sm" className="shrink-0">
          {actieLabel} <ArrowRight size={14} />
        </Button>
      ) : null}
    </div>
  )
}

/**
 * Subsidiecheck (herontwerp 2026-10-09, opdracht deel 8: "duidelijke,
 * compacte en inhoudelijk relevante werklijst"). Eén dossierbrede
 * samenvatting + vier herkenbare categorieën (ISDE / EIA-MIA-Vamil /
 * Regionaal / Overige regelingen), in plaats van één lange, platte lijst.
 *
 * Bewust GEEN herimplementatie van de ISDE- of EIA/MIA/Vamil-
 * beoordelingslogica hier: dit component roept uitsluitend de al
 * bestaande, al geteste bouwSubsidieDocumentData() aan (zelfde functie als
 * AdminSubsidieBegeleiding.jsx) om de ISDE-/fiscale categorie-samenvatting
 * te bepalen — "geen tweede subsidieplatform" (opdracht, hoofddoel). De
 * volledige invoer/detail-UI voor die twee categorieën blijft op de
 * bestaande, specifieke pagina (/admin/dossiers/:id/subsidie); dit
 * component toont er alleen een eerlijke, uit de werkelijke resultaten
 * afgeleide samenvatting van en linkt door ("Details bekijken").
 *
 * Bekende grens (gedocumenteerd, geen gok): de ISDE-/fiscale-samenvatting
 * hier gebruikt GEEN opname-waarnemingen (die zijn puur ter referentie en
 * hebben geen invloed op eligibility/status, zie subsidieDocumentData.js)
 * — dat bespaart een reeks extra opname-queries op elke dossierpagina-
 * weergave, zonder de samenvatting onjuist te maken.
 *
 * Categorie "Regionaal"/"Overige regelingen" hergebruiken ongewijzigd de
 * bestaande rvo_subsidie_index-koppeling (subsidieCheck.js) — nu met de
 * semantische "Klimaat en energie"-filter (zie subsidieCheck.js) zodat een
 * algemene financierings-/innovatieregeling (Innovatiekrediet,
 * Borgstelling MKB-kredieten e.d.) nooit meer tussen de concrete
 * gebouwmaatregelen verschijnt.
 */
export function SubsidieCheck({ dossierId, pand, mjopSnapshot, energieSnapshot, subsidies = [], adviespunten = [], magBeheren, onSubsidieToegevoegd }) {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [rvoItems, setRvoItems] = useState([])
  const [specificatiesPerMaatregel, setSpecificatiesPerMaatregel] = useState({})
  const [toonOverige, setToonOverige] = useState(false)
  const [toevoegenBezigId, setToevoegenBezigId] = useState(null)

  useEffect(() => {
    let actief = true
    setLaden(true)
    setFout(null)
    Promise.all([adminListRvoSubsidieIndex(), listDossierSubsidieSpecificaties(dossierId)])
      .then(([rows, specs]) => {
        if (!actief) return
        setRvoItems(rows)
        setSpecificatiesPerMaatregel(naarSpecificatiesPerMaatregel(specs))
      })
      .catch(() => actief && setFout('Subsidiegegevens konden niet worden geladen.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [dossierId])

  const mjopInsights = useMemo(() => (mjopSnapshot?.components ? buildInsights(mjopSnapshot) : []), [mjopSnapshot])
  const energieInsights = useMemo(() => buildEnergieInsights(energieSnapshot), [energieSnapshot])

  // Hergebruikt bouwSubsidieDocumentData() voor zowel ISDE als EIA/MIA/
  // Vamil — zelfde brondata/logica als de volledige subsidiebegeleidings-
  // pagina, hier alleen samengevat (zie moduledoc hierboven).
  const documentData = useMemo(
    () => bouwSubsidieDocumentData({ dossier: { panden: pand }, specificatiesPerMaatregel, mjopInsights, energieInsights }),
    [pand, specificatiesPerMaatregel, mjopInsights, energieInsights],
  )

  const isdeAangeraakt = documentData.maatregelen.filter((m) => m.specificatie != null)
  const isdeRelevant = isdeAangeraakt.filter((m) => ISDE_RELEVANT_STATUSSEN.includes(m.status))
  const isdeControle = isdeAangeraakt.filter((m) => m.status === SUBSIDIE_STATUSSEN.CONTROLE_VEREIST)
  const isdeOntbrekend = isdeAangeraakt.filter((m) => m.status === SUBSIDIE_STATUSSEN.NIET_VOLDOENDE_GEGEVENS)

  const fiscaalRelevant = documentData.fiscaleRegelingen.filter((r) => r.status === FISCAAL_RELEVANTIE_STATUS.MOGELIJK_RELEVANT)
  const fiscaalControle = documentData.fiscaleRegelingen.filter((r) => r.status === FISCAAL_RELEVANTIE_STATUS.CONTROLE_VEREIST)

  const buitenScope = documentData.nietOndersteund.filter((r) => r.status === 'niet_subsidiabel')

  // Hergebruikt uitsluitend de al bestaande, al geteste advieslogica — zelfde
  // functies als DossierWerkruimte.jsx al gebruikt voor dit dossier.
  const gekoppeld = useMemo(() => {
    const signalen = bepaalSubsidieSignalen({ pand, mjopInsights, energieInsights })
    return sorteerSubsidieCheck(koppelRvoRegelingenAanDossier({ rvoItems, signalen, bestaandeSubsidies: subsidies }))
  }, [rvoItems, subsidies, mjopInsights, energieInsights, pand])

  const rvoRelevant = gekoppeld.filter((g) => g.status === SUBSIDIE_CHECK_STATUSSEN.MOGELIJK_RELEVANT)
  const rvoOverig = gekoppeld.filter((g) => g.status === SUBSIDIE_CHECK_STATUSSEN.TE_BEOORDELEN)

  const totaalRelevant = isdeRelevant.length + fiscaalRelevant.length + rvoRelevant.length
  const totaalOntbrekend = isdeOntbrekend.length
  const totaalControle = isdeControle.length + fiscaalControle.length
  const totaalBuitenScope = buitenScope.length

  /** Feitelijke, uit het daadwerkelijk gebruikte criterium afgeleide tekst — nooit een geïnterpreteerde/verzonnen reden. */
  function waaromTekst(signaal) {
    const bronOmschrijving = signaal.bron.type === 'mjop' ? 'de MJOP-maatregel' : signaal.bron.type === 'energie' ? 'de Energie-indicatie-maatregel' : 'het pandtype'
    return `Regelingtekst (titel/sector/doelgroep) bevat "${signaal.tekst}", wat overeenkomt met ${bronOmschrijving} "${signaal.bron.label}" in dit dossier.`
  }

  async function toevoegenAlsTraject(gekoppeldItem) {
    const { item, matchendeSignalen } = gekoppeldItem
    setToevoegenBezigId(item.id)
    try {
      const nieuw = await addDossierSubsidie(dossierId, { regelingNaam: item.titel })
      let koppeling = null
      const gevondenAdviespunt = matchendeSignalen.map((s) => vindGekoppeldAdviespunt(s, adviespunten)).find(Boolean)
      if (gevondenAdviespunt) {
        try {
          koppeling = await koppelSubsidieMaatregel(nieuw.subsidie_id, gevondenAdviespunt.adviespunt_id)
          koppeling = { ...koppeling, adviespunten: gevondenAdviespunt }
        } catch {
          koppeling = null
        }
      }
      onSubsidieToegevoegd?.(nieuw, koppeling)
    } catch {
      setFout('Toevoegen aan dossier is niet gelukt. Probeer het opnieuw.')
    } finally {
      setToevoegenBezigId(null)
    }
  }

  function RvoRegel({ gekoppeldItem }) {
    const { item, status, matchendeSignalen } = gekoppeldItem
    const aanleidingen = [...new Map(matchendeSignalen.map((s) => [`${s.bron.type}:${s.bron.label}`, s])).values()]
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <a
              href={item.url ? `${RVO_BASIS_URL}${item.url}` : RVO_BASIS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1.5 font-medium text-primary hover:text-accent hover:underline"
            >
              <span className="min-w-0 break-words">{item.titel}</span>
              <ArrowSquareOut size={14} className="mt-0.5 shrink-0 text-foreground-muted" />
            </a>
            {item.intro ? <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">{item.intro}</p> : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[status]}`}>
              {SUBSIDIE_CHECK_STATUS_LABELS[status]}
            </span>
            {magBeheren && status !== SUBSIDIE_CHECK_STATUSSEN.VASTGELEGD ? (
              <Button type="button" variant="outline" size="sm" onClick={() => toevoegenAlsTraject(gekoppeldItem)} disabled={toevoegenBezigId === item.id}>
                <Plus size={14} /> {toevoegenBezigId === item.id ? 'Bezig...' : 'Toevoegen aan dossier'}
              </Button>
            ) : null}
          </div>
        </div>

        {aanleidingen.length > 0 ? (
          <div className="flex flex-col gap-1 rounded-md bg-muted/40 px-2.5 py-2 text-xs text-foreground-muted">
            <p className="flex flex-wrap items-center gap-1 font-medium text-foreground">
              <ArrowBendUpLeft size={12} className="shrink-0" />
              Aanleiding:{' '}
              {aanleidingen.map((s, i) => (
                <span key={`${s.bron.type}:${s.bron.label}`} className="break-words">
                  {s.bron.label}
                  {i < aanleidingen.length - 1 ? ',' : ''}
                </span>
              ))}
            </p>
            <p className="break-words">{waaromTekst(aanleidingen[0])}</p>
          </div>
        ) : null}
      </li>
    )
  }

  if (laden) {
    return (
      <div className="mt-6 border-t border-border pt-6">
        <p className="text-sm text-foreground-muted">Bezig met laden...</p>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6">
      <div>
        <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase">Subsidiecheck</p>
        <h4 className="text-base font-medium text-primary">Welke regelingen zijn het bekijken waard?</h4>
      </div>

      {fout ? (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
          <WarningCircle size={15} weight="fill" />
          {fout}
        </p>
      ) : null}

      {/* Samenvatting (opdracht §8.1) — aantallen afgeleid uit de werkelijke resultaten hierboven, nooit een vaste/geraden tekst. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-accent/5 px-3 py-2 text-center">
          <p className="text-xl font-semibold text-accent">{totaalRelevant}</p>
          <p className="text-[11px] text-foreground-muted">Relevante mogelijkheden</p>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-center">
          <p className="text-xl font-semibold text-amber-800">{totaalOntbrekend}</p>
          <p className="text-[11px] text-foreground-muted">Ontbrekende gegevens</p>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2 text-center">
          <p className="text-xl font-semibold text-foreground">{totaalControle}</p>
          <p className="text-[11px] text-foreground-muted">Handmatige controle</p>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2 text-center">
          <p className="text-xl font-semibold text-foreground-muted">{totaalBuitenScope}</p>
          <p className="text-[11px] text-foreground-muted">Buiten scope</p>
        </div>
      </div>

      {/* Categorieën (opdracht §8.2) */}
      <div className="flex flex-col gap-2">
        <CategorieKaart
          titel="ISDE — directe subsidie"
          toon={isdeAangeraakt.length > 0}
          samenvatting={`${isdeRelevant.length} mogelijk relevant · ${isdeControle.length} controle vereist · ${isdeOntbrekend.length} nog aan te vullen`}
          actieLabel="Details bekijken"
          actieHref={ROUTES.adminSubsidieBegeleiding(dossierId)}
        />
        <CategorieKaart
          titel="EIA / MIA / Vamil — fiscale regelingen"
          toon={documentData.fiscaleRegelingen.length > 0}
          samenvatting={`${fiscaalRelevant.length} mogelijk relevant · ${fiscaalControle.length} controle vereist — géén directe subsidie, fiscale aftrek/afschrijving`}
          actieLabel="Details bekijken"
          actieHref={`${ROUTES.adminSubsidieBegeleiding(dossierId)}#eia-mia-vamil-sectie`}
        />
        <CategorieKaart
          titel="Regionale en lokale regelingen"
          toon={true}
          samenvatting={documentData.regionaal.boodschap}
          actieLabel={null}
          actieHref={null}
        />
      </div>

      {/* Overige relevante regelingen — rvo_subsidie_index, nu semantisch gefilterd (zie subsidieCheck.js). */}
      {rvoRelevant.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-semibold tracking-[0.1em] text-foreground-muted uppercase">Overige relevante regelingen</p>
          <ul className="flex flex-col gap-2">
            {rvoRelevant.map((g) => (
              <RvoRegel key={g.item.id} gekoppeldItem={g} />
            ))}
          </ul>
        </div>
      ) : null}

      {rvoOverig.length > 0 ? (
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setToonOverige((v) => !v)}>
            {toonOverige ? 'Verberg' : 'Toon'} nog te beoordelen regelingen ({rvoOverig.length})
          </Button>
          {toonOverige ? (
            <ul className="mt-2 flex flex-col gap-2">
              {rvoOverig.map((g) => (
                <RvoRegel key={g.item.id} gekoppeldItem={g} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
        <CheckCircle size={13} />
        Geen garantie op toekenning — de daadwerkelijke beoordeling wordt uitsluitend door de betreffende regelingverstrekker gedaan.
      </p>
    </div>
  )
}
