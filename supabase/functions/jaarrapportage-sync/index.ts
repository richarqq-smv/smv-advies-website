import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { timingSafeEqual } from 'node:crypto'

// Fase 4 (projectplan "Klantwaarde-uitbreidingen", #6): jaarlijkse
// automatische voortgangsrapportage. Zelfde architectuur als
// rvo-subsidies-sync/index.ts (maandelijks via pg_cron/pg_net, service-
// role-client, altijd één logregel per poging) — hier toegepast op het
// bestaande dossier-/mail_log-domein i.p.v. een externe feed.
//
// BELANGRIJKE VEILIGHEIDSRANDVOORWAARDE uit het projectplan: "Eerst een
// niet-destructieve droogloop (tellen/loggen zonder echt te versturen)
// voordat de functie live en gekoppeld aan de cron gaat." Deze functie
// ondersteunt daarom een dryRun-modus (standaard AAN, zie hieronder):
// alleen bij een expliciete { "dryRun": false } in de request-body wordt
// er ook daadwerkelijk mail verstuurd en laatste_jaarrapportage_op
// bijgewerkt.
//
// CORRECTIERONDE (2026-10-19, na oplevering, interne security-review):
// deze functie draaide tot nu toe met verify_jwt:true als enige poort —
// dat bewijst alleen dat de aanroeper ÉÉN of ander geldig Supabase-JWT
// heeft, en dat kan net zo goed de PUBLIEKE anon-key zijn (die letterlijk
// in elke browserbundel staat). Zonder extra controle kon dus IEDEREEN
// met die publieke sleutel deze functie met dryRun:false aanroepen en
// echt mail laten versturen naar alle klanten, en zelfs in droogloop al
// klant-e-mailadressen/dossiernummers uitlezen. Daarom nu een EXTRA,
// eigen controle: een gedeeld intern geheim (X-Cron-Secret-header),
// vergeleken met de waarde uit Supabase Vault — opgehaald via de smalle,
// service-role-only RPC get_cron_shared_secret()
// (0058_cron_shared_secret_rpc.sql). Het geheim zelf leeft UITSLUITEND in
// Vault (willekeurig door de database zelf gegenereerd), nooit als losse
// Edge Function-secret en nooit in git/migratiebestanden — zo hoeft
// niemand dezelfde waarde handmatig op twee plekken identiek in te
// voeren. Ontbreekt het vault-geheim, of komt de header niet overeen,
// dan weigert de functie meteen met een generieke foutmelding —
// fail-closed, geen enkele dossier-/klantgegeven wordt dan gelezen of
// getoond.
//
// Deployment: zelfde opmerking als rvo-subsidies-sync/index.ts — dit
// bestand is de bron van waarheid, gedeployed via de Supabase MCP.

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'SMV Advies <noreply@mail.smv-advies.nl>'
const ACCOUNT_URL = 'https://smv-advies.nl/account'
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
 * 11 kalendermaanden geleden — bewust GEEN "11 * 30 dagen"-benadering
 * (correctieronde 2026-10-19): die benadering loopt per jaar ruim een
 * halve maand uit de pas met echte kalendermaanden, waardoor dossiers
 * stelselmatig te vroeg of te laat als kandidaat worden gezien. setUTCMonth()
 * normaliseert zelf een eventuele dag-overflow (bv. 31 maart - 11 maanden).
 */
function elfMaandenGeleden(nu = new Date()) {
  const datum = new Date(nu)
  datum.setUTCMonth(datum.getUTCMonth() - 11)
  return datum.toISOString()
}

interface DossierRij {
  dossier_id: string
  dossier_nummer: string | null
  created_at: string
  laatste_jaarrapportage_op: string | null
  energie_snapshot: { resultaat?: { huidigeKosten?: unknown; totaleBesparing?: unknown; co2?: unknown } } | null
  panden: { omschrijving: string | null; adres: string | null } | null
  klanten: { naam: string | null; bedrijfsnaam: string | null; email: string | null } | null
  contactpersonen: { naam: string | null; email: string | null } | null
}

function isBruikbaarGetal(waarde: unknown): waarde is number {
  return typeof waarde === 'number' && Number.isFinite(waarde)
}

/**
 * Letterlijke kopie van bouwEnergieKostenOverzicht() in
 * src/lib/klantOmgeving/adviesrapport.js — hier bewust los gehouden
 * (Edge Functions worden onafhankelijk van de frontend-bundel
 * gedeployed, geen gedeelde build-stap), maar functioneel identiek,
 * inclusief de correctieronde-fix: `null` zonder bruikbare Energie-
 * indicatie-data (ontbrekende/ongeldige totaleBesparing is NIET € 0 —
 * dat zou een verzonnen nulbesparing presenteren). Een echt berekende 0
 * blijft een geldige 0.
 */
function bouwBesparing(energieSnapshot: DossierRij['energie_snapshot']) {
  const resultaat = energieSnapshot?.resultaat
  if (!resultaat || !isBruikbaarGetal(resultaat.huidigeKosten) || !isBruikbaarGetal(resultaat.totaleBesparing)) return null
  const besparingPerJaar = Math.round(resultaat.totaleBesparing)
  const co2PerJaar = isBruikbaarGetal(resultaat.co2) ? Math.round(resultaat.co2) : null
  return { besparingPerJaar, co2PerJaar }
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

/**
 * Correctieronde (2026-10-19): "Het is alweer een jaar geleden sinds het
 * laatste advies" was een onjuiste/ongecontroleerde claim — deze mail kan
 * jaren achtereen naar hetzelfde dossier gaan, en "advies" is niet
 * hetzelfde moment als "aanmaak dossier" of "vorige jaarrapportage". De
 * tekst claimt nu alleen nog wat we daadwerkelijk weten: of dit de eerste
 * jaarlijkse update is sinds de start van het dossier, of een periodieke
 * update sinds de vorige.
 */
function openingszin(dossier: DossierRij, pand: string) {
  if (dossier.laatste_jaarrapportage_op) {
    return `Hierbij uw periodieke update over ${pand} sinds onze vorige jaarlijkse update.`
  }
  return `Het is inmiddels een tijd geleden sinds de start van uw adviesdossier voor ${pand}. Hieronder een kort overzicht van uw resultaten tot nu toe.`
}

function buildJaarrapportageEmail(dossier: DossierRij) {
  const e = (v: unknown) => escapeHtml(v)
  const besparing = bouwBesparing(dossier.energie_snapshot)
  const aanhef = naamVoorAanhef(dossier.klanten, dossier.contactpersonen)
  const pand = pandLabel(dossier.panden)

  const besparingBlok = besparing
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border-radius:8px;" bgcolor="#F6EFE2">
         <tr><td style="padding:16px 20px;">
           <p style="margin:0;font-size:22px;font-weight:700;color:#9D7720;">€ ${e(besparing.besparingPerJaar.toLocaleString('nl-NL'))} per jaar</p>
           <p style="margin:4px 0 0;font-size:13px;color:#52606D;">geschatte energiekostenbesparing op basis van uw advies</p>
           ${besparing.co2PerJaar != null ? `<p style="margin:10px 0 0;font-size:14px;color:#16293A;">+ ${e(besparing.co2PerJaar.toLocaleString('nl-NL'))} kg CO₂ bespaard per jaar</p>` : ''}
         </td></tr>
       </table>`
    : `<p style="font-size:14px;color:#333333;line-height:1.6;">Er is voor dit pand nog geen Energie-indicatie met kostencijfers bekend.</p>`

  const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Uw jaarlijkse update van SMV Advies</title>
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
            <p style="margin:10px 0 0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#C79D55;">Uw jaarlijkse update</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;" bgcolor="#ffffff">
            <p style="margin:0 0 12px;font-size:15px;color:#1A1A1A;">Beste ${e(aanhef)},</p>
            <p style="margin:0 0 12px;font-size:14px;color:#333333;line-height:1.6;">
              ${e(openingszin(dossier, pand))}
            </p>
            ${besparingBlok}
            <p style="margin:16px 0 0;font-size:14px;color:#333333;line-height:1.6;">
              Log in op uw account voor het volledige overzicht, inclusief de planning uit uw Meerjarenonderhoudsplan en de status van eventuele subsidies.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px;">
              <tr><td style="border-radius:8px;" bgcolor="#9D7720">
                <a href="${ACCOUNT_URL}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Bekijk mijn account</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid #F0F0F0;" bgcolor="#ffffff">
            <p style="margin:0;font-size:12px;color:#52606D;">
              U ontvangt deze jaarlijkse update omdat u een lopend adviesdossier heeft bij SMV Advies. Vragen? Neem gerust contact op via smv-advies.nl.
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
    subject: `Uw jaarlijkse update van SMV Advies — ${pand}`,
    html,
  }
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

  // Stap 1 (correctieronde): fail-closed interne authenticatie. Het
  // verwachte geheim staat NERGENS als Edge Function-secret of in git —
  // het leeft uitsluitend in Supabase Vault (willekeurig door de database
  // zelf gegenereerd) en wordt hier opgehaald via de smalle, service-role-
  // only RPC get_cron_shared_secret() (zie 0058_cron_shared_secret_rpc.sql).
  // Zonder een geconfigureerd vault-geheim, of zonder een overeenkomende
  // X-Cron-Secret-header, wordt NIETS gelezen, getoond of verstuurd — ook
  // geen droogloopresultaten, want die bevatten al klant-e-mailadressen.
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
    // Alles behalve een letterlijke `false` blijft een droogloop — de
    // veilige kant op bij een lege body, een getypte fout, of een
    // onverwachte waarde.
    dryRun = body?.dryRun !== false
  } catch {
    // Geen/ongeldige JSON-body → dryRun blijft op de veilige standaard (true).
  }

  const elfMaandenGrens = elfMaandenGeleden()

  // Kandidaten: open, niet-gearchiveerde dossiers, ouder dan 11
  // kalendermaanden (een jaarlijkse update heeft geen zin binnen het
  // eerste jaar), waarvan de laatste jaarrapportage leeg is of ook alweer
  // 11+ maanden geleden — dat laatste is de dubbel-verzend-bescherming uit
  // het projectplan.
  const { data: dossiers, error: queryError } = await supabase
    .from('dossiers')
    .select('dossier_id, dossier_nummer, created_at, laatste_jaarrapportage_op, energie_snapshot, panden(omschrijving, adres), klanten(naam, bedrijfsnaam, email), contactpersonen(naam, email)')
    .eq('status', 'open')
    .is('gearchiveerd_op', null)
    .eq('gearchiveerd_via_klant', false)
    .lte('created_at', elfMaandenGrens)
    .or(`laatste_jaarrapportage_op.is.null,laatste_jaarrapportage_op.lt.${elfMaandenGrens}`)

  if (queryError) {
    return new Response(JSON.stringify({ ok: false, error: queryError.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = Deno.env.get('RESEND_API_KEY')
  const resultaten: Array<{ dossier_id: string; dossier_nummer: string | null; ontvanger: string | null; actie: string }> = []

  for (const dossier of (dossiers ?? []) as unknown as DossierRij[]) {
    const ontvanger = ontvangerEmail(dossier.klanten, dossier.contactpersonen)
    if (!ontvanger) {
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger: null, actie: 'overgeslagen_geen_emailadres' })
      continue
    }

    const { subject, html } = buildJaarrapportageEmail(dossier)

    if (dryRun) {
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'zou_verzenden_droogloop' })
      continue
    }

    if (!apiKey) {
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'fout_geen_resend_sleutel' })
      continue
    }

    // Dubbel-verzend-bescherming (correctieronde): het veld wordt EERST
    // atomair "geclaimd" met een voorwaardelijke UPDATE (alleen als het nog
    // aan de oude voorwaarde voldeed) vóórdat er een mail wordt verstuurd.
    // Bij een gelijktijdige/herhaalde aanroep claimt maar één van de twee
    // de rij; de ander ziet 0 bijgewerkte rijen en slaat het dossier over.
    // Mislukt de verzending zelf, dan wordt de claim teruggedraaid — een
    // mislukte poging mag nooit als "verzonden" blijven staan.
    const vorigeWaarde = dossier.laatste_jaarrapportage_op
    const nu = new Date().toISOString()
    const { data: geclaimd, error: claimError } = await supabase
      .from('dossiers')
      .update({ laatste_jaarrapportage_op: nu })
      .eq('dossier_id', dossier.dossier_id)
      .or(`laatste_jaarrapportage_op.is.null,laatste_jaarrapportage_op.lt.${elfMaandenGrens}`)
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
          type: 'jaarrapportage',
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
        // Verzending mislukt → claim terugdraaien zodat dit dossier
        // kandidaat blijft voor de eerstvolgende (of een herhaalde) poging.
        await supabase.from('dossiers').update({ laatste_jaarrapportage_op: vorigeWaarde }).eq('dossier_id', dossier.dossier_id)
        resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: 'fout_resend' })
      }
    } catch (err) {
      // Eén mislukt dossier mag de rest van de batch nooit blokkeren —
      // ook hier de claim terugdraaien.
      await supabase.from('dossiers').update({ laatste_jaarrapportage_op: vorigeWaarde }).eq('dossier_id', dossier.dossier_id)
      const message = err instanceof Error ? err.message : String(err)
      resultaten.push({ dossier_id: dossier.dossier_id, dossier_nummer: dossier.dossier_nummer, ontvanger, actie: `fout_onverwacht: ${message}` })
    }
  }

  return new Response(JSON.stringify({ ok: true, dryRun, aantalKandidaten: resultaten.length, resultaten }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
