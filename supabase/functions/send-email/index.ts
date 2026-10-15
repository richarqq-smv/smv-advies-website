// Vervangt EmailJS (2026-10-14): verstuurt alle transactionele mail van de
// site (energie-indicatie lead + klantbevestiging, MJOP-analyse,
// contactformulier) via Resend — server-side, zodat geen enkele sleutel
// ooit in de browserbundel staat. RESEND_API_KEY is een Edge Function
// secret, nooit in code. Deze functie draait zonder ingelogde sessie
// (verify_jwt: false): alle 3 formulieren zijn publiek toegankelijk, net
// als de oude EmailJS-opzet die ze verving.
//
// De HTML hieronder is bewust identiek aan de 4 templates die ook in het
// Resend-dashboard staan (navy/goud-huisstijl, zelfde content/velden) —
// die dashboardtemplates dienen als visueel overzicht/back-up, maar deze
// Edge Function roept ze niet via Resend's Template-API aan: het exacte
// request-formaat (template-ID + variabelen) kon niet vanuit deze sessie
// worden geverifieerd, en een gok daarin zou productie-mailverzending
// stil kunnen laten breken. In plaats daarvan bouwt deze functie dezelfde
// HTML zelf en verstuurt 'm via het simpele, al-geteste {html, subject}-
// pad — functioneel identiek, zonder dat risico. Anders dan de Resend-
// dashboardtemplates (die Resend's eigen, niet-escapende {{{var}}}-syntax
// gebruiken) escaped deze functie elke waarde wél vóór het invoegen in
// HTML — een bewuste verbetering, geen regressie.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'
// Apart subdomein i.p.v. smv-advies.nl zelf: geen enkel risico op
// conflict met de bestaande, al werkende Porkbun-mailboxen (info@/contact@/
// richard@) op het hoofddomein — alleen dit subdomein hoeft bij Resend
// geverifieerd te worden (zie DNS-records bij Porkbun: DKIM/SPF op
// mail.smv-advies.nl, root domein ongemoeid).
const FROM_ADDRESS = 'SMV Advies <noreply@mail.smv-advies.nl>'

const BUSINESS_EMAIL = 'info@smv-advies.nl'
const CONTACT_EMAIL = 'contact@smv-advies.nl'
const MJOP_RECIPIENT_EMAIL = 'richard@smv-advies.nl'

// Alleen de eigen site mag deze functie vanuit een browser aanroepen — een
// JSON POST triggert altijd een CORS-preflight (OPTIONS), dus een
// niet-toegestane Origin wordt al vóór de preflight geblokkeerd en de
// daadwerkelijke POST (en dus de mailverzending) wordt nooit uitgevoerd.
// Dit is geen vervanging voor server-side validatie hieronder — alleen
// bescherming tegen misbruik vanaf een andere website via de browser van
// een bezoeker; een directe server-naar-server aanroep (curl, scripts)
// gaat hier sowieso niet door CORS heen, vandaar de aanvullende checks
// verderop (payload-grootte, type-allowlist, veldvalidatie).
// Geen www-variant: de site draait alleen op het kale domein (zie
// SITE_ORIGIN in scripts/prerender.mjs en elke canonical/OG/structured-
// data-referentie in de codebase) — nergens in dit project staat een
// www.smv-advies.nl-verwijzing of -redirect. Een ongebruikte, onbevestigde
// origin in de allowlist zetten zou precies ingaan tegen het doel van een
// allowlist (alleen wat daadwerkelijk legitiem is toestaan).
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

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

// Ruime bovengrens: de grootste legitieme payload (energie-lead, met de
// volledige JSON-kopie van het scanresultaat als extra veld) is in de
// praktijk een paar KB. 100 KB laat ruim marge voor lange vrije tekst
// zonder een scriptmatige aanval met een enorme body toe te staan.
const MAX_BODY_BYTES = 100_000

// Alle dynamische waarden gaan hierdoorheen vóór ze in HTML belanden —
// ook de waarden die in een <a href="mailto:..."> terechtkomen, zodat een
// rare/kwaadwillige naam of vraagtekst nooit uit een attribuut kan breken.
// Legitieme merge-velden zijn altijd string/number/undefined; dit is een
// publiek, onbeveiligd endpoint, dus een object of array (per ongeluk of
// moedwillig meegestuurd) wordt hier bewust leeg gemaakt in plaats van via
// String() te verschijnen als het onbruikbare "[object Object]".
function escapeHtml(value: unknown) {
  const safeValue = value !== null && typeof value === 'object' ? '' : value
  return String(safeValue ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type EnergieParams = Record<string, string | number | undefined>
type MjopParams = Record<string, string | undefined>
type ContactParams = Record<string, string | undefined>

function buildEnergieLeadEmail(p: EnergieParams) {
  const e = (v: unknown) => escapeHtml(v)
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Nieuwe lead binnengekomen</title>
</head>
<body style="margin:0;padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F1F4F6">
<tr>
<td align="center" style="padding:32px 16px;font-family:Arial,'Segoe UI',sans-serif;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid #E1E6EA;" bgcolor="#ffffff">
  <tr>
    <td style="background:linear-gradient(135deg,#16293A 0%,#2C4A63 100%);padding:28px 32px;text-align:center;" bgcolor="#16293A">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;"><span style="color:#C79D55;">SMV</span><span style="color:#ffffff;"> Advies</span></span>
      <p style="margin:10px 0 0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#C79D55;">Nieuwe lead binnengekomen</p>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 32px 8px;" bgcolor="#ffffff">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="44" style="vertical-align:top;">
            <div style="width:36px;height:36px;line-height:36px;text-align:center;background-color:#F6EFE2;border-radius:50%;font-size:18px;">👤</div>
          </td>
          <td style="vertical-align:top;padding-left:12px;">
            <p style="margin:0;font-size:16px;font-weight:700;color:#16293A;">${e(p.lead_naam)}</p>
            <p style="margin:2px 0 0;font-size:12.5px;color:#8E8E93;">${e(p.ingevuld_op)}</p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#52606D;">Er is een bericht binnengekomen via de website. Reageer bij voorkeur zo snel mogelijk.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 32px 4px;" bgcolor="#ffffff">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#9D7720;">Contactgegevens</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1.5px solid #E1E6EA;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:12px 18px;font-size:13px;color:#8E8E93;width:38%;border-bottom:1px solid #F0F0F0;">Naam</td>
          <td style="padding:12px 18px;font-size:14px;font-weight:600;color:#1A1A1A;border-bottom:1px solid #F0F0F0;">${e(p.lead_naam)}</td>
        </tr>
        <tr>
          <td style="padding:12px 18px;font-size:13px;color:#8E8E93;border-bottom:1px solid #F0F0F0;">E-mail</td>
          <td style="padding:12px 18px;font-size:14px;font-weight:600;color:#1A1A1A;border-bottom:1px solid #F0F0F0;">${e(p.lead_email)}</td>
        </tr>
        <tr>
          <td style="padding:12px 18px;font-size:13px;color:#8E8E93;border-bottom:1px solid #F0F0F0;">Telefoon</td>
          <td style="padding:12px 18px;font-size:14px;font-weight:600;color:#1A1A1A;border-bottom:1px solid #F0F0F0;">${e(p.lead_telefoon)}</td>
        </tr>
        <tr>
          <td style="padding:12px 18px;font-size:13px;color:#8E8E93;border-bottom:1px solid #F0F0F0;">Bedrijf</td>
          <td style="padding:12px 18px;font-size:14px;font-weight:600;color:#1A1A1A;border-bottom:1px solid #F0F0F0;">${e(p.lead_bedrijf)}</td>
        </tr>
        <tr>
          <td style="padding:12px 18px;font-size:13px;color:#8E8E93;">Pand type</td>
          <td style="padding:12px 18px;font-size:14px;font-weight:600;color:#1A1A1A;">${e(p.pand_type)}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 32px 4px;" bgcolor="#ffffff">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#9D7720;">Scanresultaat</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px;" bgcolor="#F6EFE2">
        <tr>
          <td style="padding:16px 20px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9D7720;">Status</p>
            <p style="margin:0;font-size:18px;font-weight:800;color:#16293A;">${e(p.status)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:14px 32px 4px;" bgcolor="#ffffff">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="31%" style="padding:14px 6px;text-align:center;border-radius:10px;" bgcolor="#F1F4F6">
            <p style="margin:0;font-size:16px;font-weight:800;color:#16293A;">${e(p.score)}</p>
            <p style="margin:4px 0 0;font-size:10px;font-weight:600;color:#52606D;line-height:1.35;">Score</p>
          </td>
          <td width="2%"></td>
          <td width="31%" style="padding:14px 6px;text-align:center;border-radius:10px;" bgcolor="#F1F4F6">
            <p style="margin:0;font-size:16px;font-weight:800;color:#16293A;">${e(p.huidige_kosten)}</p>
            <p style="margin:4px 0 0;font-size:10px;font-weight:600;color:#52606D;line-height:1.35;">Kosten / jaar</p>
          </td>
          <td width="2%"></td>
          <td width="32%" style="padding:14px 6px;text-align:center;border-radius:10px;" bgcolor="#F1F4F6">
            <p style="margin:0;font-size:16px;font-weight:800;color:#9D7720;">${e(p.totale_besparing)}</p>
            <p style="margin:4px 0 0;font-size:10px;font-weight:600;color:#52606D;line-height:1.35;">Besparing / jaar</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 32px 8px;" bgcolor="#ffffff">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#9D7720;">Maatregelen</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1.5px solid #E1E6EA;border-radius:10px;">
        <tr>
          <td style="padding:16px 18px;font-size:13.5px;line-height:1.7;color:#333333;white-space:pre-wrap;">${e(p.maatregelen)}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 32px 8px;" bgcolor="#ffffff">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#9D7720;">Volledige data (JSON)</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1.5px solid #E1E6EA;border-radius:10px;">
        <tr>
          <td style="padding:16px 18px;font-family:'Courier New',monospace;font-size:11.5px;line-height:1.6;color:#333333;white-space:pre-wrap;word-break:break-word;">${e(p.energie_indicatie_json)}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:22px 32px 32px;text-align:center;" bgcolor="#ffffff">
      <a href="mailto:${e(p.lead_email)}?subject=Re%3A%20je%20aanvraag%20bij%20SMV%20Advies" style="display:inline-block;background-color:#9D7720;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px;">
        Reageer op de lead
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 32px;text-align:center;border-top:1px solid #E1E6EA;" bgcolor="#F1F4F6">
      <p style="margin:0;font-size:12.5px;color:#52606D;">SMV Advies — Elke Stap Maakt Verschil</p>
    </td>
  </tr>
</table>
</td>
</tr>
</table>
</body>
</html>`
  return {
    to: BUSINESS_EMAIL,
    reply_to: typeof p.lead_email === 'string' ? p.lead_email : undefined,
    subject: `Nieuwe energie-indicatie-lead: ${p.lead_naam ?? 'onbekend'}`,
    html,
  }
}

function buildEnergieConfirmEmail(p: EnergieParams) {
  const e = (v: unknown) => escapeHtml(v)
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Uw energie-indicatie</title>
</head>
<body style="margin:0;padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F1F4F6">
<tr>
<td align="center" style="padding:32px 16px;font-family:Arial,'Segoe UI',sans-serif;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid #E1E6EA;" bgcolor="#ffffff">
  <tr>
    <td style="background:linear-gradient(135deg,#16293A 0%,#2C4A63 100%);padding:32px;text-align:center;" bgcolor="#16293A">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;"><span style="color:#C79D55;">SMV</span><span style="color:#ffffff;"> Advies</span></span>
      <p style="margin:10px 0 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C79D55;">Gratis energie-indicatie</p>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 32px 8px;" bgcolor="#ffffff">
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#1A1A1A;">Beste ${e(p.lead_naam)},</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#52606D;">
        Bedankt voor het invullen van de gratis energiescan van SMV Advies. Hieronder staat een samenvatting van uw resultaat.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 20px;" bgcolor="#ffffff">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px;" bgcolor="#F6EFE2">
        <tr>
          <td style="padding:20px 24px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#9D7720;">Uw indicatie</p>
            <p style="margin:0;font-size:20px;font-weight:800;color:#16293A;">${e(p.status)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 28px;" bgcolor="#ffffff">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;" bgcolor="#F1F4F6">
        <tr>
          <td style="padding:16px 20px;text-align:center;">
            <p style="margin:0;font-size:10.5px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#52606D;">Geschatte energiekosten / jaar</p>
            <p style="margin:6px 0 0;font-size:19px;font-weight:800;color:#16293A;">${e(p.huidige_kosten)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 32px 8px;" bgcolor="#ffffff">
      <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#16293A;">Grootste aandachtspunten</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1.5px solid #E1E6EA;border-radius:10px;">
        <tr>
          <td style="padding:16px 18px;font-size:13.5px;line-height:1.7;color:#333333;white-space:pre-wrap;">${e(p.maatregelen)}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 32px 8px;" bgcolor="#ffffff">
      <p style="margin:0;font-size:12px;line-height:1.6;color:#8E8E93;">
        Dit is een indicatie op basis van de gegevens die u heeft ingevuld, geen officieel energielabel volgens NTA 8800 en geen garantie op werkelijke besparingen of kosten.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 32px 36px;text-align:center;" bgcolor="#ffffff">
      <a href="mailto:info@smv-advies.nl?subject=Aanvraag%20gratis%20gesprek%20via%20energie-indicatie" style="display:inline-block;background-color:#9D7720;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px;">
        Plan een gratis gesprek
      </a>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px;text-align:center;border-top:1px solid #E1E6EA;" bgcolor="#F1F4F6">
      <p style="margin:0;font-size:12.5px;color:#52606D;">SMV Advies — Elke Stap Maakt Verschil</p>
    </td>
  </tr>
</table>
</td>
</tr>
</table>
</body>
</html>`
  return {
    to: typeof p.lead_email === 'string' ? p.lead_email : '',
    subject: 'Uw energie-indicatie — SMV Advies',
    html,
  }
}

function buildMjopEmail(p: MjopParams) {
  const e = (v: unknown) => escapeHtml(v)
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Nieuwe MJOP-analyse</title>
</head>
<body style="margin:0;padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F1F4F6">
  <tr>
    <td align="center" style="padding:24px 16px;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;border:1px solid #e5e5e5;" bgcolor="#ffffff">
        <tr>
          <td style="padding:24px 32px;" bgcolor="#16293a">
            <h1 style="color:#ffffff;font-size:20px;margin:0;">SMV Advies</h1>
            <p style="color:#c9a24b;font-size:13px;margin:4px 0 0 0;letter-spacing:0.05em;text-transform:uppercase;">Nieuwe MJOP-analyse</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;" bgcolor="#ffffff">
            <p style="font-size:13px;color:#6b7280;margin:0 0 24px 0;">Verzonden op ${e(p.verzonden_op)} via de interne MJOP-tool.</p>

            <h2 style="font-size:16px;color:#16293a;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin:0 0 12px 0;">Pand</h2>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#16293a;">${e(p.pand_tekst)}</div>

            <h2 style="font-size:16px;color:#16293a;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin:24px 0 12px 0;">Energie</h2>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#16293a;">${e(p.energie_tekst)}</div>

            <h2 style="font-size:16px;color:#16293a;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin:24px 0 12px 0;">Huidige situatie</h2>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#16293a;">${e(p.huidige_situatie_tekst)}</div>

            <h2 style="font-size:16px;color:#16293a;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin:24px 0 12px 0;">Onderhoud en vervanging</h2>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#16293a;">${e(p.onderhoud_tekst)}</div>

            <h2 style="font-size:16px;color:#16293a;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin:24px 0 12px 0;">Verduurzaming</h2>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#16293a;">${e(p.verduurzaming_tekst)}</div>

            <h2 style="font-size:16px;color:#16293a;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin:24px 0 12px 0;">Planning</h2>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#16293a;">${e(p.planning_tekst)}</div>

            <h2 style="font-size:16px;color:#16293a;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin:24px 0 12px 0;">Adviesoverzicht</h2>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#16293a;">${e(p.adviesoverzicht_tekst)}</div>

            <h2 style="font-size:16px;color:#16293a;border-bottom:2px solid #c9a24b;padding-bottom:6px;margin:24px 0 12px 0;">Contactgegevens</h2>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.8;color:#16293a;">
              <tr><td style="padding-right:12px;color:#6b7280;">Naam</td><td>${e(p.contact_naam)}</td></tr>
              <tr><td style="padding-right:12px;color:#6b7280;">E-mail</td><td>${e(p.contact_email)}</td></tr>
              <tr><td style="padding-right:12px;color:#6b7280;">Telefoon</td><td>${e(p.contact_telefoon)}</td></tr>
            </table>

            <p style="font-size:12px;color:#9ca3af;margin-top:32px;border-top:1px solid #e5e5e5;padding-top:16px;">
              Deze analyse is automatisch opgebouwd door de interne MJOP-tool van SMV Advies, op basis van de door de gebruiker ingevoerde gegevens. Signalering, geen bindend technisch advies.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
  return {
    to: MJOP_RECIPIENT_EMAIL,
    reply_to: typeof p.contact_email === 'string' && p.contact_email !== 'Niet opgegeven' ? p.contact_email : undefined,
    subject: 'Nieuwe MJOP-analyse via SMV Advies',
    html,
  }
}

function buildContactEmail(p: ContactParams) {
  const e = (v: unknown) => escapeHtml(v)
  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Nieuw contactformulier binnengekomen</title>
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
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;" bgcolor="#ffffff">
            <p style="margin:0;font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:#9D7720;font-weight:700;">Nieuw contactformulier binnengekomen</p>
            <h1 style="margin:6px 0 0;font-size:20px;color:#1A1A1A;">${e(p.naam)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;" bgcolor="#ffffff">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:#333333;">
              <tr><td style="padding:6px 0;width:140px;color:#52606D;">Bedrijfsnaam</td><td style="padding:6px 0;">${e(p.bedrijfsnaam)}</td></tr>
              <tr><td style="padding:6px 0;color:#52606D;">Plaats</td><td style="padding:6px 0;">${e(p.plaats)}</td></tr>
              <tr><td style="padding:6px 0;color:#52606D;">E-mailadres</td><td style="padding:6px 0;">${e(p.email)}</td></tr>
              <tr><td style="padding:6px 0;color:#52606D;">Telefoonnummer</td><td style="padding:6px 0;">${e(p.telefoon)}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 24px;" bgcolor="#ffffff">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#52606D;text-transform:uppercase;letter-spacing:.04em;">Vraag</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;" bgcolor="#F6EFE2">
              <tr><td style="padding:14px 16px;font-size:14px;color:#1A1A1A;line-height:1.5;white-space:pre-wrap;">${e(p.vraag)}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #F0F0F0;" bgcolor="#ffffff">
            <p style="margin:16px 0 0;font-size:12px;color:#52606D;">Verzonden op ${e(p.verzonden_op)} via het contactformulier op smv-advies.nl</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
  return {
    to: CONTACT_EMAIL,
    reply_to: typeof p.email === 'string' ? p.email : undefined,
    subject: `Nieuw contactformulier: ${p.naam ?? 'onbekend'}`,
    html,
  }
}

// Verificatieronde 2026-10-15: een plain object-literal als dispatch-map
// is hier aantoonbaar onveilig — `BUILDERS[body.type]` met een
// aanroeper-gestuurde `body.type` kan via JS' eigen prototypeketen
// resolven naar een geërfd lid i.p.v. `undefined`. `type: "constructor"`
// resolvet zo naar de ingebouwde `Object`-functie; `Object(body.params)`
// op een plain object retourneert het object ONGEWIJZIGD, dus
// `message = body.params` — een aanroeper kon zo `to`/`subject`/`html`/
// `reply_to` vrij zelf instellen en dit endpoint als open mailrelay
// gebruiken via SMV's eigen Resend-account. `type: "__proto__"` gaf een
// onafgevangen crash. Een `Map` heeft geen prototypeketen-probleem: elke
// sleutel (óók "constructor"/"__proto__"/"toString") is gewoon een
// losstaande, niet-gezette entry, dus `.get()` geeft daar altijd
// `undefined` voor terug.
const BUILDERS = new Map<string, (params: Record<string, unknown>) => { to: string; reply_to?: string; subject: string; html: string }>([
  ['energie-lead', buildEnergieLeadEmail as never],
  ['energie-confirm', buildEnergieConfirmEmail as never],
  ['mjop', buildMjopEmail as never],
  ['contact', buildContactEmail as never],
])

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) })
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405)
  }

  // Grove bescherming tegen misbruik van dit publieke, niet-geauthenticeerde
  // endpoint (verify_jwt: false): een Content-Length die de bovengrens al
  // overschrijdt, wordt zonder body-parse geweigerd. Een ontbrekende of
  // onjuiste header is geen garantie, dus de werkelijke bytes worden
  // hieronder nogmaals geteld vóór het JSON.parse().
  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse(req, { error: 'Aanvraag te groot' }, 413)
  }

  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return jsonResponse(req, { error: 'Ongeldige request-body' }, 400)
  }
  if (rawBody.length > MAX_BODY_BYTES) {
    return jsonResponse(req, { error: 'Aanvraag te groot' }, 413)
  }

  let body: { type?: string; params?: Record<string, unknown> }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return jsonResponse(req, { error: 'Ongeldige request-body' }, 400)
  }

  // Expliciete allowlist via Map.get() (zie het commentaar bij BUILDERS
  // hierboven): `body.type` moet letterlijk één van de 4 bekende strings
  // zijn, inclusief tegen prototypeketen-sleutels als "constructor" of
  // "__proto__" — de ontvanger van elk type ligt per builder hardcoded
  // vast, nooit afkomstig van de aanroeper.
  const builder = typeof body.type === 'string' ? BUILDERS.get(body.type) : undefined
  if (!builder) {
    return jsonResponse(req, { error: 'Onbekend mailtype' }, 400)
  }

  const message = builder(body.params ?? {})
  if (!message.to) {
    return jsonResponse(req, { error: 'Geen geldig ontvangeradres' }, 400)
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    return jsonResponse(req, { error: 'E-mailservice is niet geconfigureerd' }, 500)
  }

  const resendResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: message.to,
      reply_to: message.reply_to,
      subject: message.subject,
      html: message.html,
    }),
  })

  if (!resendResponse.ok) {
    // Resend's eigen foutdetails (kunnen configuratie-interna bevatten)
    // gaan nooit naar de aanroeper terug — alleen een generieke 502.
    return jsonResponse(req, { error: 'Verzenden via Resend is mislukt' }, 502)
  }

  return jsonResponse(req, { ok: true })
})
