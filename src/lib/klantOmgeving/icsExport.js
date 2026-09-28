/**
 * Browser-native .ics-export voor herbeoordelingen (werkfase Fase 9/12).
 * Geen externe agenda-API, geen afhankelijkheid — puur tekst + Blob-download,
 * zelfde patroon als lib/mjop/importExport.js#triggerJsonDownload.
 *
 * Neemt UITSLUITEND items mee met een ingevuld, structureel
 * `herbeoordelenDatum` (werkfase Fase 9) — een vrije-tekstwaarde als "over
 * twee jaar" kan niet betrouwbaar naar een kalenderdatum vertaald worden
 * zonder te gokken, dus die items worden bewust overgeslagen, niet geraden.
 */

function icsEscape(tekst) {
  return String(tekst ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function datumNaarIcsValue(isoDatum) {
  return isoDatum.replace(/-/g, '')
}

function nuAlsIcsTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Bouwt de volledige .ics-tekst (VCALENDAR met één VEVENT per item met een
 * datum). `items`: `{ adviespuntId, onderwerp, herbeoordelenDatum,
 * toelichting, klantNaam, pandNaam }`. Geeft `null` als er niets te
 * exporteren valt (geen enkel item met een datum) — de aanroeper toont dan
 * geen downloadknop i.p.v. een leeg bestand.
 */
export function bouwHerbeoordelingenIcs(items = []) {
  const metDatum = items.filter((i) => i.herbeoordelenDatum)
  if (metDatum.length === 0) return null

  const dtstamp = nuAlsIcsTimestamp()
  const regels = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SMV Advies//Herbeoordelingen//NL',
    'CALSCALE:GREGORIAN',
  ]
  for (const item of metDatum) {
    const context = [item.klantNaam, item.pandNaam].filter(Boolean).join(' — ')
    regels.push(
      'BEGIN:VEVENT',
      `UID:herbeoordeling-${item.adviespuntId}@smv-advies.nl`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${datumNaarIcsValue(item.herbeoordelenDatum)}`,
      `SUMMARY:${icsEscape(`Herbeoordelen: ${item.onderwerp}`)}`,
      `DESCRIPTION:${icsEscape([context, item.toelichting].filter(Boolean).join(' — '))}`,
      'END:VEVENT',
    )
  }
  regels.push('END:VCALENDAR')
  return regels.join('\r\n') + '\r\n'
}

/** Triggert de browserdownload van de .ics-tekst — `null` (niets te exporteren) doet niets. */
export function triggerIcsDownload(items, bestandsnaam = 'herbeoordelingen.ics') {
  const ics = bouwHerbeoordelingenIcs(items)
  if (!ics) return false
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = bestandsnaam
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return true
}
