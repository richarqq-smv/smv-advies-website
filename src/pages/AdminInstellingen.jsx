import { useEffect, useState } from 'react'
import { ArrowLeft, WarningCircle, CheckCircle } from '@phosphor-icons/react'
import { Seo } from '../components/seo/Seo'
import { PageHero } from '../components/ui/PageHero'
import { Section } from '../components/ui/Section'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { ROUTES } from '../lib/routes'
import { getFactuurInstellingen, updateFactuurInstellingen } from '../lib/klantOmgeving/api'

const SELECT_CLASSNAME =
  'w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-primary focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

/**
 * Instellingen (/admin/administratie/instellingen, opdracht sectie 14) —
 * één formulier, gebonden aan de singleton-tabel factuur_instellingen
 * (0013_factuur_instellingen.sql, altijd precies één rij). Dit is de
 * enige plek waar deze gegevens bewerkt worden — nergens anders in de
 * applicatie staan IBAN/btw-id/betalingsvoorwaarden hardcoded (zie
 * FactuurDocument.jsx/factuur.js die uitsluitend van hier lezen).
 */
export default function AdminInstellingen() {
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [formulier, setFormulier] = useState(null)
  const [opslaanBezig, setOpslaanBezig] = useState(false)
  const [opslaanFout, setOpslaanFout] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)

  useEffect(() => {
    let actief = true
    getFactuurInstellingen()
      .then((i) => {
        if (!actief) return
        setFormulier({
          bedrijfsnaam: i.bedrijfsnaam ?? '',
          adres: i.adres ?? '',
          postcode: i.postcode ?? '',
          plaats: i.plaats ?? '',
          kvkNummer: i.kvk_nummer ?? '',
          btwId: i.btw_id ?? '',
          iban: i.iban ?? '',
          tenaamstelling: i.tenaamstelling ?? '',
          betalingsvoorwaarden: i.betalingsvoorwaarden ?? '',
          standaardBetalingstermijnDagen: String(i.standaard_betalingstermijn_dagen ?? 14),
          factuurprefix: i.factuurprefix ?? '',
          standaardBtwPercentage: String(i.standaard_btw_percentage ?? 21),
        })
      })
      .catch(() => actief && setFout('Laden is niet gelukt. Probeer het opnieuw.'))
      .finally(() => actief && setLaden(false))
    return () => {
      actief = false
    }
  }, [])

  function wijzigVeld(veld, waarde) {
    setOpgeslagen(false)
    setFormulier((f) => ({ ...f, [veld]: waarde }))
  }

  async function opslaan(e) {
    e.preventDefault()
    setOpslaanBezig(true)
    setOpslaanFout(false)
    try {
      await updateFactuurInstellingen({
        ...formulier,
        standaardBetalingstermijnDagen: Number(formulier.standaardBetalingstermijnDagen),
        standaardBtwPercentage: Number(formulier.standaardBtwPercentage),
      })
      setOpgeslagen(true)
    } catch {
      setOpslaanFout(true)
    } finally {
      setOpslaanBezig(false)
    }
  }

  return (
    <>
      <Seo title="Instellingen" description="Bedrijfs- en factuurgegevens." noindex />
      <PageHero eyebrow="Administratie" title="Instellingen" description="Bedrijfs- en betaalgegevens die op elke nieuwe factuur worden gebruikt." />
      <Section tone="white" noTopPadding>
        <Container className="max-w-2xl">
          <Button as="link" to={ROUTES.adminAdministratie} variant="ghost" size="sm" className="mb-5">
            <ArrowLeft size={16} /> Administratie
          </Button>

          {laden ? (
            <p className="text-sm text-foreground-muted">Bezig met laden...</p>
          ) : fout || !formulier ? (
            <p role="alert" className="text-sm font-medium text-error">
              {fout}
            </p>
          ) : (
            <form onSubmit={opslaan} className="flex flex-col gap-5 rounded-2xl border border-border bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField id="inst-bedrijfsnaam" label="Bedrijfsnaam" required value={formulier.bedrijfsnaam} onChange={(v) => wijzigVeld('bedrijfsnaam', v)} />
                <TextField id="inst-kvk" label="KvK-nummer" value={formulier.kvkNummer} onChange={(v) => wijzigVeld('kvkNummer', v)} />
                <TextField id="inst-adres" label="Adres" value={formulier.adres} onChange={(v) => wijzigVeld('adres', v)} />
                <TextField id="inst-btwid" label="Btw-id" value={formulier.btwId} onChange={(v) => wijzigVeld('btwId', v)} />
                <TextField id="inst-postcode" label="Postcode" value={formulier.postcode} onChange={(v) => wijzigVeld('postcode', v)} />
                <TextField id="inst-plaats" label="Plaats" value={formulier.plaats} onChange={(v) => wijzigVeld('plaats', v)} />
                <TextField id="inst-iban" label="IBAN" value={formulier.iban} onChange={(v) => wijzigVeld('iban', v)} />
                <TextField id="inst-tenaamstelling" label="Tenaamstelling rekening" value={formulier.tenaamstelling} onChange={(v) => wijzigVeld('tenaamstelling', v)} />
                <TextField id="inst-prefix" label="Factuurprefix" required value={formulier.factuurprefix} onChange={(v) => wijzigVeld('factuurprefix', v)} />
                <div>
                  <label htmlFor="inst-termijn" className="mb-2 block text-sm font-medium text-primary">
                    Standaard betalingstermijn (dagen)
                  </label>
                  <input
                    id="inst-termijn"
                    type="number"
                    min="1"
                    value={formulier.standaardBetalingstermijnDagen}
                    onChange={(e) => wijzigVeld('standaardBetalingstermijnDagen', e.target.value)}
                    className={SELECT_CLASSNAME}
                  />
                </div>
                <div>
                  <label htmlFor="inst-btw" className="mb-2 block text-sm font-medium text-primary">
                    Standaard btw-percentage
                  </label>
                  <input
                    id="inst-btw"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formulier.standaardBtwPercentage}
                    onChange={(e) => wijzigVeld('standaardBtwPercentage', e.target.value)}
                    className={SELECT_CLASSNAME}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inst-voorwaarden" className="mb-2 block text-sm font-medium text-primary">
                  Betalingsvoorwaarden
                </label>
                <textarea
                  id="inst-voorwaarden"
                  rows={3}
                  value={formulier.betalingsvoorwaarden}
                  onChange={(e) => wijzigVeld('betalingsvoorwaarden', e.target.value)}
                  className={SELECT_CLASSNAME}
                />
              </div>

              {opslaanFout ? (
                <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-error">
                  <WarningCircle size={15} weight="fill" />
                  Opslaan is niet gelukt. Probeer het opnieuw.
                </p>
              ) : null}
              {opgeslagen ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <CheckCircle size={15} weight="fill" />
                  Opgeslagen.
                </p>
              ) : null}

              <div>
                <Button type="submit" variant="primary" size="sm" disabled={opslaanBezig}>
                  {opslaanBezig ? 'Bezig...' : 'Opslaan'}
                </Button>
              </div>
            </form>
          )}
        </Container>
      </Section>
    </>
  )
}
