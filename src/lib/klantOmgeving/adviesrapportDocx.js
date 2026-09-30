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
 * templates: de metatabel (klantnaam/pandadres/datum/adviseur), de
 * samenvatting, en de maatregelentabel. Rapportnummer en "Pakket" (dat
 * al per sjabloon-bestand vaststaat) worden bewust niet aangepast —
 * zie adviesrapport.js.
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
export async function genereerAdviesrapportDocx({ dossier, adviespunten = [], pakketId, adviseurNaam = null, datum = null, subsidieTaken = [] }) {
  const templateUrl = TEMPLATE_URLS[pakketId]
  if (!templateUrl) {
    throw new Error(`Onbekend pakket "${pakketId}" — geen sjabloon beschikbaar.`)
  }

  const data = bouwAdviesrapportData({ dossier, adviespunten, pakketId, adviseurNaam, datum, subsidieTaken })

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
  vulBouwkundigeAnalyseTabel(doc, data.bouwkundigeAnalyse)
  const { waarschuwingen: subsidieWaarschuwingen } = vulSubsidieplanTabel(doc, data.subsidieStappen)
  const waarschuwingen = [...maatregelWaarschuwingen, ...subsidieWaarschuwingen]

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

export function bouwAdviesrapportBestandsnaam({ dossier, pakketId }) {
  const naam = veiligeBestandsnaam(dossier?.panden?.omschrijving || dossier?.klanten?.naam || dossier?.dossier_id)
  const pakketSlug = PAKKET_BESTANDSNAAM[pakketId] ?? 'rapport'
  return `adviesrapport-${pakketSlug}-${naam}.docx`
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
export async function triggerAdviesrapportDocxDownload({ dossier, adviespunten, pakketId, adviseurNaam, datum, subsidieTaken }) {
  const resultaat = await genereerAdviesrapportDocx({ dossier, adviespunten, pakketId, adviseurNaam, datum, subsidieTaken })
  downloadAdviesrapportBlob(resultaat.blob, bouwAdviesrapportBestandsnaam({ dossier, pakketId }))
  return resultaat
}
