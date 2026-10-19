/**
 * Vult één van de drie bestaande, klant-aangeleverde Word-sjablonen
 * (src/assets/rapportTemplates/) met dossierdata en levert een .docx op.
 * Zelfde download-patroon als triggerDossierJsonDownload() in
 * dossierExport.js: Blob + synthetic <a download>, geen server, geen
 * externe service.
 *
 * Bewust GEEN documentgenerator-bibliotheek die het document opnieuw
 * opbouwt: dat zou de echte branding/opmaak van de aangeleverde
 * templates verliezen (randvoorwaarde 1 — "gebruik mijn bestaande
 * rapporttemplates als uitgangspunt"). In plaats daarvan: het .docx-
 * bestand is een zip met XML erin (OOXML); dit bestand vervangt
 * gericht tekst in word/document.xml (via JSZip + de in de browser
 * ingebouwde DOMParser/XMLSerializer, geen extra XML-bibliotheek nodig)
 * en laat al het overige (opmaak, logo, lettertypen, en de pakket-
 * specifieke geavanceerde secties die nog geen databron hebben, zoals
 * Gold's offertevergelijking) volledig ongemoeid.
 *
 * Beperkt tot het universeel automatiseerbare deel van alle drie
 * templates: de metatabel (klantnaam/pandadres/datum/adviseur, en sinds
 * de bedrijfsgegevens-bronronde ook Adviesbureau/Adres/Telefoon/E-mail
 * uit factuur_instellingen — zie adviesrapport.js), de samenvatting, en
 * de maatregelentabel. Rapportnummer en "Pakket" (dat al per
 * sjabloon-bestand vaststaat) worden bewust niet aangepast.
 */
import JSZip from 'jszip'
import { bouwAdviesrapportData } from './adviesrapport.js'
import basisTemplateUrl from '../../assets/rapportTemplates/basis-quickscan.docx?url'
import premiumTemplateUrl from '../../assets/rapportTemplates/premium.docx?url'
import goldTemplateUrl from '../../assets/rapportTemplates/gold.docx?url'

const TEMPLATE_URLS = {
  basis: basisTemplateUrl,
  premium: premiumTemplateUrl,
  gold: goldTemplateUrl,
}

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const DOCUMENT_XML_PATH = 'word/document.xml'

const METATABEL_LABELS = {
  Klantnaam: 'klantnaam',
  Pandadres: 'pandadres',
  'Datum rapport': 'datumRapport',
  Adviseur: 'adviseur',
  // Bedrijfsgegevens-bronronde: uit de Administratie Instellingen (via de
  // `instellingen`-parameter hieronder), zelfde patroon als Offerte/Factuur
  // — zie adviesrapport.js. Deze module haalt die gegevens zelf niet op.
  Adviesbureau: 'bedrijfsnaam',
  'Adres adviesbureau': 'bedrijfsadres',
  'Telefoon adviesbureau': 'bedrijfsTelefoon',
  'E-mail adviesbureau': 'bedrijfsEmail',
}

function elementTekst(el) {
  return Array.from(el.getElementsByTagNameNS(W_NS, 't'))
    .map((t) => t.textContent)
    .join('')
}

/** Zet de tekst van de eerste <w:t> in dit element, leegt eventuele overige runs. Geeft false als er geen run is (nooit een crash op een onverwachte sjabloonstructuur). */
function zetEersteRunTekst(container, tekst) {
  const runs = container.getElementsByTagNameNS(W_NS, 't')
  if (runs.length === 0) return false
  runs[0].textContent = tekst ?? ''
  runs[0].setAttribute('xml:space', 'preserve')
  for (let i = 1; i < runs.length; i++) runs[i].textContent = ''
  return true
}

function vulMetatabel(doc, meta) {
  const cellen = Array.from(doc.getElementsByTagNameNS(W_NS, 'tc'))
  cellen.forEach((cel, index) => {
    const label = elementTekst(cel).trim()
    const veld = METATABEL_LABELS[label]
    if (!veld) return
    const waarde = meta[veld]
    if (!waarde) return
    const waardeCel = cellen[index + 1]
    if (waardeCel) zetEersteRunTekst(waardeCel, waarde)
  })
}

function vulSamenvatting(doc, paragrafen) {
  const alineas = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'))
  const headingIndex = alineas.findIndex((p) => elementTekst(p).trim() === '1. Samenvatting')
  if (headingIndex === -1) return false
  const placeholder = alineas[headingIndex + 1]
  if (!placeholder) return false

  const pPrTemplate = placeholder.getElementsByTagNameNS(W_NS, 'pPr')[0] ?? null
  const rPrTemplate = placeholder.getElementsByTagNameNS(W_NS, 'rPr')[0] ?? null
  const parent = placeholder.parentNode

  paragrafen.forEach((tekst) => {
    const p = doc.createElementNS(W_NS, 'w:p')
    if (pPrTemplate) p.appendChild(pPrTemplate.cloneNode(true))
    const r = doc.createElementNS(W_NS, 'w:r')
    if (rPrTemplate) r.appendChild(rPrTemplate.cloneNode(true))
    const t = doc.createElementNS(W_NS, 'w:t')
    t.setAttribute('xml:space', 'preserve')
    t.textContent = tekst
    r.appendChild(t)
    p.appendChild(r)
    parent.insertBefore(p, placeholder)
  })
  parent.removeChild(placeholder)
  return true
}

/** De maatregelentabel is herkenbaar aan de vaste headerrij "#"/"Maatregel" — identiek in alle drie sjablonen, ongeacht hoeveel rijen erna volgen. */
function vindMaatregelenTabel(doc) {
  const tabellen = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'))
  return (
    tabellen.find((tabel) => {
      const eersteRij = tabel.getElementsByTagNameNS(W_NS, 'tr')[0]
      if (!eersteRij) return false
      const headerCellen = Array.from(eersteRij.getElementsByTagNameNS(W_NS, 'tc')).map((tc) => elementTekst(tc).trim())
      return headerCellen[0] === '#' && headerCellen[1] === 'Maatregel'
    }) ?? null
  )
}

function vulMaatregelenTabel(doc, maatregelen) {
  const tabel = vindMaatregelenTabel(doc)
  if (!tabel) return { gevuld: 0, waarschuwingen: ['Maatregelentabel niet gevonden in dit sjabloon — niets automatisch ingevuld.'] }

  const rijen = Array.from(tabel.getElementsByTagNameNS(W_NS, 'tr'))
  const dataRijen = rijen.slice(1)
  const waarschuwingen = []

  dataRijen.forEach((rij, i) => {
    const cellen = Array.from(rij.getElementsByTagNameNS(W_NS, 'tc'))
    if (i < maatregelen.length) {
      const m = maatregelen[i]
      zetEersteRunTekst(cellen[1], m.onderwerp)
      zetEersteRunTekst(cellen[2], m.investering ?? '')
      zetEersteRunTekst(cellen[3], m.besparing ?? '')
      zetEersteRunTekst(cellen[4], m.terugverdientijd ?? '')
      if (m.prioriteit != null) zetEersteRunTekst(cellen[5], String(m.prioriteit))
    } else {
      rij.parentNode.removeChild(rij)
    }
  })

  if (maatregelen.length > dataRijen.length) {
    const overschot = maatregelen.length - dataRijen.length
    waarschuwingen.push(
      `Dit sjabloon heeft ruimte voor ${dataRijen.length} maatregelen; er zijn ${maatregelen.length} adviespunten met een financiële indicatie. De laatste ${overschot} ${overschot === 1 ? 'is' : 'zijn'} niet in de tabel opgenomen — vul dit zo nodig handmatig aan in het gedownloade document.`,
    )
  }

  return { gevuld: Math.min(maatregelen.length, dataRijen.length), waarschuwingen }
}

/**
 * Ronde 2026-10-19 (projectplan "Klantwaarde-uitbreidingen", Fase 1 — #2/3):
 * kort, cursief zinnetje direct boven de maatregelentabel met de eerste
 * maatregelen op terugverdientijd — puur weergave van wat
 * bouwPrioriteitenSamenvatting() (adviesrapport.js) al heeft bepaald, geen
 * eigen logica hier. Geen sjabloon-placeholder om te hergebruiken (dit is
 * nieuwe inhoud), dus de paragraaf wordt hier vers opgebouwd — zelfde
 * w:pPr/w:r-opbouw als vulSamenvatting() hierboven gebruikt voor de eigen
 * geklonede paragrafen.
 */
function voegPrioriteitenSamenvattingToe(doc, paragrafen) {
  if (!paragrafen || paragrafen.length === 0) return
  const tabel = vindMaatregelenTabel(doc)
  if (!tabel || !tabel.parentNode) return

  paragrafen.forEach((tekst) => {
    const p = doc.createElementNS(W_NS, 'w:p')
    const pPr = doc.createElementNS(W_NS, 'w:pPr')
    const spacing = doc.createElementNS(W_NS, 'w:spacing')
    spacing.setAttribute('w:after', '160')
    pPr.appendChild(spacing)
    p.appendChild(pPr)

    const r = doc.createElementNS(W_NS, 'w:r')
    const rPr = doc.createElementNS(W_NS, 'w:rPr')
    rPr.appendChild(doc.createElementNS(W_NS, 'w:i'))
    const color = doc.createElementNS(W_NS, 'w:color')
    color.setAttribute('w:val', '52606D')
    rPr.appendChild(color)
    const sz = doc.createElementNS(W_NS, 'w:sz')
    sz.setAttribute('w:val', '20')
    rPr.appendChild(sz)
    r.appendChild(rPr)

    const t = doc.createElementNS(W_NS, 'w:t')
    t.setAttribute('xml:space', 'preserve')
    t.textContent = tekst
    r.appendChild(t)
    p.appendChild(r)

    tabel.parentNode.insertBefore(p, tabel)
  })
}

/**
 * Ronde 2026-10-19 (#1): de Roadmap-sectie ("6. Roadmap: korte,
 * middellange en lange termijn") bestaat al als kant-en-klare placeholder
 * in de Premium/Gold-sjablonen — exact 3 regels die hier letterlijk worden
 * teruggevonden op hun vaste prefix en vervangen. Ontbreekt de sectie
 * (Basis/QuickScan heeft 'm niet, zie het sjabloon zelf), dan gebeurt er
 * simpelweg niets — geen foutmelding, geen giswerk.
 */
const ROADMAP_REGELS = [
  { key: 'kort', prefix: '–  Korte termijn (0-1 jaar): ' },
  { key: 'middellang', prefix: '–  Middellange termijn (1-5 jaar): ' },
  { key: 'lang', prefix: '–  Lange termijn (5+ jaar, gekoppeld aan natuurlijke vervangmomenten): ' },
]
const ROADMAP_LEEG_TEKST = 'Geen maatregelen in dit tijdvak bekend op basis van de MJOP-gegevens.'

function vulRoadmap(doc, roadmap) {
  if (!roadmap) return
  const alineas = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'))
  ROADMAP_REGELS.forEach(({ key, prefix }) => {
    const p = alineas.find((el) => elementTekst(el).trim().startsWith(prefix))
    if (!p) return
    zetEersteRunTekst(p, `${prefix}${roadmap[key] ?? ROADMAP_LEEG_TEKST}`)
  })
}

// Afmetingen in EMU (1 cm = 360000 EMU) — de content-breedte van de
// sjablonen is 9356 twips (±16,5 cm); 5500000 EMU (±15,3 cm) blijft daar
// ruim binnen, 16:9-achtige verhouding.
const GRAFIEK_CX = 5500000
const GRAFIEK_CY = 2933333

/**
 * Tekent het staafdiagram (huidige vs. nieuwe energiekosten, met de
 * CO₂-besparing als toelichting) op een canvas — ronde 2026-10-19 (#1).
 * Puur presentatie: de cijfers komen rechtstreeks uit
 * bouwEnergieKostenOverzicht() (adviesrapport.js), hier wordt niets
 * herberekend. Canvas is, net als DOMParser/XMLSerializer elders in dit
 * bestand, een browser-API — geen aparte chart-bibliotheek nodig voor twee
 * staven. Geeft `null` als canvas.toBlob() onverhoopt niets oplevert
 * (nooit een crash — zie de aanroep in genereerAdviesrapportDocx()).
 */
async function tekenEnergieKostenGrafiek(overzicht) {
  const breedte = 900
  const hoogte = 480
  const canvas = document.createElement('canvas')
  canvas.width = breedte
  canvas.height = hoogte
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, breedte, hoogte)

  ctx.font = 'bold 20px Arial, sans-serif'
  ctx.fillStyle = '#16293a'
  ctx.textAlign = 'left'
  ctx.fillText('Energiekosten per jaar (indicatie)', 70, 34)

  if (overzicht.co2PerJaar != null) {
    ctx.font = '16px Arial, sans-serif'
    ctx.fillStyle = '#52606d'
    ctx.textAlign = 'right'
    ctx.fillText(`Geschatte CO₂-besparing: ${overzicht.co2PerJaar.toLocaleString('nl-NL')} kg/jaar`, breedte - 60, 34)
  }

  const marge = { boven: 60, onder: 90, links: 80, rechts: 60 }
  const plotBreedte = breedte - marge.links - marge.rechts
  const plotHoogte = hoogte - marge.boven - marge.onder
  const maxWaarde = Math.max(overzicht.huidigeKosten, overzicht.nieuweKosten, 1) * 1.15

  ctx.strokeStyle = '#e1e6ea'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(marge.links, marge.boven)
  ctx.lineTo(marge.links, marge.boven + plotHoogte)
  ctx.lineTo(marge.links + plotBreedte, marge.boven + plotHoogte)
  ctx.stroke()

  const staven = [
    { label: 'Huidige kosten', waarde: overzicht.huidigeKosten, kleur: '#16293a' },
    { label: 'Na de voorgestelde maatregelen', waarde: overzicht.nieuweKosten, kleur: '#9d7720' },
  ]
  const staafBreedte = 220
  const gap = (plotBreedte - staven.length * staafBreedte) / (staven.length + 1)

  staven.forEach((staaf, i) => {
    const staafHoogte = (staaf.waarde / maxWaarde) * plotHoogte
    const x = marge.links + gap * (i + 1) + staafBreedte * i
    const y = marge.boven + plotHoogte - staafHoogte
    ctx.fillStyle = staaf.kleur
    ctx.fillRect(x, y, staafBreedte, staafHoogte)

    ctx.fillStyle = '#1a1a1a'
    ctx.font = 'bold 24px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`€ ${staaf.waarde.toLocaleString('nl-NL')}`, x + staafBreedte / 2, y - 14)

    ctx.font = '16px Arial, sans-serif'
    ctx.fillStyle = '#52606d'
    ctx.fillText(staaf.label, x + staafBreedte / 2, marge.boven + plotHoogte + 32)
  })

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return null
  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}

/** Eerste vrije rId (hoogste + 1) — zelfde telwijze als de rest van de sjabloon-relaties, nooit een id hergebruiken. */
function vindVolgendeRelId(relsXmlText) {
  const ids = [...relsXmlText.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]))
  return `rId${(ids.length > 0 ? Math.max(...ids) : 0) + 1}`
}

/** Voegt de PNG toe aan het zip-bestand en registreert 'm als relationship — [Content_Types].xml hoeft niet aangepast: alle 3 sjablonen hebben al een `Default Extension="png"`-registratie (voor het bestaande logo). */
async function voegAfbeeldingToe(zip, pngBytes) {
  const relsPath = 'word/_rels/document.xml.rels'
  const relsBestand = zip.file(relsPath)
  if (!relsBestand) return null
  const relsXml = await relsBestand.async('text')
  const relId = vindVolgendeRelId(relsXml)
  const mediaNaam = 'media/grafiek-energiekosten.png'
  zip.file(relsPath, relsXml.replace('</Relationships>', `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${mediaNaam}"/></Relationships>`))
  zip.file(`word/${mediaNaam}`, pngBytes)
  return relId
}

/** Bouwt de <w:p>-paragraaf met de <w:drawing> erin, als los, geïmporteerd DOM-fragment — exact dezelfde drawing-structuur als het bestaande logo in de sjablonen, alleen met een eigen r:embed. */
function bouwGrafiekParagraph(doc, relId) {
  const xml = `<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:pPr><w:jc w:val="center"/><w:spacing w:before="160" w:after="160"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${GRAFIEK_CX}" cy="${GRAFIEK_CY}"/><wp:effectExtent t="0" r="0" b="0" l="0"/><wp:docPr id="100" name="Energiekosten-grafiek" descr="Grafiek huidige versus nieuwe energiekosten" title="Energiekosten-grafiek"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="" descr=""/><pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relId}" cstate="none"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="${GRAFIEK_CX}" cy="${GRAFIEK_CY}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
  const parser = new DOMParser()
  const fragmentDoc = parser.parseFromString(xml, 'application/xml')
  if (fragmentDoc.getElementsByTagName('parsererror').length > 0) return null
  return doc.importNode(fragmentDoc.documentElement, true)
}

/** Plaatst de grafiek-paragraaf vlak vóór "2. Uitgangspunten van dit rapport" — identieke, vaste heading in alle 3 sjablonen, dus direct ná de Samenvatting-sectie, ongeacht hoeveel samenvattingsalinea's daar staan. */
function voegGrafiekToe(doc, paragraphNode) {
  const alineas = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'))
  const heading = alineas.find((p) => elementTekst(p).trim() === '2. Uitgangspunten van dit rapport')
  if (!heading || !heading.parentNode) return false
  heading.parentNode.insertBefore(paragraphNode, heading)
  return true
}

/** De bouwkundige-analyse-tabel (Premium/Gold) is herkenbaar aan de header "Bouwdeel"/"Huidige Rc- / U-waarde (schatting)". */
function vindBouwkundigeAnalyseTabel(doc) {
  const tabellen = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'))
  return (
    tabellen.find((tabel) => {
      const eersteRij = tabel.getElementsByTagNameNS(W_NS, 'tr')[0]
      if (!eersteRij) return false
      const headerCellen = Array.from(eersteRij.getElementsByTagNameNS(W_NS, 'tc')).map((tc) => elementTekst(tc).trim())
      return headerCellen[0] === 'Bouwdeel' && headerCellen[1]?.startsWith('Huidige Rc')
    }) ?? null
  )
}

/**
 * Vult de 4 vaste rijen (Gevel/Dak/Vloer/Beglazing) op basis van het rij-
 * label, niet op positie — de 5e rij ("Installaties") heeft vaste
 * "n.v.t."-waarden i.p.v. een Rc/U-kolom en blijft bewust ongemoeid (zie
 * adviesrapport.js). Alleen aanwezig in Premium/Gold; ontbreekt de tabel
 * (Basis), dan gebeurt er simpelweg niets.
 */
function vulBouwkundigeAnalyseTabel(doc, bouwkundigeAnalyse) {
  const tabel = vindBouwkundigeAnalyseTabel(doc)
  if (!tabel) return
  const rijen = Array.from(tabel.getElementsByTagNameNS(W_NS, 'tr')).slice(1)
  const perLabel = new Map(bouwkundigeAnalyse.map((r) => [r.label, r]))

  rijen.forEach((rij) => {
    const cellen = Array.from(rij.getElementsByTagNameNS(W_NS, 'tc'))
    const label = elementTekst(cellen[0]).trim()
    const gegevens = perLabel.get(label)
    if (!gegevens) return // "Installaties (verwarming/ventilatie)" — bewust niet aangeraakt.
    zetEersteRunTekst(cellen[1], gegevens.waarde ?? '')
    zetEersteRunTekst(cellen[3], gegevens.beoordeling ?? '')
    zetEersteRunTekst(cellen[4], gegevens.opmerking ?? '')
  })
}

/** De subsidiebegeleidingsplan-tabel (uitsluitend Gold) is herkenbaar aan de header "Stap"/"Actie"/"Verantwoordelijke". */
function vindSubsidieplanTabel(doc) {
  const tabellen = Array.from(doc.getElementsByTagNameNS(W_NS, 'tbl'))
  return (
    tabellen.find((tabel) => {
      const eersteRij = tabel.getElementsByTagNameNS(W_NS, 'tr')[0]
      if (!eersteRij) return false
      const headerCellen = Array.from(eersteRij.getElementsByTagNameNS(W_NS, 'tc')).map((tc) => elementTekst(tc).trim())
      return headerCellen[0] === 'Stap' && headerCellen[1] === 'Actie'
    }) ?? null
  )
}

/**
 * Vervangt alle databaserijen door de daadwerkelijke stappen uit
 * dossier_taken (categorie='subsidie') — in tegenstelling tot de
 * maatregelentabel staan hier in het sjabloon al 3 voorbeeldrijen met
 * tekst; die tekst is nu net zo goed "sjabloon", geen eigen bron van
 * waarheid meer zodra de adviseur de taken heeft aangepast. Rijen die
 * ontbreken/overtollig zijn worden verwijderd/toegevoegd door de
 * eerste rij te klonen als sjabloon voor stijl.
 */
function vulSubsidieplanTabel(doc, subsidieStappen) {
  const tabel = vindSubsidieplanTabel(doc)
  if (!tabel) return { waarschuwingen: [] }
  const rijen = Array.from(tabel.getElementsByTagNameNS(W_NS, 'tr'))
  const dataRijen = rijen.slice(1)
  if (dataRijen.length === 0) return { waarschuwingen: [] }
  const rijSjabloon = dataRijen[0]
  const waarschuwingen = []

  subsidieStappen.forEach((stap, i) => {
    let rij = dataRijen[i]
    if (!rij) {
      rij = rijSjabloon.cloneNode(true)
      tabel.appendChild(rij)
    }
    const cellen = Array.from(rij.getElementsByTagNameNS(W_NS, 'tc'))
    zetEersteRunTekst(cellen[0], String(stap.stap))
    zetEersteRunTekst(cellen[1], stap.actie)
    zetEersteRunTekst(cellen[2], stap.verantwoordelijke ?? '')
    zetEersteRunTekst(cellen[3], stap.deadline ?? '')
  })

  for (let i = subsidieStappen.length; i < dataRijen.length; i++) {
    dataRijen[i].parentNode.removeChild(dataRijen[i])
  }

  return { waarschuwingen }
}

/**
 * Bouwt de gevulde .docx als Blob. Geeft naast de blob ook de
 * ontbrekende/afgekapte velden terug, zodat de adviseur vóór verzending
 * kan zien wat nog handmatig moet worden aangevuld (randvoorwaarde 14 —
 * reproduceerbaar en controleerbaar).
 */
export async function genereerAdviesrapportDocx({ dossier, adviespunten = [], pakketId, adviseurNaam = null, datum = null, subsidieTaken = [], instellingen = null }) {
  const templateUrl = TEMPLATE_URLS[pakketId]
  if (!templateUrl) {
    throw new Error(`Onbekend pakket "${pakketId}" — geen sjabloon beschikbaar.`)
  }

  const data = bouwAdviesrapportData({ dossier, adviespunten, pakketId, adviseurNaam, datum, subsidieTaken, instellingen })

  const respons = await fetch(templateUrl)
  if (!respons.ok) throw new Error('Kon het rapportsjabloon niet laden.')
  const templateBuffer = await respons.arrayBuffer()

  const zip = await JSZip.loadAsync(templateBuffer)
  const documentXmlBestand = zip.file(DOCUMENT_XML_PATH)
  if (!documentXmlBestand) throw new Error('Sjabloon mist word/document.xml — mogelijk een beschadigd of onverwacht bestand.')
  const documentXml = await documentXmlBestand.async('text')

  const parser = new DOMParser()
  const doc = parser.parseFromString(documentXml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Kon het sjabloon niet als geldige XML inlezen.')
  }

  vulMetatabel(doc, data.meta)
  vulSamenvatting(doc, data.samenvatting)
  const { waarschuwingen: maatregelWaarschuwingen } = vulMaatregelenTabel(doc, data.maatregelen)
  voegPrioriteitenSamenvattingToe(doc, data.prioriteitenSamenvatting)
  vulBouwkundigeAnalyseTabel(doc, data.bouwkundigeAnalyse)
  vulRoadmap(doc, data.roadmap)
  const { waarschuwingen: subsidieWaarschuwingen } = vulSubsidieplanTabel(doc, data.subsidieStappen)
  const waarschuwingen = [...maatregelWaarschuwingen, ...subsidieWaarschuwingen]

  // Grafiekblok (#1) is bewust in zijn eigen try/catch: als het tekenen of
  // inschieten van de afbeelding om wat voor reden dan ook mislukt, mag dat
  // nooit de rest van het al-werkende rapport (metatabel/samenvatting/
  // maatregelentabel) laten mislukken — net zoals de andere onderdelen
  // hierboven al los van elkaar falen/waarschuwen in plaats van te crashen.
  if (data.energieOverzicht) {
    try {
      const pngBytes = await tekenEnergieKostenGrafiek(data.energieOverzicht)
      const relId = pngBytes ? await voegAfbeeldingToe(zip, pngBytes) : null
      const paragraphNode = relId ? bouwGrafiekParagraph(doc, relId) : null
      if (!paragraphNode || !voegGrafiekToe(doc, paragraphNode)) {
        waarschuwingen.push('Het energiekosten-grafiekje kon niet in dit document worden geplaatst — de cijfers staan nog wel in het dossier.')
      }
    } catch {
      waarschuwingen.push('Het energiekosten-grafiekje kon niet worden gegenereerd — de cijfers staan nog wel in het dossier.')
    }
  }

  const serializer = new XMLSerializer()
  let nieuweXml = serializer.serializeToString(doc)
  if (!nieuweXml.startsWith('<?xml')) {
    nieuweXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + nieuweXml
  }
  zip.file(DOCUMENT_XML_PATH, nieuweXml)

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  return {
    blob,
    ontbrekendeVelden: data.ontbrekendeVelden,
    waarschuwingen,
  }
}

function veiligeBestandsnaam(tekst) {
  return (
    String(tekst ?? '')
      .trim()
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'dossier'
  )
}

const PAKKET_BESTANDSNAAM = { basis: 'quickscan', premium: 'premium', gold: 'gold' }

/**
 * Uniforme SMV-documentbenoeming (2026-10-12, zie 0045_dossier_nummer.sql):
 * begint met het dossiernummer, zodat elk document van een dossier
 * hetzelfde herkenbare voorvoegsel heeft als offertes/facturen
 * ("SMV-OFF-2026-0035"/"SMV-FAC-2026-0009"). Zelfde conventie als
 * bouwSubsidieDocumentBestandsnaam() in subsidieDocumentDocx.js.
 */
export function bouwAdviesrapportBestandsnaam({ dossier, pakketId }) {
  const naam = veiligeBestandsnaam(dossier?.panden?.omschrijving || dossier?.klanten?.naam || dossier?.dossier_id)
  const pakketSlug = PAKKET_BESTANDSNAAM[pakketId] ?? 'rapport'
  const prefix = dossier?.dossier_nummer ? `${dossier.dossier_nummer}_` : ''
  return `${prefix}adviesrapport-${pakketSlug}-${naam}.docx`
}

/** Losse download-stap (geen hergeneratie) — zodat de UI eerst een blob kan tonen/controleren (ontbrekendeVelden/waarschuwingen) vóórdat de daadwerkelijke download start. */
export function downloadAdviesrapportBlob(blob, bestandsnaam) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = bestandsnaam
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Genereert het rapport en start meteen de download — voor gebruik zonder tussenliggende preview. */
export async function triggerAdviesrapportDocxDownload({ dossier, adviespunten, pakketId, adviseurNaam, datum, subsidieTaken, instellingen }) {
  const resultaat = await genereerAdviesrapportDocx({ dossier, adviespunten, pakketId, adviseurNaam, datum, subsidieTaken, instellingen })
  downloadAdviesrapportBlob(resultaat.blob, bouwAdviesrapportBestandsnaam({ dossier, pakketId }))
  return resultaat
}
