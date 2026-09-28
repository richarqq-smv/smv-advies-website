import { euro, formatDatumNl } from '../../lib/klantOmgeving/factuur'

/**
 * De factuur zelf — één renderbron voor zowel de schermweergave als de
 * print/PDF-uitvoer (zie FactuurDetail.jsx: exact deze boom wordt getoond
 * én afgedrukt via window.print(), zelfde principe als OfferteDocument.jsx
 * voor offertes — geen aparte "PDF-generatie"-bibliotheek).
 *
 * Bewust alleen bevroren gegevens: `factuur.klant_snapshot` en
 * `factuur.regels` (nooit een live opzoeking in klanten/offertes), en de
 * bedrijfsgegevens uit `instellingen` (factuur_instellingen, zie
 * FactuurDetail.jsx) — nooit uit data/company.js, dat blijft de publieke-
 * website-bron (zie 0013_factuur_instellingen.sql). Zo blijft een eenmaal
 * verzonden factuur historisch correct, ook als de offerte waar hij uit
 * ontstond of de bedrijfsinstellingen later wijzigen.
 *
 * Er is nog geen door de gebruiker aangeleverde huisstijl-sjabloon
 * beschikbaar in deze repository (zie het eindrapport van de
 * Administratie-ronde) — deze weergave hergebruikt bewust dezelfde
 * indeling als OfferteDocument.jsx zodat er later één sjabloon-bestand
 * voor in de plaats kan komen zonder de rest van de factuurarchitectuur
 * te hoeven aanpassen.
 */
export function FactuurDocument({ factuur, instellingen, toonNotitie = true }) {
  const { klant, contactpersoon } = factuur.klant_snapshot ?? {}
  const regels = Array.isArray(factuur.regels) ? factuur.regels : []

  return (
    <article className="factuur-document bg-white text-[13.5px] leading-relaxed text-foreground print:text-[11.5pt]">
      {/* 1. Titelblok */}
      <header className="factuur-blok mb-8 flex items-start justify-between gap-6 border-b border-border pb-6 break-inside-avoid">
        <div>
          <img src="/logo-header.png" alt={instellingen.bedrijfsnaam} width="149" height="84" className="mb-4 h-14 w-auto" />
          <p className="text-foreground-muted">
            {instellingen.adres}
            <br />
            {instellingen.postcode} {instellingen.plaats}
            {instellingen.kvk_nummer ? (
              <>
                <br />
                KvK {instellingen.kvk_nummer}
              </>
            ) : null}
            {instellingen.btw_id ? (
              <>
                <br />
                Btw-id {instellingen.btw_id}
              </>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <h1 className="font-heading text-2xl text-primary">Factuur</h1>
          <dl className="mt-2 flex flex-col gap-0.5 text-foreground-muted">
            <div>
              <dt className="inline">Factuurnummer: </dt>
              <dd className="inline font-medium text-primary">{factuur.factuurnummer}</dd>
            </div>
            <div>
              <dt className="inline">Factuurdatum: </dt>
              <dd className="inline text-primary">{formatDatumNl(factuur.factuurdatum)}</dd>
            </div>
            <div>
              <dt className="inline">Vervaldatum: </dt>
              <dd className="inline text-primary">{formatDatumNl(factuur.vervaldatum)}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* 2. Klant */}
      <section className="factuur-blok mb-7 break-inside-avoid">
        <h2 className="mb-2 break-after-avoid text-xs font-semibold tracking-[0.1em] text-accent uppercase">Aan</h2>
        <p className="text-primary">
          {klant?.bedrijfsnaam || klant?.naam}
          {klant?.bedrijfsnaam && klant?.naam ? (
            <>
              <br />
              t.a.v. {klant.naam}
            </>
          ) : null}
          {contactpersoon ? (
            <>
              <br />
              {contactpersoon.naam}
              {contactpersoon.rol ? ` (${contactpersoon.rol})` : ''}
            </>
          ) : null}
          <br />
          {klant?.email}
          {klant?.telefoon ? <> · {klant.telefoon}</> : null}
        </p>
      </section>

      {/* 3. Factuurregels */}
      <section className="factuur-blok mb-7">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs text-foreground-muted">
              <th className="py-1.5 font-medium">Omschrijving</th>
              <th className="py-1.5 text-right font-medium">Aantal</th>
              <th className="py-1.5 text-right font-medium">Prijs excl. btw</th>
              <th className="py-1.5 text-right font-medium">Btw</th>
              <th className="py-1.5 text-right font-medium">Totaal excl. btw</th>
            </tr>
          </thead>
          <tbody>
            {regels.map((regel, i) => (
              <tr key={i} className="factuur-tabelrij break-inside-avoid border-b border-border/60">
                <td className="py-1.5 text-primary">
                  {regel.omschrijving}
                  {regel.eenheid && regel.eenheid !== 'stuk' ? <span className="text-foreground-muted"> ({regel.eenheid})</span> : null}
                </td>
                <td className="py-1.5 text-right text-primary">{regel.aantal}</td>
                <td className="py-1.5 text-right text-primary">{euro(regel.prijsExclBtw)}</td>
                <td className="py-1.5 text-right text-primary">{regel.btwPercentage}%</td>
                <td className="py-1.5 text-right text-primary">{euro(regel.regelbedragExclBtw)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 4. Totaaloverzicht */}
      <section className="factuur-blok mb-7 break-inside-avoid">
        <dl className="flex flex-col gap-1 border-t border-border pt-3 sm:ml-auto sm:w-80">
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Subtotaal excl. btw</dt>
            <dd className="text-primary">{euro(factuur.subtotaal_excl_btw)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Btw</dt>
            <dd className="text-primary">{euro(factuur.btw_bedrag)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-1 font-medium">
            <dt className="text-primary">Totaal incl. btw</dt>
            <dd className="text-primary">{euro(factuur.totaal_incl_btw)}</dd>
          </div>
        </dl>
        {/*
          toonNotitie (Klantomgeving-uitbreiding, 2026-09-28): notitie is
          een vrij invoerveld voor de admin, bedoeld als interne
          kanttekening bij het opstellen — nooit automatisch aan de klant
          tonen (zie opdracht: "klant mag geen interne notities zien"),
          ook al zou getFactuur() de kolom zelf wel meegeven. Admin-alleen
          weergave, default true zodat de bestaande admin-weergave
          (FactuurDetail.jsx onder /admin/facturen/:id) ongewijzigd blijft.
        */}
        {toonNotitie && factuur.notitie ? (
          <p className="mt-4 text-primary">
            <span className="font-medium">Notitie: </span>
            {factuur.notitie}
          </p>
        ) : null}
      </section>

      {/* 5. Betalingsinformatie */}
      <section className="factuur-blok break-inside-avoid">
        <h2 className="mb-2 break-after-avoid text-xs font-semibold tracking-[0.1em] text-accent uppercase">Betaling</h2>
        <p className="text-foreground-muted">
          Wij verzoeken u het totaalbedrag van {euro(factuur.totaal_incl_btw)} vóór {formatDatumNl(factuur.vervaldatum)} over te maken naar{' '}
          <span className="text-primary">{instellingen.iban}</span>
          {instellingen.tenaamstelling ? <> t.n.v. {instellingen.tenaamstelling}</> : null}, onder vermelding van factuurnummer {factuur.factuurnummer}.
        </p>
        {instellingen.betalingsvoorwaarden ? <p className="mt-2 text-foreground-muted">{instellingen.betalingsvoorwaarden}</p> : null}
      </section>
    </article>
  )
}
