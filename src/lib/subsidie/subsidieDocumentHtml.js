/**
 * Bouwt het subsidieblad als losstaand, zelfstandig HTML-document (geen
 * afhankelijkheid van de Tailwind-build van de app — dit bestand wordt
 * gedownload/opgeslagen en moet dus op zichzelf correct renderen, zie
 * opdracht §16/42).
 *
 * Architectuurkeuze (afwijking van de letterlijke ".docx"-suggestie in de
 * opdracht, bewust en uitlegbaar in het eindrapport): de drie bestaande
 * rapporttemplates (basis-quickscan/premium/gold.docx, zie
 * adviesrapportDocx.js) zijn door de klant aangeleverde, vooraf opgemaakte
 * Word-bestanden die deze module alleen invult — er bestaat geen
 * vergelijkbaar, al aangeleverd "subsidieblad"-sjabloon om op dezelfde
 * manier te vullen. Een nieuw .docx-document helemaal zelf opbouwen (ruwe
 * OOXML/zip) zou een nieuw documentframework zijn, wat opdracht §16/69
 * expliciet afraadt ("geen totaal nieuw documentframework bouwen").
 * Zelfstandige HTML is wél een bestaand, lichtgewicht patroon in dit
 * project (triggerDossierJsonDownload() in dossierExport.js: Blob +
 * synthetic <a download>, geen server) en ondersteunt native, klikbare
 * links (opdracht §18/20/62) zonder extra bibliotheek. De bestaande
 * documenten/storage-architectuur (api.js uploadDocument()) accepteert
 * elk bestandstype, dus de HTML-snapshot wordt via exact hetzelfde pad
 * opgeslagen als elk ander dossierdocument.
 *
 * Bewust GEEN admin-webshell-opmaak (Tailwind/AdminLayout) — dit is het
 * publiek/klantgerichte SMV-documentstijl (zelfde geest als
 * FactuurDocument.jsx/OfferteDocument.jsx), met de echte merkkleuren uit
 * src/index.css (#16293a primary, #9d7720 accent) inline gedefinieerd,
 * zodat het bestand ook correct toont wanneer het los van de app wordt
 * geopend.
 */
import { SUBSIDIE_STATUS_LABELS } from './subsidieEligibility.js'

const SMV_PRIMARY = '#16293a'
const SMV_ACCENT = '#9d7720'
const SMV_MUTED_BG = '#f4f1ea'

function escapeHtml(tekst) {
  return String(tekst ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function euro(bedrag) {
  if (bedrag == null) return null
  return '€ ' + Number(bedrag).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function linkHtml(url, label) {
  if (!url) return escapeHtml(label ?? '')
  return `<a href="${escapeHtml(url)}">${escapeHtml(label ?? url)}</a>`
}

const WEGWIJS_STAPPEN = [
  { titel: '1. Controleer uw gegevens', tekst: 'Controleer het adres, het uitvoeringsjaar, de maatregel, het toegepaste product en de oppervlakte/technische gegevens die in dit document staan.' },
  {
    titel: '2. Zorg dat u de juiste documenten heeft',
    tekst: 'Denk aan: offerte, factuur, betaalbewijs, productgegevens, meldcode, foto\'s en bewijs van uitvoering — welke exact nodig zijn, hangt af van de regeling.',
  },
  { titel: '3. Open de officiële aanvraagpagina', tekst: 'Gebruik uitsluitend de officiële link die hieronder bij de betreffende regeling staat.' },
  { titel: '4. Log in', tekst: 'Volg de inlogprocedure die de officiële pagina op dat moment aangeeft.' },
  { titel: '5. Vul de aanvraag in', tekst: 'Gebruik de gegevens uit het tweede deel van dit document (hieronder) als leidraad.' },
  {
    titel: '6. Controleer de aanvraag',
    tekst: 'Controleer in het bijzonder: adres, datum, maatregel, oppervlakte, product, meldcode, rekeninggegevens en bijlagen, vóórdat u indient.',
  },
  { titel: '7. Dien de aanvraag in', tekst: '' },
  {
    titel: '8. Bewaar de bevestiging',
    tekst: 'Bewaar de aanvraagbevestiging, het zaaknummer, correspondentie en de uiteindelijke beschikking bij dit dossier.',
  },
]

function wegwijsblad() {
  return `
    <section class="pagina">
      <p class="label">SMV Advies</p>
      <h1>Subsidieaanvraag — wegwijzer</h1>
      <p>Dit document helpt u stap voor stap bij het voorbereiden en indienen van een subsidieaanvraag. Het tweede deel van dit document (verder naar onder) bevat de specifieke gegevens voor dit dossier.</p>
      ${WEGWIJS_STAPPEN.map((s) => `<h3>${escapeHtml(s.titel)}</h3>${s.tekst ? `<p>${escapeHtml(s.tekst)}</p>` : ''}`).join('\n')}
      <p class="disclaimer">Dit document is een praktische voorbereiding op de subsidieaanvraag. De uiteindelijke beoordeling en subsidievaststelling wordt uitgevoerd door de betreffende subsidieverstrekker.</p>
    </section>`
}

function statusKlasse(status) {
  if (status === 'van_toepassing' || status === 'waarschijnlijk_van_toepassing') return 'status-positief'
  if (status === 'niet_van_toepassing') return 'status-negatief'
  return 'status-neutraal'
}

function technischeEisTekst(regel) {
  if (!regel) return '—'
  if (regel.technischeEisRichting === 'u_maximum') return `≤ ${regel.maximumU} (${regel.technischeEenheidLabel ?? 'U-waarde'})`
  return `≥ ${regel.minimumRd} (${regel.technischeEenheidLabel ?? 'Rd-waarde'})`
}

function maatregelTabel(m) {
  const rijen =
    m.soort === 'ventilatie'
      ? [
          ['Regeling', m.regel?.scheme ?? 'Nog niet vastgesteld'],
          ['Maatregel', m.label],
          ['Uitvoeringsjaar', m.specificatie?.uitvoeringsjaar ?? '—'],
          ['Voorwaarde', 'Alleen subsidiabel in combinatie met minimaal één andere subsidiabele isolatiemaatregel in dit dossier.'],
          ['Vast subsidiebedrag', m.regel?.bedragVast != null ? euro(m.regel.bedragVast) : 'Nog niet vastgesteld'],
          ['Indicatief/berekend bedrag', m.berekening?.berekenbaar ? euro(m.berekening.bedrag) : 'Nog niet berekenbaar'],
          ['Meldcode', m.specificatie?.meldcode || 'Ontbreekt — zoek de ventilatie-eenheid op in de RVO-meldcodelijst.'],
          ['Status', `<span class="${statusKlasse(m.status)}">${escapeHtml(SUBSIDIE_STATUS_LABELS[m.status] ?? m.status)}</span>`],
        ]
      : m.soort === 'apparaat'
        ? [
            ['Regeling', m.regel?.scheme ?? 'Nog niet vastgesteld'],
            ['Maatregel', m.label],
            ['Uitvoeringsjaar', m.specificatie?.uitvoeringsjaar ?? '—'],
            ['Meldcode', m.specificatie?.meldcode || 'Ontbreekt — zoek het apparaat op in de RVO-meldcodelijst.'],
            ['Subsidiebedrag', m.berekening?.berekenbaar ? euro(m.berekening.bedrag) : 'Nog niet berekenbaar — bedrag van de officiële meldcodepagina ontbreekt nog.'],
            ['Meldcodepagina van dit apparaat', m.specificatie?.bronUrl ? linkHtml(m.specificatie.bronUrl, 'Open meldcodepagina') : '—'],
            ['Status', `<span class="${statusKlasse(m.status)}">${escapeHtml(SUBSIDIE_STATUS_LABELS[m.status] ?? m.status)}</span>`],
          ]
        : [
            ['Regeling', m.regel?.scheme ?? 'Nog niet vastgesteld'],
            ['Maatregel', m.label],
            ['Uitvoeringsjaar', m.specificatie?.uitvoeringsjaar ?? '—'],
            ['Oppervlakte', m.specificatie?.oppervlakteM2 != null ? `${m.specificatie.oppervlakteM2} m²` : '—'],
            ['Technische eis', technischeEisTekst(m.regel)],
            ['Ingevoerde isolatiewaarde', m.specificatie?.technischeWaarde ?? '—'],
            ['Tarief', m.berekening?.tarief != null ? `${euro(m.berekening.tarief)}/m²` : 'Nog niet vastgesteld — officiële regeling controleren'],
            ['Berekening', m.berekening?.toelichtingRegels?.length ? m.berekening.toelichtingRegels.join(' ') : 'Nog niet berekenbaar.'],
            ['Indicatief bedrag', m.berekening?.berekenbaar ? euro(m.berekening.bedrag) : 'Nog niet berekenbaar'],
            ['Meldcode', m.specificatie?.meldcode || 'Ontbreekt — vraag de leverancier/installateur om de officiële meldcode.'],
            ['Status', `<span class="${statusKlasse(m.status)}">${escapeHtml(SUBSIDIE_STATUS_LABELS[m.status] ?? m.status)}</span>`],
          ]
  return `<table><tbody>${rijen.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${typeof v === 'string' && (v.startsWith('<span') || v.startsWith('<a')) ? v : escapeHtml(String(v))}</td></tr>`).join('')}</tbody></table>`
}

function maatregelSectie(m) {
  const bron = m.regel?.bron
  return `
    <h2>${escapeHtml(m.label)}</h2>
    ${maatregelTabel(m)}
    <p class="redenen">${m.redenen.map(escapeHtml).join(' ')}</p>
    ${m.ontbrekendeGegevens.length > 0 ? `<p class="ontbrekend"><strong>Ontbrekende gegevens:</strong> ${m.ontbrekendeGegevens.map(escapeHtml).join(', ')}.</p>` : ''}
    ${
      bron
        ? `<p class="bron"><strong>Officiële bron:</strong> ${linkHtml(bron.url, bron.label)}<br><strong>Aanvraagpagina:</strong> ${linkHtml(bron.url, 'Open officiële aanvraagpagina')}<br>Bron gecontroleerd op: ${escapeHtml(bron.gecontroleerdOp)}</p>`
        : '<p class="bron">Officiële bron nog niet vastgesteld — controleer de actuele regeling op rvo.nl voordat u de aanvraag indient.</p>'
    }`
}

function combinatieSectie(data) {
  const { combinatie, maatregelen } = data
  const relevanteMaatregelen = maatregelen.filter((m) => m.specificatie)
  if (relevanteMaatregelen.length < 2) {
    return `<h2>Combinatie van maatregelen</h2><p>Er is in dit dossier momenteel maar één maatregel met ingevoerde gegevens — een combinatie-effect is daarom niet van toepassing.</p>`
  }
  return `
    <h2>Combinatie van maatregelen</h2>
    <p>${combinatie.combinatieVanToepassing ? `Meerdere subsidiabele maatregelen (${combinatie.combinatieAantal}) zijn in dit dossier vastgesteld. Volgens de officiële regeling verdubbelt het isolatietarief per m² in dat geval (ook bij combinatie met een warmtepomp of zonneboiler).` : 'Er zijn nog niet genoeg maatregelen volledig subsidiabel vastgesteld om het combinatietarief toe te passen.'}</p>
    ${combinatie.totaalBerekenbaar ? `<p class="totaal"><strong>Totaal indicatief bedrag (alle maatregelen):</strong> ${euro(combinatie.totaalBedrag)}</p>` : '<p class="ontbrekend">Totaalbedrag nog niet berekenbaar — zie de ontbrekende gegevens per maatregel hierboven.</p>'}`
}

function specifiekeSubsidies(data) {
  return `
    <section class="pagina">
      <h1>Specifieke subsidies voor dit dossier</h1>
      <table class="dossiergegevens"><tbody>
        <tr><th>Klant</th><td>${escapeHtml(data.meta.klantnaam ?? '—')}</td></tr>
        <tr><th>Adres</th><td>${escapeHtml(data.meta.pandadres ?? '—')}</td></tr>
        <tr><th>Uitvoeringsjaar</th><td>${escapeHtml(data.meta.uitvoeringsjaar ?? '—')}</td></tr>
        <tr><th>Dossiernummer</th><td>${escapeHtml(data.meta.dossierId ?? '—')}</td></tr>
      </tbody></table>
      ${data.maatregelen.map(maatregelSectie).join('\n')}
      ${combinatieSectie(data)}
      <h2>Regionale/lokale subsidie</h2>
      <p class="${data.regionaal?.locatieBekend ? 'ontbrekend' : 'redenen'}">${escapeHtml(data.regionaal?.boodschap ?? '')}</p>
      <h2>Ontbrekende gegevens / aandachtspunten</h2>
      ${data.ontbrekendeVelden.length > 0 ? `<ul>${data.ontbrekendeVelden.map((v) => `<li>${escapeHtml(v)}</li>`).join('')}</ul>` : '<p>Geen ontbrekende gegevens bekend op het moment van genereren.</p>'}
      <h2>Wat moet u nu doen?</h2>
      ${
        data.actielijst?.length > 0
          ? `<ol>${data.actielijst.map((stap) => `<li>${escapeHtml(stap)}</li>`).join('')}</ol>`
          : '<p>Er zijn nog geen maatregelen voldoende vastgesteld om een concrete actielijst te tonen.</p>'
      }
      <h2>Overige categorieën (nog niet geautomatiseerd)</h2>
      <p>De volgende categorieën zijn onderzocht maar worden door dit systeem (nog) niet automatisch beoordeeld. Dit betekent niet dat er geen subsidie bestaat — controleer dit handmatig vóór u een aanvraag indient.</p>
      ${
        data.nietOndersteund?.length > 0
          ? `<table><tbody>${data.nietOndersteund
              .map((r) => {
                const label = r.status === 'niet_subsidiabel' ? 'Niet subsidiabel' : 'Controle vereist'
                const klasse = r.status === 'niet_subsidiabel' ? 'status-negatief' : 'status-neutraal'
                return `<tr><th>${escapeHtml(r.categorie)}</th><td><span class="${klasse}">${label}</span>${r.reden ? ` — ${escapeHtml(r.reden)}` : ''}</td></tr>`
              })
              .join('')}</tbody></table>`
          : ''
      }
      <h2>Bronnen</h2>
      ${
        data.bronnen.length > 0
          ? `<ul>${data.bronnen
              .map(
                (b) =>
                  `<li>${linkHtml(b.url, b.label)} — gecontroleerd op ${escapeHtml(b.gecontroleerdOp)}${b.controle && !b.controle.geldig ? ` <strong>(${escapeHtml(b.controle.reden)})</strong>` : ''}</li>`,
              )
              .join('')}</ul>`
          : '<p>Nog geen officiële bron vastgesteld.</p>'
      }
      <p class="disclaimer">Dit document is een praktische voorbereiding op de subsidieaanvraag. De uiteindelijke beoordeling en subsidievaststelling wordt uitgevoerd door de betreffende subsidieverstrekker. Is een regeling mogelijk gewijzigd sinds de hierboven genoemde controledatum? Controleer dan eerst de actuele officiële regeling voordat u de aanvraag indient.</p>
    </section>`
}

const STYLE = `
  body { font-family: Georgia, 'Times New Roman', serif; color: #1f2a33; background: #ffffff; margin: 0; padding: 0; line-height: 1.55; }
  .pagina { max-width: 760px; margin: 0 auto; padding: 48px 32px; }
  .label { text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px; color: ${SMV_ACCENT}; font-weight: 600; margin: 0 0 4px; }
  h1 { color: ${SMV_PRIMARY}; font-size: 28px; margin: 0 0 20px; }
  h2 { color: ${SMV_PRIMARY}; font-size: 20px; margin: 36px 0 12px; border-top: 1px solid #d8d2c4; padding-top: 24px; }
  h3 { color: ${SMV_PRIMARY}; font-size: 15px; margin: 20px 0 4px; }
  p { margin: 6px 0 12px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 13.5px; }
  table.dossiergegevens th { width: 160px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #e4e0d4; vertical-align: top; }
  th { background: ${SMV_MUTED_BG}; font-weight: 600; width: 220px; color: ${SMV_PRIMARY}; }
  a { color: ${SMV_ACCENT}; text-decoration: underline; }
  .redenen { font-style: italic; color: #4a5560; }
  .ontbrekend { background: #fbf3e4; border-radius: 6px; padding: 10px 14px; font-size: 13.5px; }
  .bron { font-size: 12.5px; color: #4a5560; }
  .disclaimer { font-size: 12px; color: #6b7480; margin-top: 28px; border-top: 1px solid #e4e0d4; padding-top: 14px; }
  .status-positief { color: #2f6b3f; font-weight: 600; }
  .status-negatief { color: #a33c3c; font-weight: 600; }
  .status-neutraal { color: ${SMV_ACCENT}; font-weight: 600; }
  .totaal { font-size: 16px; font-weight: 600; color: ${SMV_PRIMARY}; }
`

/**
 * Bouwt het complete, losstaande HTML-document uit de door
 * bouwSubsidieDocumentData() geleverde data. Pure functie — geen DOM,
 * geen Blob, geen fetch (die horen bij de aanroeper, zie
 * SubsidieBegeleiding.jsx), dus volledig testbaar zonder browser.
 */
export function bouwSubsidieDocumentHtml(data) {
  const titel = `Subsidieaanvraag — ${data.meta.klantnaam ?? 'dossier'}`
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<title>${escapeHtml(titel)}</title>
<style>${STYLE}</style>
</head>
<body>
${wegwijsblad()}
${specifiekeSubsidies(data)}
<p class="pagina disclaimer" style="padding-top:0;border-top:none;">Gegenereerd op ${escapeHtml(data.meta.datumGegenereerd ?? '')} door SMV Advies${data.meta.adviseur ? ` (${escapeHtml(data.meta.adviseur)})` : ''}. Dit is een momentopname op basis van de op dat moment bekende gegevens en regelingen.</p>
</body>
</html>`
}
