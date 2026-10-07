import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Maandelijkse RVO-subsidie-indexsync (onderzoeksronde 2026-10-07).
// Bron: https://www.rvo.nl/api/v1/opendata/subsidies — publieke,
// licentievrije (CC-0) open-data-feed, exact de brondata achter RVO's
// eigen "Subsidie- en financieringswijzer". Bevat uitsluitend titel/
// omschrijving/sector/doelgroep/link — GEEN percentages of bedragen
// (die staan niet in deze feed, alleen op de RVO-pagina's zelf).
//
// Foutafhandeling ("zonder fouten" uit de opdracht): elke aanroep
// schrijft altijd precies één rij naar rvo_sync_log (success of error).
// Bij een mislukking wordt rvo_subsidie_index NOOIT aangeraakt — de
// laatst bekende goede data blijft gewoon zichtbaar voor de admin. De
// twee database-functies (rvo_sync_vervang_index/rvo_sync_log_fout)
// zijn uitsluitend aanroepbaar door service_role (zie migratie), dus
// deze Edge Function is de enige plek die ooit schrijft.
//
// Deployment: deze file is de bron van waarheid, gedeployed via de
// Supabase MCP (geen lokale `supabase functions deploy` gebruikt in
// deze ronde) — bij een volgende wijziging hier moet opnieuw gedeployed
// worden, dit bestand update de live functie niet vanzelf.
const RVO_URL = "https://www.rvo.nl/api/v1/opendata/subsidies";
const FETCH_TIMEOUT_MS = 20000;

interface RvoRuwItem {
  id?: unknown;
  title?: unknown;
  intro?: unknown;
  url?: unknown;
  type?: unknown;
  sectors?: unknown;
  subjects?: unknown;
  targets?: unknown;
  tags?: unknown;
  changed?: unknown;
}

interface RvoGenormaliseerdItem {
  id: string;
  titel: string;
  intro: string | null;
  url: string | null;
  type: string | null;
  sectoren: unknown[];
  onderwerpen: unknown[];
  doelgroepen: unknown[];
  tags: unknown[];
  rvo_gewijzigd_op: string | null;
}

function normaliseerItem(raw: unknown): RvoGenormaliseerdItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as RvoRuwItem;
  if (typeof item.id !== "string" || typeof item.title !== "string") return null;

  return {
    id: item.id,
    titel: item.title,
    intro: typeof item.intro === "string" ? item.intro : null,
    url: typeof item.url === "string" ? item.url : null,
    type: typeof item.type === "string" ? item.type : null,
    sectoren: Array.isArray(item.sectors) ? item.sectors : [],
    onderwerpen: Array.isArray(item.subjects) ? item.subjects : [],
    doelgroepen: Array.isArray(item.targets) ? item.targets : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    rvo_gewijzigd_op: typeof item.changed === "string" ? item.changed : null,
  };
}

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(RVO_URL, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; SMVAdviesBot/1.0; +https://smv-advies.nl)",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`RVO-endpoint gaf status ${response.status} terug`);
    }

    const ruweData: unknown = await response.json();
    if (!Array.isArray(ruweData)) {
      throw new Error("RVO-endpoint gaf geen JSON-array terug (onverwacht formaat)");
    }

    const items = ruweData.map(normaliseerItem).filter((item): item is RvoGenormaliseerdItem => item !== null);
    if (items.length === 0) {
      throw new Error("Geen enkel geldig item gevonden in de RVO-respons — index niet bijgewerkt");
    }

    const { error: rpcError } = await supabase.rpc("rvo_sync_vervang_index", { p_items: items });
    if (rpcError) {
      throw new Error(`Database-fout bij opslaan: ${rpcError.message}`);
    }

    return new Response(JSON.stringify({ ok: true, aantal: items.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await supabase.rpc("rvo_sync_log_fout", { p_foutmelding: message });
    } catch {
      // Zelfs het loggen van de fout mislukte (bv. database onbereikbaar) —
      // niets meer te doen dan de fout teruggeven in de response zelf.
    }
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
