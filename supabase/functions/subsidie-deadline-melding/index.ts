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
// Deployment: zelfde opmerking als de andere Edge Functions — dit
// bestand is de bron van waarheid, gedeployed via de Supabase MCP.

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'SMV Advies <noreply@mail.smv-advies.nl>'

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

Deno.serve(async (req: Request) => {
  const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed' }, 405)

  let body: { dossierId?: string; regeling?: string; deadlineDatum?: string | null; budgetStatus?: string | null }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Ongeldige aanvraag' }, 400)
  }
  if (typeof body.dossierId !== 'string' || typeof body.regeling !== 'string') {
    return jsonResponse({ ok: false, error: 'dossierId en regeling zijn verplicht' }, 400)
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

  // Stap 3: het dossier + ontvanger opzoeken.
  const { data: dossier, error: dossierError } = await supabase
    .from('dossiers')
    .select('dossier_id, panden(omschrijving, adres), klanten(naam, bedrijfsnaam, email), contactpersonen(naam, email)')
    .eq('dossier_id', body.dossierId)
    .maybeSingle()
  if (dossierError || !dossier) return jsonResponse({ ok: false, error: 'Dossier niet gevonden' }, 404)

  const ontvanger = dossier.contactpersonen?.email || dossier.klanten?.email
  if (!ontvanger) return jsonResponse({ ok: false, error: 'Geen e-mailadres bekend voor dit dossier' }, 400)

  const aanhef = dossier.contactpersonen?.naam || dossier.klanten?.bedrijfsnaam || dossier.klanten?.naam || 'daar'
  const pand = dossier.panden?.omschrijving || dossier.panden?.adres || 'uw pand'
  const deadlineTekst = formatDatumNl(body.deadlineDatum ?? null)

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
              Er is een update over de ${e(body.regeling)}-regeling die mogelijk relevant is voor het lopende subsidietraject bij ${e(pand)}.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;border-radius:8px;" bgcolor="#F6EFE2">
              <tr><td style="padding:14px 16px;font-size:14px;color:#16293A;line-height:1.6;">
                ${deadlineTekst ? `<p style="margin:0 0 6px;"><strong>Deadline:</strong> ${e(deadlineTekst)}</p>` : ''}
                ${body.budgetStatus ? `<p style="margin:0;"><strong>Budgetstatus:</strong> ${e(body.budgetStatus)}</p>` : ''}
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
    body: JSON.stringify({ from: FROM_ADDRESS, to: ontvanger, subject: `Subsidie-update (${body.regeling}) van SMV Advies`, html }),
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
