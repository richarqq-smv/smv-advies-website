import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'

// Fase 5 (projectplan "Klantwaarde-uitbreidingen", #8): loyaliteitskorting
// na 1 jaar. Zelfde architectuur/veiligheidspatroon als
// jaarrapportage-sync/index.ts (Fase 4) — zie de uitgebreide toelichting
// daar. Belangrijkste verschil: dit is een EENMALIGE mail per dossier
// (loyaliteitskorting_verzonden_op wordt nooit meer teruggezet naar null
// door een normale flow), niet een jaarlijks terugkerende.
//
// Kortingspercentages (4,5%/9,5%/15%, 3/2/1 opties per pakket-tier) zijn
// GEEN verzonnen waarde — ze staan letterlijk, met de aantekening
// "(bevestigd door Richard)", in het goedgekeurde projectplan
// "Klantwaarde-uitbreidingen SMV Advies — Projectplan", sectie #8
// (https://claude.ai/code/artifact/e1bd79c7-717c-4307-8c10-e5d38896d580).
// Deze percentages blijven dus ongewijzigd in de correctieronde.
//
// CORRECTIERONDE (2026-10-19, na oplevering, interne security-review):
// zelfde kwetsbaarheid als jaarrapportage-sync — verify_jwt:true bewijst
// alleen een geldig Supabase-JWT, en dat kan de publieke anon-key zijn.
// Nu dus ook hier een eigen, verplichte X-Cron-Secret-controle (zie
// jaarrapportage-sync/index.ts voor de volledige toelichting) — fail-
// closed zonder geconfigureerde/overeenkomende secret.
//
// Deployment: zelfde opmerking als de andere Edge Functions — dit bestand
// is de bron van waarheid, gedeployed via de Supabase MCP.

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'SMV Advies <noreply@mail.smv-advies.nl>'
const CONTACT_URL = 'https://smv-advies.nl/contact'
const CRON_SECRET_HEADER = 'x-cron-secret'

function escapeHtml(value: unknown) {
  const safeValue = value !== null && typeof value === 'object' ? '' : value
  return String(safeValue ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Constant-time vergelijking — voorkomt dat een timing-verschil de secret-lengte/inhoud lekt. */
function secretsKomenOvereen(gegeven: string, verwacht: string) {
  const bufGegeven = new TextEncoder().encode(gegeven)
  const bufVerwacht = new TextEncoder().encode(verwacht)
  if (bufGegeven.length !== bufVerwacht.length) return false
  return timingSafeEqual(bufGegeven, bufVerwacht)
}

/**
 * 12 kalendermaanden geleden — bewust GEEN "12 * 30 dagen"-benadering
 * (correctieronde 2026-10-19), zie jaarrapportage-sync/index.ts voor de
 * volledige toelichting op waarom dat stelselmatig uit de pas loopt.
 */
function twaalfMaandenGeleden(nu = new Date()) {
  const datum = new Date(nu)
  datum.setUTCMonth(datum.getUTCMonth() - 12)
  return datum.toISOString()
}

interface DossierRij {
  dossier_id: string
  dossier_nummer: string | null
  pakket_id: string | null
  afgerond_op: string | null
  loyaliteitskorting_verzonden_op: string | null
  panden: { omschrijving: string | null; adres: string | null } | null
  klanten: { naam: string | null; bedrijfsnaam: string | null; email: string | null } | null
  contactpersonen: { naam: string | null; email: string | null } | null
}

/**
 * Letterlijke kopie van bouwKortingOpties()/bouwKortingCode() uit
 * src/lib/klantOmgeving/loyaliteitskorting.js — bewust los gehouden
 * (Edge Functions worden onafhankelijk van de frontend-bundel
 * gedeployed), zie de toelichting daar. Bij een wijziging aan de
 * kortingslogica dus BEIDE plekken bijwerken.
 */
const PAKKET_VOLGORDE = ['basis', 'premium', 'gold']
const PAKKET_LABELS: Record<string, string> = { basis: 'Basis', premium: 'Premium', gold: 'Gold' }

function bouwKortingOpties(pakketId: string | null) {
  const index = pakketId ? PAKKET_VOLGORDE.indexOf(pakketId) : -1
  if (index === -1) return []
  const opties = [{ doelPakketLabel: PAKKET_LABELS[pakketId!], percentage: 4.5, omschrijving: `Zelfde pakket (${PAKKET_LABELS[pakketId!]})` }]
  if (index + 1 < PAKKET_VOLGORDE.length) {
    const eenStapHoger = PAKKET_VOLGORDE[index + 1]
    opties.push({ doelPakketLabel: PAKKET_LABELS[eenStapHoger], percentage: 9.5, omschrijving: `Upgrade naar ${PAKKET_LABELS[eenStapHoger]}` })
  }
  if (index + 2 < PAKKET_VOLGORDE.length) {
    const tweeStappenHoger = PAKKET_VOLGORDE[index + 2]
    opties.push({ doelPakketLabel: PAKKET_LABELS[tweeStappenHoger], percentage: 15, omschrijving: `Upgrade naar ${PAKKET_LABELS[tweeStappenHoger]}` })
  }
  return opties
}

function bouwKortingCode(dossierNummer: string | null) {
  return dossierNummer ? `LOY-${dossierNummer}` : null
}

function naamVoorAanhef(klant: DossierRij['klanten'], contact: DossierRij['contactpersonen']) {
  return contact?.naam || klant?.bedrijfsnaam || klant?.naam || 'daar'
}

function ontvangerEmail(klant: DossierRij['klanten'], contact: DossierRij['contactpersonen']) {
  return contact?.email || klant?.email || null
}

function pandLabel(pand: DossierRij['panden']) {
  return pand?.omschrijving || pand?.adres || 'uw pand'
}

function buildLoyaliteitskortingEmail(dossier: DossierRij, code: string, opties: ReturnType<typeof bouwKortingOpties>) {
  const e = (v: unknown) => escapeHtml(v)
  const aanhef = naamVoorAanhef(dossier.klanten, dossier.contactpersonen)
  const pand = pandLabel(dossier.panden)

  const optieRegels = opties
    .map(
      (o) => `<tr>
        <td style="padding:8px 12px;font-size:14px;color:#16293A;border-bottom:1px solid #F0F0F0;">${e(o.omschrijving)}</td>
        <td style="padding:8px 12px;font-size:14px;font-weight:700;color:#9D7720;border-bottom:1px solid #F0F0F0;text-align:right;">${e(o.percentage)}%</td>
      </tr>`,
    )
    .join('')

  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Een jaar later — uw voordeel bij SMV Advies</title>
</head>
<body style="margin:0;padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F1F4F6">
  <tr>
    <td align="center" style="padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;border:1px solid #E1E6EA;" bgcolor="#ffffff">
        <tr>
          <td style="background:linear-gradient(135deg,#16293A 0%,#2C4A63 100%);padding:28px 32px;" bgcolor="#16293A">
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;">
              <span style="color:#C79D55;">SMV</span><span style="color:#ffffff;"> Advies</span>
            </span>
            <p style="margin:10px 0 0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#C79D55;">Een jaar later — uw voordeel</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;" bgcolor="#ffffff">
            <p style="margin:0 0 12px;font-size:15px;color:#1A1A1A;">Beste ${e(aanhef)},</p>
            <p style="margin:0 0 16px;font-size:14px;color:#333333;line-height:1.6;">
              Het is inmiddels een jaar geleden dat wij het advies voor ${e(pand)} hebben afgerond. Toe aan een vervolgstap, of wilt u gewoon eens opnieuw laten kijken? Dan heeft u recht op het volgende voordeel:
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
              ${optieRegels}
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border-radius:8px;" bgcolor="#F6EFE2">
              <tr><td style="padding:14px 16px;">
                <p style="margin:0;font-size:12px;color:#52606D;text-transform:uppercase;letter-spacing:.04em;">Uw persoonlijke kortingscode</p>
                <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#16293A;letter-spacing:.03em;">${e(code)}</p>
              </td></tr>
            </table>
            <p style="margin:0 0 16px;font-size:14px;color:#333333;line-height:1.6;">
              Neem contact met ons op en noem deze code — wij verwerken de korting dan persoonlijk in uw offerte.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 8px;">
              <tr><td style="border-radius:8px;" bgcolor="#9D7720">
                <a href="${CONTACT_URL}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Neem contact op</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #F0F0F0;" bgcolor="#ffffff">
            <p style="margin:0;font-size:12px;color:#52606D;">U ontvangt deze mail omdat uw adviesdossier bij SMV Advies een jaar geleden is afgerond.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  return { subject: `Een jaar later — uw persoonlijke korting bij SMV Advies`, html }
}

async function sendViaResend(apiKey: string, to: string, subject: string, html: string) {
  return fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  })
}

Deno.serve(async (req: Request) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Fail-closed interne authenticatie — zelfde RPC-gebaseerde aanpak als
  // jaarrapportage-sync/index.ts: het verwachte geheim leeft uitsluitend
  // in Supabase Vault, opgehaald via de service-role-only RPC
  // get_cron_shared_secret() (0058_cron_shared_secret_rpc.sql), nooit als
  // losse Edge Function-secret en nooit in git.
  const gegevenSecret = req.headers.get(CRON_SECRET_HEADER)
  const { data: verwachteSecret } = await supabase.rpc('get_cron_shared_secret')
  if (!verwachteSecret || !gegevenSecret || !secretsKomenOvereen(gegevenSecret, verwachteSecret)) {
    return new Response(JSON.stringify({ ok: false, error: 'Niet geautoriseerd' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let dryRun = true
  try {
    const body = await req.json()
    dryRun = body?.dryRun !== false
  } catch {
    // Geen/ongeldige JSON-body → dryRun blijft op de veilige standaard (true).
  }

  const twaalfMaandenGrens = twaalfMaandenGeleden()

  // Kandidaten: afgeronde, niet-gearchiveerde dossiers waarvan de
  // afronding 12+ kalendermaanden geleden is EN waarvan afgerond_op
  // daadwerkelijk bekend is (`.not(...is.null)` sluit dossiers zonder
  // betrouwbare afrondingsdatum uit — zie 0054_loyaliteitskorting.sql,
  // bewust geen gok-backfill) en waarvoor nog nooit een loyaliteitskorting
  // is verstuurd (eenmalig, dus geen "ouder dan N maanden sinds laatste
  // keer"-herhaling zoals bij de jaarrapportage).
  const { data: dossiers, error: queryError } = await supabase
    .from('dossiers')
    .select(
      'dossier_id, dossier_nummer, pakket_id, afgerond_op, loyaliteitskorting_verzonden_op, panden(omschrijving, adres), klanten(naam, bedrijfsnaam, email), contactpersonen(naam, email)',
    )
    .eq('status', 'afgerond')
    .is('gearchiveerd_op', null)
    .eq('gearchiveerd_via_klant', false)
    .not('afgerond_op', 'is', null)
    .lte('afgerond_op', twaalfMaandenGrens)
    .is('loyaliteitskorting_verzonden_op', null)

  if (queryError) {
    return new Response(JSON.stringify({ ok: false, error: queryError.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const resultaten: Array<{ dossier_id: string; dossier_nummer: string | null; ontvanger: string | null; actie: string }> = []

  for (const dossier of (dossiers ?? []) as unknown as DossierRij[]) {
    const opties = bouwKortingOpties(dossier.pakket_id)
    const code = bouwKortingCode(dossier.dossier_nummer)
    const ontvanger = ontvangerEmail(dossier.klanten, dossier.contactpersonen)

    if (opties.length === 0 || !code) {
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'overgeslagen_geen_pakket_bekend' })
      continue
    }
    if (!ontvanger) {
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger: null, actie: 'overgeslagen_geen_emailadres' })
      continue
    }

    const { subject, html } = buildLoyaliteitskortingEmail(dossier, code, opties)

    if (dryRun) {
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'zou_verzenden_droogloop' })
      continue
    }

    if (!apiKey) {
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'fout_geen_resend_sleutel' })
      continue
    }

    // Dubbel-verzend-bescherming (correctieronde): atomair claimen vóór
    // verzending — alleen als het veld op dit moment nog echt null is.
    // Bij een gelijktijdige/herhaalde aanroep claimt maar één van de twee
    // de rij. Dit veld is eenmalig (nooit teruggezet door een normale
    // flow), dus bij een mislukte verzending wordt de claim simpelweg
    // teruggezet naar null — de korting blijft dan eenmalig beschikbaar
    // voor een volgende (geslaagde) poging.
    const { data: geclaimd, error: claimError } = await supabase
      .from('dossiers')
      .update({ loyaliteitskorting_verzonden_op: new Date().toISOString() })
      .eq('dossier_id', dossier.dossier_id)
      .is('loyaliteitskorting_verzonden_op', null)
      .select('dossier_id')
      .maybeSingle()

    if (claimError || !geclaimd) {
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'overgeslagen_al_geclaimd' })
      continue
    }

    try {
      const response = await sendViaResend(apiKey, ontvanger, subject, html)
      try {
        await supabase.from('mail_log').insert({
          type: 'loyaliteitskorting',
          ontvanger,
          gelukt: response.ok,
          foutmelding: response.ok ? null : `Resend-fout (status ${response.status})`,
        })
      } catch {
        // Loggen is best-effort — nooit de hoofdflow breken.
      }

      if (response.ok) {
        resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'verzonden' })
      } else {
        await supabase.from('dossiers').update({ loyaliteitskorting_verzonden_op: null }).eq('dossier_id', dossier.dossier_id)
        resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'fout_resend' })
      }
    } catch (err) {
      await supabase.from('dossiers').update({ loyaliteitskorting_verzonden_op: null }).eq('dossier_id', dossier.dossier_id)
      const message = err instanceof Error ? err.message : String(err)
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: `fout_onverwacht: ${message}` })
    }
  }

  return new Response(JSON.stringify({ ok: true, dryRun, aantalKandidaten: resultaten.length, resultaten }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
