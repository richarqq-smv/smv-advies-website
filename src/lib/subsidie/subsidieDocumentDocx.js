/**
 * Bouwt het subsidieblad als downloadbaar .docx-bestand (vervangt de
 * eerdere HTML-variant, zie git-geschiedenis van subsidieDocumentHtml.js
 * — die module bestond nog niet lang genoeg om breed in gebruik te zijn
 * en is op uitdrukkelijk verzoek vervangen).
 *
 * In tegenstelling tot adviesrapportDocx.js (dat een door de klant
 * aangeleverd .docx-sjabloon vult) bestaat er voor het subsidieblad geen
 * vooraf aangeleverd sjabloon — dit document wordt volledig gegenereerd
 * met de `docx`-bibliotheek (Document/Paragraph/Table), met de SMV-
 * merkkleuren (#16293a primair, #9d7720 accent) als opmaak. Dezelfde data
 * (`bouwSubsidieDocumentData()`) als voorheen blijft de enige bron — deze
 * module voegt uitsluitend een andere weergave toe, geen nieuwe logica.
 *
 * Zelfde download-/opslagpatroon als adviesrapportDocx.js: Packer.toBlob()
 * levert een Blob die via de bestaande uploadDocument()/synthetic-<a>-
 * download wordt opgeslagen — geen server, geen externe service, zelfde
 * snapshotprincipe (eenmaal gegenereerd, nooit stil herberekend).
 */
import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, Packer, ExternalHyperlink, ShadingType, BorderStyle } from 'docx'
import { SUBSIDIE_STATUS_LABELS } from './subsidieEligibility.js'
import { FISCAAL_RELEVANTIE_STATUS_LABELS } from './fiscaleKoppeling.js'
import { FISCALE_REGELING_PARAMETERS, FISCALE_REGELING_SOORT_LABELS } from './fiscaleRegelingParameters.js'

const SMV_PRIMARY = '16293A'
const SMV_ACCENT = '9D7720'
const SMV_MUTED_BG = 'F4F1EA'
const KLEUR_POSITIEF = '2F6B3F'
const KLEUR_NEGATIEF = 'A33C3C'
const KLEUR_NEUTRAAL = SMV_ACCENT

const BREEDTE_LABEL = 2600
const BREEDTE_WAARDE = 6800

function euro(bedrag) {
  if (bedrag == null) return null
  return '€ ' + Number(bedrag).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusKleur(status) {
  if (status === 'van_toepassing' || status === 'waarschijnlijk_van_toepassing' || status === 'mogelijk_relevant') return KLEUR_POSITIEF
  if (status === 'niet_van_toepassing') return KLEUR_NEGATIEF
  return KLEUR_NEUTRAAL
}

function kop(tekst, niveau = HeadingLevel.HEADING_2) {
  return new Paragraph({ text: tekst, heading: niveau, spacing: { before: 280, after: 120 } })
}

function tekst(inhoud, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text: inhoud ?? '', ...opts })], spacing: { after: 100 } })
}

function statusTekst(label, status) {
  return new Paragraph({ children: [new TextRun({ text: label, bold: true, color: statusKleur(status) })], spacing: { after: 100 } })
}

function link(url, label) {
  if (!url) return tekst(label ?? '')
  return new Paragraph({
    children: [new ExternalHyperlink({ link: url, children: [new TextRun({ text: label ?? url, style: 'Hyperlink', color: SMV_ACCENT, underline: {} })] })],
    spacing: { after: 100 },
  })
}

function cel(inhoud, { label = false, breedte = BREEDTE_WAARDE } = {}) {
  return new TableCell({
    width: { size: breedte, type: WidthType.DXA },
    shading: label ? { fill: SMV_MUTED_BG, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: String(inhoud ?? '—'), bold: label, color: SMV_PRIMARY })] })],
  })
}

/** Simpele label/waarde-tabel (2 kolommen) — zelfde rol als de <table><tbody><tr><th>/<td> in de HTML-variant. */
function labelWaardeTabel(rijen) {
  return new Table({
    width: { size: BREEDTE_LABEL + BREEDTE_WAARDE, type: WidthType.DXA },
    rows: rijen.map(([label, waarde]) => new TableRow({ children: [cel(label, { label: true, breedte: BREEDTE_LABEL }), cel(waarde, { breedte: BREEDTE_WAARDE })] })),
  })
}

function technischeEisTekst(regel) {
  if (!regel) return '—'
  if (regel.technischeEisRichting === 'u_maximum') return `≤ ${regel.maximumU} (${regel.technischeEenheidLabel ?? 'U-waarde'})`
  return `≥ ${regel.minimumRd} (${regel.technischeEenheidLabel ?? 'Rd-waarde'})`
}

function maatregelRijen(m) {
  if (m.soort === 'ventilatie') {
    return [
      ['Regeling', m.regel?.scheme ?? 'Nog niet vastgesteld'],
      ['Maatregel', m.label],
      ['Uitvoeringsjaar', m.specificatie?.uitvoeringsjaar ?? '—'],
      ['Voorwaarde', 'Alleen subsidiabel in combinatie met minimaal één andere subsidiabele isolatiemaatregel in dit dossier.'],
      ['Vast subsidiebedrag', m.regel?.bedragVast != null ? euro(m.regel.bedragVast) : 'Nog niet vastgesteld'],
      ['Indicatief/berekend bedrag', m.berekening?.berekenbaar ? euro(m.berekening.bedrag) : 'Nog niet berekenbaar'],
      ['Meldcode', m.specificatie?.meldcode || 'Ontbreekt — zoek de ventilatie-eenheid op in de RVO-meldcodelijst.'],
    ]
  }
  if (m.soort === 'apparaat') {
    return [
      ['Regeling', m.regel?.scheme ?? 'Nog niet vastgesteld'],
      ['Maatregel', m.label],
      ['Uitvoeringsjaar', m.specificatie?.uitvoeringsjaar ?? '—'],
      ['Meldcode', m.specificatie?.meldcode || 'Ontbreekt — zoek het apparaat op in de RVO-meldcodelijst.'],
      ['Subsidiebedrag', m.berekening?.berekenbaar ? euro(m.berekening.bedrag) : 'Nog niet berekenbaar — bedrag van de officiële meldcodepagina ontbreekt nog.'],
    ]
  }
  return [
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
  ]
}

function maatregelSectie(m) {
  const blokken = [kop(m.label, HeadingLevel.HEADING_3), labelWaardeTabel(maatregelRijen(m)), statusTekst(SUBSIDIE_STATUS_LABELS[m.status] ?? m.status, m.status), tekst(m.redenen.join(' '), { italics: true })]
  if (m.ontbrekendeGegevens.length > 0) {
    blokken.push(tekst(`Ontbrekende gegevens: ${m.ontbrekendeGegevens.join(', ')}.`, { color: KLEUR_NEUTRAAL }))
  }
  if (m.regel?.bron) {
    blokken.push(tekst(`Officiële bron: ${m.regel.bron.label} — gecontroleerd op ${m.regel.bron.gecontroleerdOp}`, { size: 18, color: '4A5560' }))
    blokken.push(link(m.regel.bron.url, 'Open officiële aanvraagpagina'))
  } else {
    blokken.push(tekst('Officiële bron nog niet vastgesteld — controleer de actuele regeling op rvo.nl voordat u de aanvraag indient.', { size: 18, color: '4A5560' }))
  }
  return blokken
}

function combinatieSectie(data) {
  const { combinatie, maatregelen } = data
  const relevanteMaatregelen = maatregelen.filter((m) => m.specificatie)
  const blokken = [kop('Combinatie van maatregelen')]
  if (relevanteMaatregelen.length < 2) {
    blokken.push(tekst('Er is in dit dossier momenteel maar één maatregel met ingevoerde gegevens — een combinatie-effect is daarom niet van toepassing.'))
    return blokken
  }
  blokken.push(
    tekst(
      combinatie.combinatieVanToepassing
        ? `Meerdere subsidiabele maatregelen (${combinatie.combinatieAantal}) zijn in dit dossier vastgesteld. Volgens de officiële regeling verdubbelt het isolatietarief per m² in dat geval (ook bij combinatie met een warmtepomp of zonneboiler).`
        : 'Er zijn nog niet genoeg maatregelen volledig subsidiabel vastgesteld om het combinatietarief toe te passen.',
    ),
  )
  blokken.push(
    combinatie.totaalBerekenbaar
      ? new Paragraph({ children: [new TextRun({ text: `Totaal indicatief bedrag (alle maatregelen): ${euro(combinatie.totaalBedrag)}`, bold: true, color: SMV_PRIMARY })] })
      : tekst('Totaalbedrag nog niet berekenbaar — zie de ontbrekende gegevens per maatregel hierboven.', { color: KLEUR_NEUTRAAL }),
  )
  return blokken
}

/**
 * EIA/MIA/Vamil-sectie — volledig gescheiden van de ISDE-maatregelen
 * hierboven (andere soort regeling, nooit in hetzelfde totaalbedrag
 * gemengd, zie fiscaleRegelingParameters.js/fiscaleKoppeling.js).
 */
function fiscaleRegelingenSectie(fiscaleRegelingen = []) {
  const blokken = [
    kop('EIA / MIA / Vamil — fiscale regelingen'),
    tekst(
      'EIA, MIA en Vamil zijn GEEN directe subsidie — het zijn fiscale regelingen (investeringsaftrek resp. willekeurige afschrijving) die de fiscale winst beïnvloeden. Het daadwerkelijke belastingvoordeel hangt af van het toepasselijke belastingtarief en de fiscale positie van de onderneming; dat wordt hier niet berekend. De onderstaande mogelijkheden zijn zoekaanleidingen op basis van dit dossier, geen automatische toekenning.',
      { italics: true, size: 18 },
    ),
  ]
  if (fiscaleRegelingen.length === 0) {
    blokken.push(
      tekst(
        'Op basis van de huidige dossiergegevens (MJOP/Energie-indicatie/opname) is nog geen concrete aanleiding gevonden voor een EIA-, MIA- of Vamil-bedrijfsmiddel.',
      ),
    )
    return blokken
  }
  fiscaleRegelingen.forEach(({ bedrijfsmiddel: b, status, redenen, ontbrekendeGegevens, gekoppeldeGegevens = [] }) => {
    const regelingLabels = b.regelingen.map((r) => `${FISCALE_REGELING_PARAMETERS[r]?.naam ?? r.toUpperCase()} (${FISCALE_REGELING_SOORT_LABELS[FISCALE_REGELING_PARAMETERS[r]?.soort] ?? '—'})`).join(' + ')
    const percentageTekst = [
      b.fiscaalParameter?.percentage != null ? `${b.regelingen.includes('eia') ? 'EIA' : 'MIA'}: ${b.fiscaalParameter.percentage}% aftrek` : null,
      b.fiscaalParameterVamil?.percentage != null ? `Vamil: tot ${b.fiscaalParameterVamil.percentage}% willekeurig afschrijven` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    blokken.push(kop(`${b.titel}${b.bedrijfsmiddelcode ? ` (code ${b.bedrijfsmiddelcode})` : ''}`, HeadingLevel.HEADING_3))
    blokken.push(
      labelWaardeTabel(
        [
          ['Regeling(en)', regelingLabels],
          ['Fiscale parameter(s)', percentageTekst || 'Niet bedrijfsmiddel-specifiek bevestigd — controle vereist op de officiële pagina.'],
          ['Investeringsgrenzen', `Minimaal ${euro(b.investeringsgrenzen.minimum)}${b.investeringsgrenzen.maximum != null ? `, maximaal ${euro(b.investeringsgrenzen.maximum)}` : ''}`],
          ...(gekoppeldeGegevens.length > 0 ? [['Al bekend uit dossier', gekoppeldeGegevens.map((g) => `${g.label}: ${g.waarde}`).join('; ')]] : []),
          ...(ontbrekendeGegevens.length > 0 ? [['Ontbrekende gegevens', ontbrekendeGegevens.join(', ')]] : []),
          ['Vereiste bewijsstukken', b.vereisteBewijsstukken.join(', ')],
          ['Procedure', b.procedure.omschrijving],
        ],
      ),
    )
    blokken.push(statusTekst(FISCAAL_RELEVANTIE_STATUS_LABELS[status] ?? status, status))
    blokken.push(tekst(redenen.join(' '), { italics: true, size: 18 }))
    blokken.push(link(b.bron.url, `${b.bron.label} — gecontroleerd op ${b.bron.gecontroleerdOp}`))
  })
  return blokken
}

const WEGWIJS_STAPPEN = [
  { titel: '1. Controleer uw gegevens', tekst: 'Controleer het adres, het uitvoeringsjaar, de maatregel, het toegepaste product en de oppervlakte/technische gegevens die in dit document staan.' },
  { titel: '2. Zorg dat u de juiste documenten heeft', tekst: "Denk aan: offerte, factuur, betaalbewijs, productgegevens, meldcode, foto's en bewijs van uitvoering — welke exact nodig zijn, hangt af van de regeling." },
  { titel: '3. Open de officiële aanvraagpagina', tekst: 'Gebruik uitsluitend de officiële link die hieronder bij de betreffende regeling staat.' },
  { titel: '4. Log in', tekst: 'Volg de inlogprocedure die de officiële pagina op dat moment aangeeft.' },
  { titel: '5. Vul de aanvraag in', tekst: 'Gebruik de gegevens uit het tweede deel van dit document (hieronder) als leidraad.' },
  { titel: '6. Controleer de aanvraag', tekst: 'Controleer in het bijzonder: adres, datum, maatregel, oppervlakte, product, meldcode, rekeninggegevens en bijlagen, vóórdat u indient.' },
  { titel: '7. Dien de aanvraag in', tekst: '' },
  { titel: '8. Bewaar de bevestiging', tekst: 'Bewaar de aanvraagbevestiging, het zaaknummer, correspondentie en de uiteindelijke beschikking bij dit dossier.' },
]

function wegwijsblad() {
  const blokken = [
    new Paragraph({ children: [new TextRun({ text: 'SMV Advies', color: SMV_ACCENT, bold: true, size: 20 })], spacing: { after: 60 } }),
    new Paragraph({ text: 'Subsidieaanvraag — wegwijzer', heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }),
    tekst('Dit document helpt u stap voor stap bij het voorbereiden en indienen van een subsidieaanvraag. Het tweede deel van dit document (verderop) bevat de specifieke gegevens voor dit dossier.'),
  ]
  WEGWIJS_STAPPEN.forEach((s) => {
    blokken.push(kop(s.titel, HeadingLevel.HEADING_3))
    if (s.tekst) blokken.push(tekst(s.tekst))
  })
  blokken.push(tekst('Dit document is een praktische voorbereiding op de subsidieaanvraag. De uiteindelijke beoordeling en subsidievaststelling wordt uitgevoerd door de betreffende subsidieverstrekker.', { italics: true, size: 18, color: '6B7480' }))
  return blokken
}

function specifiekeSubsidies(data) {
  const blokken = [
    new Paragraph({ text: 'Specifieke subsidies voor dit dossier', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, pageBreakBefore: true }),
    labelWaardeTabel([
      ['Klant', data.meta.klantnaam ?? '—'],
      ['Adres', data.meta.pandadres ?? '—'],
      ['Uitvoeringsjaar', data.meta.uitvoeringsjaar ?? '—'],
      ['Dossiernummer', data.meta.dossierId ?? '—'],
    ]),
  ]
  data.maatregelen.forEach((m) => blokken.push(...maatregelSectie(m)))
  blokken.push(...combinatieSectie(data))
  blokken.push(kop('Regionale/lokale subsidie'))
  blokken.push(tekst(data.regionaal?.boodschap ?? '', data.regionaal?.locatieBekend ? { color: KLEUR_NEUTRAAL } : {}))

  blokken.push(kop('Ontbrekende gegevens / aandachtspunten'))
  if (data.ontbrekendeVelden.length > 0) {
    data.ontbrekendeVelden.forEach((v) => blokken.push(new Paragraph({ text: v, bullet: { level: 0 } })))
  } else {
    blokken.push(tekst('Geen ontbrekende gegevens bekend op het moment van genereren.'))
  }

  blokken.push(kop('Wat moet u nu doen?'))
  if (data.actielijst?.length > 0) {
    data.actielijst.forEach((stap, i) => blokken.push(tekst(`${i + 1}. ${stap}`)))
  } else {
    blokken.push(tekst('Er zijn nog geen maatregelen voldoende vastgesteld om een concrete actielijst te tonen.'))
  }

  blokken.push(...fiscaleRegelingenSectie(data.fiscaleRegelingen))

  blokken.push(kop('Overige categorieën (nog niet geautomatiseerd)'))
  blokken.push(tekst('De volgende categorieën zijn onderzocht maar worden door dit systeem (nog) niet automatisch beoordeeld. Dit betekent niet dat er geen subsidie bestaat — controleer dit handmatig vóór u een aanvraag indient.'))
  if (data.nietOndersteund?.length > 0) {
    blokken.push(
      labelWaardeTabel(
        data.nietOndersteund.map((r) => [r.categorie, `${r.status === 'niet_subsidiabel' ? 'Niet subsidiabel' : 'Controle vereist'}${r.reden ? ` — ${r.reden}` : ''}`]),
      ),
    )
  }

  blokken.push(kop('Bronnen'))
  if (data.bronnen.length > 0) {
    data.bronnen.forEach((b) => {
      blokken.push(link(b.url, `${b.label} — gecontroleerd op ${b.gecontroleerdOp}${b.controle && !b.controle.geldig ? ` (${b.controle.reden})` : ''}`))
    })
  } else {
    blokken.push(tekst('Nog geen officiële bron vastgesteld.'))
  }

  blokken.push(
    tekst(
      'Dit document is een praktische voorbereiding op de subsidieaanvraag. De uiteindelijke beoordeling en subsidievaststelling wordt uitgevoerd door de betreffende subsidieverstrekker. Is een regeling mogelijk gewijzigd sinds de hierboven genoemde controledatum? Controleer dan eerst de actuele officiële regeling voordat u de aanvraag indient.',
      { italics: true, size: 18, color: '6B7480' },
    ),
  )
  return blokken
}

/** Bouwt het .docx-document (docx.Document) uit dezelfde data als bouwSubsidieDocumentHtml() voorheen deed — zelfde brondata, andere weergave. */
export function bouwSubsidieDocumentDocx(data) {
  return new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: '1F2A33' } },
        heading1: { run: { color: SMV_PRIMARY, size: 32, bold: true }, paragraph: { spacing: { before: 200, after: 160 } } },
        heading2: { run: { color: SMV_PRIMARY, size: 26, bold: true }, paragraph: { spacing: { before: 260, after: 120 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D8D2C4' } } } },
        heading3: { run: { color: SMV_PRIMARY, size: 23, bold: true }, paragraph: { spacing: { before: 180, after: 80 } } },
      },
    },
    sections: [
      {
        properties: {},
        children: [...wegwijsblad(), ...specifiekeSubsidies(data), tekst(`Gegenereerd op ${data.meta.datumGegenereerd ?? ''} door SMV Advies${data.meta.adviseur ? ` (${data.meta.adviseur})` : ''}. Dit is een momentopname op basis van de op dat moment bekende gegevens en regelingen.`, { size: 16, color: '6B7480' })],
      },
    ],
  })
}

/** Genereert de .docx als Blob — pure async wrapper rond Packer.toBlob(), geen DOM/fetch (die horen bij de aanroeper). */
export async function genereerSubsidieDocumentDocxBlob(data) {
  return Packer.toBlob(bouwSubsidieDocumentDocx(data))
}

function veiligeBestandsnaam(tekst) {
  return (
    String(tekst ?? '')
      .trim()
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'dossier'
  )
}

/** Bestandsnaam voor de download/upload — zelfde conventie als bouwAdviesrapportBestandsnaam() in adviesrapportDocx.js. */
export function bouwSubsidieDocumentBestandsnaam(data) {
  const naam = veiligeBestandsnaam(data?.meta?.klantnaam || data?.meta?.dossierId)
  const datumSlug = new Date().toISOString().slice(0, 10)
  return `SMV-Subsidieadvies-${naam}-${datumSlug}.docx`
}
