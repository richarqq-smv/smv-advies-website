import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Fase 7 (projectplan "Klantwaarde-uitbreidingen", #7): subsidie-
// deadline-signalering — verstuurt de melding naar de klant van ÉÉN
// dossier, per expliciete adminklik vanuit AdminSubsidies.jsx. Anders dan
// de andere nieuwe Edge Functions van dit projectplan (jaarrapportage-
// sync/loyaliteitskorting-sync) draait dit NIET via pg_cron/pg_net — er
// bestaat geen betrouwbare, automatische bron voor deze deadlines (zie
// 0056_subsidie_deadlines.sql), dus elke verzending is een bewuste,
// door een admin bevestigde actie, nooit een geautomatiseerde batch.
//
// Authenticatie: deployed met verify_jwt:true (de platformstandaard),
// maar dat alleen bewijst dat de Authorization-header een geldig
// Supabase-JWT bevat — dat kan net zo goed de publieke anon-key zijn.
// Deze functie controleert daarom zelf opnieuw of de AANROEPER een
// ingelogde, bevestigde admin is (user_roles.role = 'admin'), exact
// dezelfde is_admin()-check als de rest van de admin-RLS in dit project
// — vóórdat er ook maar iets gelezen of verstuurd wordt.
//
// CORRECTIERONDE (2026-10-19, na oplevering, interne security-review):
// deze functie vertrouwde tot nu toe de meegestuurde `regeling`/
// `deadlineDatum`/`budgetStatus` rechtstreeks uit de request-body — de
// browser (of een directe aanroep buiten de UI om) kon dus andere
// waarden aanleveren dan de eerder door de admin bevestigde deadline in
// `subsidie_deadlines`. Nu stuurt de frontend alleen nog `deadlineId` +
// `dossierId` mee; alle inhoud (regeling/deadline_datum/budget_status)
// wordt hier zelf, server-side, uit `subsidie_deadlines` opgehaald — en
// alleen verstuurd als die rij bestaat, `actief` is, EN het dossier
// daadwerkelijk een relevant, open subsidietraject voor die regeling
// heeft (zelfde matching-logica als bouwGeraakteDossiers() in
// subsidieDeadlineMatching.js, hier server-side herhaald — de
// client-side matching in AdminSubsidies.jsx is dus alleen nog UI-gemak,
// nooit de autorisatiebron). Ook CORS/OPTIONS-preflight toegevoegd
// (zelfde patroon als send-email/index.ts) — zonder preflight-afhandeling
// blokkeert de browser de echte POST van AdminSubsidies.jsx bij elke
// cross-origin aanroep met een Authorization-header.
//
// Deployment: zelfde opmerking als de andere Edge Functions — dit
// bestand is de bron van waarheid, gedeployed via de Supabase MCP.

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'SMV Advies <noreply@mail.smv-advies.nl>'

// Zelfde allowlist/patroon als send-email/index.ts — alleen de eigen site
// (en lokale dev-servers) mogen deze functie vanuit een browser aanroepen.
const ALLOWED_ORIGINS = new Set(['https://smv-advies.nl', 'http://localhost:5173', 'http://localhost:4173'])

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
  if (ALLOWED_ORIGINS.has(origin)) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function escapeHtml(value: unknown) {
  const safeValue = value !== null && typeof value === 'object' ? '' : value
  return String(safeValue ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDatumNl(iso: string | null) {
  if (!iso) return null
  const datum = new Date(iso)
  if (Number.isNaN(datum.getTime())) return null
  return datum.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Letterlijke kopie van bouwGeraakteDossiers() se matching-regel — zie subsidieDeadlineMatching.js voor de volledige toelichting. */
const AFGESLOTEN_STATUSSEN = new Set(['toegekend', 'afgewezen', 'verantwoord'])
function dossierHeeftRelevantTraject(regeling: string, dossierSubsidies: Array<{ regeling_naam: string | null; status: string | null }>, dossierStatus: string | null) {
  if (dossierStatus !== 'open') return false
  const regelingLower = regeling.toLowerCase()
  return dossierSubsidies.some(
    (ds) => typeof ds.regeling_naam === 'string' && ds.regeling_naam.toLowerCase().includes(regelingLower) && !AFGESLOTEN_STATUSSEN.has(ds.status ?? ''),
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) })
  }

  const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405)

  let body: { dossierId?: string; deadlineId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Ongeldige aanvraag' }, 400)
  }
  if (typeof body.dossierId !== 'string' || typeof body.deadlineId !== 'string') {
    return jsonResponse({ ok: false, error: 'dossierId en deadlineId zijn verplicht' }, 400)
  }

  // Stap 1: de aanroeper identificeren met ZIJN/HAAR eigen token (niet de
  // service-role-sleutel) — zo retourneert getUser() alleen een resultaat
  // als dit echt een geldige, ingelogde sessie is, nooit bij een kale
  // anon-key-aanroep (bv. curl zonder sessie).
  const authHeader = req.headers.get('Authorization') ?? ''
  const callerClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
  } = await callerClient.auth.getUser()
  if (!user) return jsonResponse({ ok: false, error: 'Niet ingelogd' }, 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Stap 2: is_admin()-equivalent — dezelfde user_roles-tabel als de RLS
  // van de rest van dit project (0001_init.sql), hier expliciet gelezen
  // met de service-role-sleutel omdat deze Edge Function geen RLS-context
  // van de aanroeper erft.
  const { data: rolRij } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  if (rolRij?.role !== 'admin') return jsonResponse({ ok: false, error: 'Geen toegang' }, 403)

  // Stap 3 (correctieronde): de bevestigde deadline zelf ophalen — de
  // ENIGE bron voor regeling/deadline_datum/budget_status. Een onbekende,
  // uitgezette of inmiddels verwijderde deadline levert nooit een
  // verzending op, wat de client ook meestuurt.
  const { data: deadline, error: deadlineError } = await supabase.from('subsidie_deadlines').select('*').eq('id', body.deadlineId).maybeSingle()
  if (deadlineError || !deadline) return jsonResponse({ ok: false, error: 'Deadline niet gevonden' }, 404)
  if (!deadline.actief) return jsonResponse({ ok: false, error: 'Deze deadline is uitgezet en kan niet meer worden verstuurd' }, 400)

  // Stap 4 (correctieronde): het dossier + zijn subsidietrajecten opzoeken
  // en server-side verifiëren dat er daadwerkelijk een relevant, open
  // traject voor DEZE regeling bestaat — nooit vertrouwen op de matching
  // die alleen in de browser (AdminSubsidies.jsx) heeft plaatsgevonden.
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('dossier_id, status, panden(omschrijving, adres), klanten(naam, bedrijfsnaam, email), contactpersonen(naam, email)')
    .eq('dossier_id', body.dossierId)
    .maybeSingle()
  if (dossierError || !dossier) return jsonResponse({ ok: false, error: 'Dossier niet gevonden' }, 404)

  const { data: dossierSubsidies, error: dossierSubsidiesError } = await supabase.from('dossier_subsidies').select('regeling_naam, status').eq('dossier_id', body.dossierId)
  if (dossierSubsidiesError) return jsonResponse({ ok: false, error: 'Subsidietrajecten konden niet worden opgehaald' }, 500)

  if (!dossierHeeftRelevantTraject(deadline.regeling, dossierSubsidies ?? [], dossier.status)) {
    return jsonResponse({ ok: false, error: 'Dit dossier heeft geen relevant, openstaand subsidietraject voor deze regeling' }, 400)
  }

  const ontvanger = dossier.contactpersonen?.email || dossier.klanten?.email
  if (!ontvanger) return jsonResponse({ ok: false, error: 'Geen e-mailadres bekend voor dit dossier' }, 400)

  const aanhef = dossier.contactpersonen?.naam || dossier.klanten?.bedrijfsnaam || dossier.klanten?.naam || 'daar'
  const pand = dossier.panden?.omschrijving || dossier.panden?.adres || 'uw pand'
  const deadlineTekst = formatDatumNl(deadline.deadline_datum)

  const e = (v: unknown) => escapeHtml(v)
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subsidie-update van SMV Advies</title>
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
            <p style="margin:10px 0 0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#C79D55;">Subsidie-update</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;" bgcolor="#ffffff">
            <p style="margin:0 0 12px;font-size:15px;color:#1A1A1A;">Beste ${e(aanhef)},</p>
            <p style="margin:0 0 16px;font-size:14px;color:#333333;line-height:1.6;">
              Er is een update over de ${e(deadline.regeling)}-regeling die mogelijk relevant is voor het lopende subsidietraject bij ${e(pand)}.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border-radius:8px;" bgcolor="#F6EFE2">
              <tr><td style="padding:14px 16px;font-size:14px;color:#16293A;line-height:1.6;">
                ${deadlineTekst ? `<p style="margin:0 0 6px;"><strong>Deadline:</strong> ${e(deadlineTekst)}</p>` : ''}
                ${deadline.budget_status ? `<p style="margin:0;"><strong>Budgetstatus:</strong> ${e(deadline.budget_status)}</p>` : ''}
              </td></tr>
            </table>
            <p style="margin:0;font-size:14px;color:#333333;line-height:1.6;">
              Heeft u vragen over wat dit voor uw situatie betekent? Neem gerust contact met ons op.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #F0F0F0;" bgcolor="#ffffff">
            <p style="margin:0;font-size:12px;color:#52606D;">Deze update is persoonlijk voor u samengesteld door SMV Advies.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return jsonResponse({ ok: false, error: 'E-mailservice is niet geconfigureerd' }, 500)

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_ADDRESS, to: ontvanger, subject: `Subsidie-update (${deadline.regeling}) van SMV Advies`, html }),
  })

  try {
    await supabase.from('mail_log').insert({
      type: 'subsidie-deadline',
      ontvanger,
      gelukt: resendResponse.ok,
      foutmelding: resendResponse.ok ? null : `Resend-fout (status ${resendResponse.status})`,
    })
  } catch {
    // Loggen is best-effort — nooit de hoofdflow breken.
  }

  if (!resendResponse.ok) return jsonResponse({ ok: false, error: 'Verzenden via Resend is mislukt' }, 502)
  return jsonResponse({ ok: true })
})
