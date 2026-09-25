import { COMPANY } from '../../data/company'
import { euro, formatDatumNl } from '../../lib/klantOmgeving/offerte'

/**
 * De offerte zelf — één renderbron voor zowel de schermpreview als de
 * print/PDF-uitvoer (zie OffertePreview.jsx: exact deze boom wordt getoond
 * én afgedrukt, alleen de CSS verschilt via `print:`-varianten en de
 * `@media print`-regels in index.css). Geen los "printversie"-component.
 *
 * Bewust alleen bevroren gegevens: `snapshot` voor klant/contactpersoon/
 * pand/pakketinhoud/voorwaardenversie, en de top-level kolommen
 * bedrag/meerwerk/subtotaal/btw/totaal — nooit een live opzoeking in
 * klanten/panden/packages.js. Zo blijft een eenmaal opgeslagen offerte
 * historisch correct, ook als die brondata later wijzigt (zie
 * OfferteEditor/bouwOfferteSnapshot voor waar de snapshot vandaan komt).
 *
 * Toont uitsluitend velden die een klant mag zien — geen id's, RLS-status,
 * MJOP-snapshots, adviespunten of overige interne metadata.
 */
export function OfferteDocument({ offerte }) {
  const { snapshot } = offerte
  const heeftMeerwerk = Array.isArray(offerte.meerwerk) && offerte.meerwerk.length > 0

  return (
    <article className="offerte-document bg-white text-[13.5px] leading-relaxed text-foreground print:text-[11.5pt]">
      {/* 1. Titelblok */}
      <header className="offerte-blok mb-8 flex items-start justify-between gap-6 border-b border-border pb-6 break-inside-avoid">
        <div>
          <img src="/logo-header.png" alt="SMV Advies" width="149" height="84" className="mb-4 h-14 w-auto" />
          <p className="text-foreground-muted">
            {COMPANY.address.street}
            <br />
            {COMPANY.address.postalCode} {COMPANY.address.city}
            <br />
            {COMPANY.phone} · {COMPANY.email}
            {COMPANY.kvk ? (
              <>
                <br />
                KvK {COMPANY.kvk}
              </>
            ) : null}
          </p>
        </div>
        <div className="text-right">
          <h1 className="font-heading text-2xl text-primary">Offerte</h1>
          <dl className="mt-2 flex flex-col gap-0.5 text-foreground-muted">
            <div>
              <dt className="inline">Offertenummer: </dt>
              <dd className="inline font-medium text-primary">{offerte.offerte_nummer}</dd>
            </div>
            <div>
              <dt className="inline">Offertedatum: </dt>
              <dd className="inline text-primary">{formatDatumNl(offerte.offerte_datum)}</dd>
            </div>
            <div>
              <dt className="inline">Geldig tot: </dt>
              <dd className="inline text-primary">{formatDatumNl(offerte.geldig_tot)}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* 2. Klant & pand */}
      <section className="offerte-blok mb-7 grid gap-6 break-inside-avoid sm:grid-cols-2">
        <div>
          <h2 className="mb-2 break-after-avoid text-xs font-semibold tracking-[0.1em] text-accent uppercase">Klant</h2>
          <p className="text-primary">
            {snapshot.klant.bedrijfsnaam || snapshot.klant.naam}
            {snapshot.klant.bedrijfsnaam && snapshot.klant.naam ? (
              <>
                <br />
                t.a.v. {snapshot.klant.naam}
              </>
            ) : null}
            {snapshot.contactpersoon ? (
              <>
                <br />
                {snapshot.contactpersoon.naam}
                {snapshot.contactpersoon.rol ? ` (${snapshot.contactpersoon.rol})` : ''}
              </>
            ) : null}
            <br />
            {snapshot.klant.email}
            {snapshot.klant.telefoon ? <> · {snapshot.klant.telefoon}</> : null}
          </p>
        </div>
        <div>
          <h2 className="mb-2 break-after-avoid text-xs font-semibold tracking-[0.1em] text-accent uppercase">Pand</h2>
          <p className="text-primary">
            {snapshot.pand.omschrijving}
            <br />
            {snapshot.pand.adres}
            <br />
            {snapshot.pand.postcode} {snapshot.pand.plaats}
            {snapshot.pand.gebruikstype ? (
              <>
                <br />
                {snapshot.pand.gebruikstype}
                {snapshot.pand.bouwjaar ? `, bouwjaar ${snapshot.pand.bouwjaar}` : ''}
                {snapshot.pand.vloeroppervlak ? `, ${snapshot.pand.vloeroppervlak} m²` : ''}
              </>
            ) : null}
          </p>
        </div>
      </section>

      {/* 3 + 4. Gekozen pakket + pakketomschrijving */}
      <section className="offerte-blok mb-7 break-inside-avoid">
        <h2 className="mb-2 break-after-avoid text-xs font-semibold tracking-[0.1em] text-accent uppercase">Gekozen pakket</h2>
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-heading text-lg text-primary">{snapshot.pakket.naam}</p>
          <p className="font-medium text-primary">{euro(offerte.bedrag)} excl. btw</p>
        </div>
        <p className="text-foreground-muted">{snapshot.pakket.subtitle}</p>
        {snapshot.pakket.omschrijving ? <p className="mt-2 text-primary">{snapshot.pakket.omschrijving}</p> : null}
        {Array.isArray(snapshot.pakket.features) && snapshot.pakket.features.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1 text-primary">
            {snapshot.pakket.features.map((feature, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">·</span>
                {feature}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* 5. Eventueel meerwerk */}
      {heeftMeerwerk ? (
        <section className="offerte-blok mb-7">
          <h2 className="mb-2 break-after-avoid text-xs font-semibold tracking-[0.1em] text-accent uppercase">Meerwerk</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-xs text-foreground-muted">
                <th className="py-1.5 font-medium">Omschrijving</th>
                <th className="py-1.5 text-right font-medium">Aantal</th>
                <th className="py-1.5 text-right font-medium">Prijs per stuk</th>
                <th className="py-1.5 text-right font-medium">Totaal</th>
              </tr>
            </thead>
            <tbody>
              {offerte.meerwerk.map((regel, i) => (
                <tr key={i} className="offerte-tabelrij break-inside-avoid border-b border-border/60">
                  <td className="py-1.5 text-primary">{regel.omschrijving}</td>
                  <td className="py-1.5 text-right text-primary">{regel.aantal}</td>
                  <td className="py-1.5 text-right text-primary">{euro(regel.eenheidsprijs)}</td>
                  <td className="py-1.5 text-right text-primary">{euro(regel.totaal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* 6. Totaaloverzicht */}
      <section className="offerte-blok mb-7 break-inside-avoid">
        <h2 className="mb-2 break-after-avoid text-xs font-semibold tracking-[0.1em] text-accent uppercase">Totaaloverzicht</h2>
        <dl className="flex flex-col gap-1 border-t border-border pt-3 sm:w-80 sm:ml-auto">
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Subtotaal</dt>
            <dd className="text-primary">{euro(offerte.subtotaal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-foreground-muted">Btw ({offerte.btw_percentage}%)</dt>
            <dd className="text-primary">{euro(offerte.btw_bedrag)}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-1 font-medium">
            <dt className="text-primary">Totaal incl. btw</dt>
            <dd className="text-primary">{euro(offerte.totaal)}</dd>
          </div>
        </dl>
        {offerte.opmerkingen ? (
          <p className="mt-4 text-primary">
            <span className="font-medium">Opmerkingen: </span>
            {offerte.opmerkingen}
          </p>
        ) : null}
      </section>

      {/* 7. Voorwaarden */}
      <section className="offerte-blok mb-7 break-inside-avoid">
        <h2 className="mb-2 break-after-avoid text-xs font-semibold tracking-[0.1em] text-accent uppercase">Voorwaarden</h2>
        <p className="text-foreground-muted">
          Op deze offerte zijn de Algemene Voorwaarden van SMV Advies van toepassing (versie {snapshot.voorwaarden.versie}), te
          raadplegen op www.smv-advies.nl/voorwaarden. Deze offerte is vrijblijvend en geldig tot de hierboven genoemde datum.
        </p>
        <p className="mt-2 text-foreground-muted">Opgesteld door {snapshot.opgesteld_door.naam}, SMV Advies.</p>
      </section>

      {/* 8. Akkoord */}
      <section className="offerte-blok break-inside-avoid">
        <h2 className="mb-3 text-xs font-semibold tracking-[0.1em] text-accent uppercase">Akkoord</h2>
        <p className="mb-6 text-primary">Voor akkoord met bovenstaande offerte:</p>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div>
              <p className="mb-6 text-foreground-muted">Naam</p>
              <div className="border-b border-foreground-muted/40" />
            </div>
            <div>
              <p className="mb-6 text-foreground-muted">Datum</p>
              <div className="border-b border-foreground-muted/40" />
            </div>
          </div>
          <div>
            <p className="mb-14 text-foreground-muted">Handtekening</p>
            <div className="border-b border-foreground-muted/40" />
          </div>
        </div>
      </section>
    </article>
  )
}
