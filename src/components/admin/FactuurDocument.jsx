import { euro, formatDatumNl, afgeleidBetreft, afgeleidBtwPercentage } from '../../lib/klantOmgeving/factuur'

// SMV-huisstijlkleur uit het aangeleverde factuursjabloon (donkergroen,
// gebruikt voor tabelkopregels en de titel) — bewust hier als lokale
// constante in plaats van een nieuw globaal @theme-kleurtoken (index.css):
// dit is een sjabloonspecifieke kleur voor uitsluitend het factuurdocument,
// geen wijziging van het bestaande, sitebrede kleurenpalet.
const SMV_DONKERGROEN = '#0E2318'
const SMV_LICHTGRIJS = '#EFEFEF'

/**
 * De factuur zelf — één renderbron voor zowel de schermweergave als de
 * print/PDF-uitvoer (zie FactuurDetail.jsx: exact deze boom wordt getoond
 * én afgedrukt via window.print(), zelfde principe als OfferteDocument.jsx
 * voor offertes — geen aparte "PDF-generatie"-bibliotheek).
 *
 * Layout volgt het door SMV aangeleverde factuursjabloon (factuursjabloon-
 * ronde, 2026-09-28): titelblok, factuurgegevens-tabel, Aan/Van, Specificatie-
 * tabel, totalen, betaalvoorwaarden. De architectuur zelf is ongewijzigd
 * gebleven — dit blijft uitsluitend bevroren gegevens tonen:
 * `factuur.klant_snapshot` en `factuur.regels` (nooit een live opzoeking in
 * klanten/offertes), en de bedrijfsgegevens uit `instellingen`
 * (factuur_instellingen, zie FactuurDetail.jsx) — nooit uit data/company.js,
 * dat blijft de publieke-website-bron (zie 0013_factuur_instellingen.sql).
 * Zo blijft een eenmaal verzonden factuur historisch correct, ook als de
 * offerte waar hij uit ontstond of de bedrijfsinstellingen later wijzigen.
 *
 * Het sjabloonbestand zelf bevat twee met geel/grijs gemarkeerde alinea's
 * ("BESLISPUNT RICHARD" en "Let op: Aanbetaling...") die inhoudelijk een
 * interne, nog onbesliste vraag aan de zaakvoerder zijn (over een
 * aanbetalingsregeling) — geen echte factuurtekst. Die zijn bewust NIET
 * overgenomen: dit zijn ontwerpnotities in het sjabloonbestand zelf, geen
 * klantgerichte informatie (zie ook het eindrapport van deze ronde).
 */
export function FactuurDocument({ factuur, instellingen, toonNotitie = true }) {
  const { klant, contactpersoon } = factuur.klant_snapshot ?? {}
  const regels = Array.isArray(factuur.regels) ? factuur.regels : []
  const betreft = afgeleidBetreft(regels)
  const btwPercentage = afgeleidBtwPercentage(regels)

  return (
    <article className="factuur-document bg-white text-[13.5px] leading-relaxed text-foreground print:text-[10.5pt]">
      {/* 1. Titelblok */}
      <header className="factuur-blok mb-6 flex items-start justify-between gap-6 break-inside-avoid">
        <img src="/logo-header.png" alt={instellingen.bedrijfsnaam} width="149" height="84" className="h-14 w-auto" />
        <h1 className="font-heading text-3xl font-medium" style={{ color: SMV_DONKERGROEN }}>
          Factuur
        </h1>
      </header>

      {/* 2. Factuurgegevens */}
      <table className="factuur-blok mb-7 w-full table-fixed border-collapse border border-border text-left break-inside-avoid">
        <thead>
          <tr style={{ backgroundColor: SMV_DONKERGROEN }} className="text-white">
            <th className="w-1/3 px-3 py-2 text-xs font-semibold tracking-wide uppercase">Gegeven</th>
            <th className="px-3 py-2 text-xs font-semibold tracking-wide uppercase">Waarde</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="px-3 py-1.5 font-medium text-primary" style={{ backgroundColor: SMV_LICHTGRIJS }}>
              Factuurnummer
            </td>
            <td className="px-3 py-1.5 text-primary">{factuur.factuurnummer}</td>
          </tr>
          <tr className="border-b border-border">
            <td className="px-3 py-1.5 font-medium text-primary" style={{ backgroundColor: SMV_LICHTGRIJS }}>
              Factuurdatum
            </td>
            <td className="px-3 py-1.5 text-primary">{formatDatumNl(factuur.factuurdatum)}</td>
          </tr>
          <tr className={betreft || factuur.offertes?.offerte_nummer ? 'border-b border-border' : undefined}>
            <td className="px-3 py-1.5 font-medium text-primary" style={{ backgroundColor: SMV_LICHTGRIJS }}>
              Vervaldatum
            </td>
            <td className="px-3 py-1.5 text-primary">{formatDatumNl(factuur.vervaldatum)}</td>
          </tr>
          {factuur.offertes?.offerte_nummer ? (
            <tr className={betreft ? 'border-b border-border' : undefined}>
              <td className="px-3 py-1.5 font-medium text-primary" style={{ backgroundColor: SMV_LICHTGRIJS }}>
                Referentie / offertenummer
              </td>
              <td className="px-3 py-1.5 text-primary">{factuur.offertes.offerte_nummer}</td>
            </tr>
          ) : null}
          {betreft ? (
            <tr>
              <td className="px-3 py-1.5 font-medium text-primary" style={{ backgroundColor: SMV_LICHTGRIJS }}>
                Betreft
              </td>
              <td className="px-3 py-1.5 text-primary">{betreft}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {/* 3. Aan / Van */}
      <div className="factuur-blok mb-7 grid gap-6 break-inside-avoid sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: SMV_DONKERGROEN }}>
            Aan
          </h2>
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
        <section>
          <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: SMV_DONKERGROEN }}>
            Van
          </h2>
          <p className="text-primary">
            {instellingen.bedrijfsnaam}
            {instellingen.adres ? (
              <>
                <br />
                {instellingen.adres}
              </>
            ) : null}
            {instellingen.postcode || instellingen.plaats ? (
              <>
                <br />
                {instellingen.postcode} {instellingen.plaats}
              </>
            ) : null}
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
            {instellingen.email ? (
              <>
                <br />
                {instellingen.email}
              </>
            ) : null}
            {instellingen.telefoon ? <> · {instellingen.telefoon}</> : null}
          </p>
        </section>
      </div>

      {/* 4. Specificatie */}
      <section className="factuur-blok mb-7">
        <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: SMV_DONKERGROEN }}>
          Specificatie
        </h2>
        <table className="w-full border-collapse border border-border text-left">
          <thead>
            <tr style={{ backgroundColor: SMV_DONKERGROEN }} className="text-white">
              <th className="px-3 py-2 text-xs font-semibold tracking-wide uppercase">Omschrijving</th>
              <th className="px-3 py-2 text-right text-xs font-semibold tracking-wide uppercase">Bedrag excl. btw</th>
            </tr>
          </thead>
          <tbody>
            {regels.map((regel, i) => {
              const eenheidLabel = regel.eenheid && regel.eenheid !== 'stuk' ? regel.eenheid : '×'
              return (
                <tr key={i} className="factuur-tabelrij break-inside-avoid border-b border-border/60">
                  <td className="px-3 py-2 align-top break-words text-primary">
                    {regel.omschrijving}
                    {regel.aantal !== 1 ? (
                      <span className="text-foreground-muted">
                        {' '}
                        ({regel.aantal} {eenheidLabel} {euro(regel.prijsExclBtw)})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right align-top text-primary">{euro(regel.regelbedragExclBtw)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {/* 5. Totalen */}
      <table className="factuur-blok mb-7 ml-auto w-full max-w-full border-collapse break-inside-avoid text-left sm:w-80">
        <tbody>
          <tr className="border-b border-border" style={{ backgroundColor: SMV_LICHTGRIJS }}>
            <td className="px-3 py-1.5 text-foreground-muted">Subtotaal excl. btw</td>
            <td className="px-3 py-1.5 text-right text-primary">{euro(factuur.subtotaal_excl_btw)}</td>
          </tr>
          <tr className="border-b border-border">
            <td className="px-3 py-1.5 text-foreground-muted">Btw{btwPercentage != null ? ` (${btwPercentage}%)` : ''}</td>
            <td className="px-3 py-1.5 text-right text-primary">{euro(factuur.btw_bedrag)}</td>
          </tr>
          <tr className="font-medium" style={{ backgroundColor: SMV_LICHTGRIJS }}>
            <td className="px-3 py-2 text-primary">Totaal incl. btw</td>
            <td className="px-3 py-2 text-right text-primary">{euro(factuur.totaal_incl_btw)}</td>
          </tr>
        </tbody>
      </table>

      {/*
        toonNotitie (Klantomgeving-uitbreiding, 2026-09-28): notitie is een
        vrij invoerveld voor de admin, bedoeld als interne kanttekening bij
        het opstellen — nooit automatisch aan de klant tonen, ook al zou
        getFactuur() de kolom zelf wel meegeven. Admin-alleen weergave,
        default true zodat de bestaande admin-weergave (FactuurDetail.jsx
        onder /admin/facturen/:id) ongewijzigd blijft.
      */}
      {toonNotitie && factuur.notitie ? (
        <section className="factuur-blok mb-7 break-inside-avoid">
          <p className="text-primary">
            <span className="font-medium">Notitie: </span>
            {factuur.notitie}
          </p>
        </section>
      ) : null}

      {/* 6. Betaalvoorwaarden */}
      <section className="factuur-blok break-inside-avoid">
        <h2 className="mb-2 text-xs font-semibold tracking-[0.1em] uppercase" style={{ color: SMV_DONKERGROEN }}>
          Betaalvoorwaarden
        </h2>
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
