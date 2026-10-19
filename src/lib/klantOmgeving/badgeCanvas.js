/**
 * SMV Duurzaamheidsbadge — een downloadbare, deelbare afbeelding met de
 * eigen dossiercijfers van de klant (projectplan "Klantwaarde-uitbreidingen",
 * Fase 3 — #11, ronde 2026-10-19). Browser-only canvas-code (net als
 * adviesrapportDocx.js) — geen jsdom in dit project, dus geen directe
 * unit-tests hier; zie badgeCanvasBroncontrole.test.js voor statische
 * bron-checks.
 *
 * Hergebruikt exact dezelfde, al-berekende cijfers als Fase 1 (#1) en
 * Fase 2 (#12) via `bouwKlantTotalen()` — geen nieuwe berekening, geen
 * nieuwe databron.
 *
 * Juridisch randvoorwaarde (zie projectplan #11): de disclaimer hieronder
 * is verplicht en mag nooit weggelaten of onleesbaar klein gemaakt worden —
 * dit voorkomt dat de badge kan worden verward met een officieel
 * energielabel/certificaat.
 */
export const BADGE_DISCLAIMER = 'Op basis van advies door SMV Advies — geen officieel energielabel of certificaat'

const BREEDTE = 1080
const HOOGTE = 1080
const NAVY = '#16293a'
const GOUD = '#9d7720'
const GOUD_LICHT = '#c79d55'

function laadAfbeelding(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Kon afbeelding niet laden: ${src}`))
    img.src = src
  })
}

/**
 * Tekent de badge op een canvas en geeft de PNG-bytes terug. `totalen` is
 * het resultaat van `bouwKlantTotalen()` — de aanroeper controleert zelf
 * vooraf dat dit niet `null` is (zie Account.jsx), exact zoals bij het
 * grafiekblok in het adviesrapport: geen badge zonder kloppende cijfers.
 */
export async function genereerBadgePng(totalen, { bedrijfsnaam = null } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = BREEDTE
  canvas.height = HOOGTE
  const ctx = canvas.getContext('2d')

  // Achtergrond + gouden kaderlijn.
  ctx.fillStyle = NAVY
  ctx.fillRect(0, 0, BREEDTE, HOOGTE)
  ctx.strokeStyle = GOUD
  ctx.lineWidth = 6
  ctx.strokeRect(24, 24, BREEDTE - 48, HOOGTE - 48)

  // SMV-logo (wit-op-transparant, voor gebruik op de donkere achtergrond —
  // zelfde bestand als Footer.jsx, zie de uitleg daar).
  try {
    const logo = await laadAfbeelding('/logo-footer-light.png')
    const logoBreedte = 320
    const logoHoogte = logoBreedte * (logo.height / logo.width)
    ctx.drawImage(logo, (BREEDTE - logoBreedte) / 2, 90, logoBreedte, logoHoogte)
  } catch {
    // Geen logo beschikbaar (bv. afbeelding niet geladen) → badge gaat
    // gewoon door zonder logo, nooit een kapotte/halve afbeelding tonen.
  }

  ctx.textAlign = 'center'

  if (bedrijfsnaam) {
    ctx.fillStyle = '#ffffff'
    ctx.font = '28px Arial, sans-serif'
    ctx.fillText(`Resultaat van ${bedrijfsnaam}`, BREEDTE / 2, 310)
  }

  ctx.fillStyle = GOUD_LICHT
  ctx.font = 'bold 76px Arial, sans-serif'
  ctx.fillText(`€ ${Math.round(totalen.besparingPerJaar).toLocaleString('nl-NL')}`, BREEDTE / 2, 470)
  ctx.fillStyle = '#ffffff'
  ctx.font = '32px Arial, sans-serif'
  ctx.fillText('geschatte energiekostenbesparing per jaar', BREEDTE / 2, 515)

  if (totalen.co2PerJaar != null) {
    ctx.fillStyle = GOUD_LICHT
    ctx.font = 'bold 56px Arial, sans-serif'
    ctx.fillText(`${totalen.co2PerJaar.toLocaleString('nl-NL')} kg CO₂`, BREEDTE / 2, 610)
    ctx.fillStyle = '#ffffff'
    ctx.font = '32px Arial, sans-serif'
    ctx.fillText('bespaard per jaar', BREEDTE / 2, 650)
  }

  // Verplichte disclaimer — bewust goed leesbaar (geen kleine lettertjes),
  // in een eigen gouden kader onderaan de badge.
  const disclaimerY = HOOGTE - 150
  ctx.strokeStyle = GOUD
  ctx.lineWidth = 2
  ctx.strokeRect(70, disclaimerY - 40, BREEDTE - 140, 110)
  ctx.fillStyle = '#ffffff'
  ctx.font = '24px Arial, sans-serif'
  woordenwrap(ctx, BADGE_DISCLAIMER, BREEDTE / 2, disclaimerY, BREEDTE - 200, 30)

  ctx.fillStyle = GOUD_LICHT
  ctx.font = '26px Arial, sans-serif'
  ctx.fillText('smv-advies.nl', BREEDTE / 2, HOOGTE - 60)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const buffer = await blob.arrayBuffer()
  return new Uint8Array(buffer)
}

/** Eenvoudige woordterugloop voor de disclaimer-tekst, canvas kent dit niet standaard. */
function woordenwrap(ctx, tekst, x, y, maxBreedte, lijnHoogte) {
  const woorden = tekst.split(' ')
  let lijn = ''
  const lijnen = []
  for (const woord of woorden) {
    const test = lijn ? `${lijn} ${woord}` : woord
    if (ctx.measureText(test).width > maxBreedte && lijn) {
      lijnen.push(lijn)
      lijn = woord
    } else {
      lijn = test
    }
  }
  lijnen.push(lijn)
  const startY = y - ((lijnen.length - 1) * lijnHoogte) / 2
  lijnen.forEach((l, i) => ctx.fillText(l, x, startY + i * lijnHoogte))
}
