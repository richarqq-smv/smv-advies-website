import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole voor implementatieronde 2026-10-12, punt 2: Gold-klanten
 * krijgen een read-only weergave van hun subsidiebegeleiding, niet-Gold-
 * klanten een upgrade-teaser. Database-garantie (klant ziet alleen eigen
 * dossierdata, geen schrijftoegang) is al live geverifieerd via Supabase
 * MCP (eigen klant/vreemde geauthenticeerde gebruiker/admin/insert-poging)
 * — dit bestand controleert alleen dat de brontekst dat ontwerp weerspiegelt.
 */
const MIGRATIE = readFileSync('supabase/migrations/0047_subsidie_klant_gold_inzicht.sql', 'utf8')
const KLANT_COMPONENT = readFileSync('src/components/klantOmgeving/DossierSubsidiesKlantWeergave.jsx', 'utf8')
const DOSSIER_DETAIL = readFileSync('src/pages/DossierDetail.jsx', 'utf8')

test('migratie 0047: klant-select op dossier_subsidies is alleen SELECT, gescoped op eigen dossier via is_member_of_klant', () => {
  assert.match(MIGRATIE, /create policy dossier_subsidies_select_klant on public\.dossier_subsidies for select/)
  assert.match(MIGRATIE, /is_member_of_klant\(d\.klant_id\)/)
  assert.doesNotMatch(MIGRATIE, /for insert|for update|for delete/)
})

test('migratie 0047: klant-select op dossier_taken is beperkt tot categorie \'subsidie\' (niet \'oplevering\')', () => {
  assert.match(MIGRATIE, /create policy dossier_taken_select_klant_subsidie on public\.dossier_taken for select/)
  assert.match(MIGRATIE, /categorie = 'subsidie'/)
})

test('DossierSubsidiesKlantWeergave.jsx is puur lezend: geen enkele mutatie-/admin-only-functie geïmporteerd', () => {
  const importRegel = KLANT_COMPONENT.match(/^import \{[\s\S]*?\} from '\.\.\/\.\.\/lib\/klantOmgeving\/api'/m)[0]
  assert.match(importRegel, /listDossierSubsidies/)
  assert.match(importRegel, /listDossierTaken/)
  // Geen schrijf-/koppelfuncties, en geen admin-only subsidiespecificaties/
  // RVO-referentielijst (die vereisen een andere, nog steeds admin-only RLS).
  ;['addDossierSubsidie', 'updateDossierSubsidie', 'removeDossierSubsidie', 'koppelSubsidieMaatregel', 'koppelSubsidieDocument', 'adminListRvoSubsidieIndex', 'listDossierSubsidieSpecificaties', 'addDossierTaak', 'updateDossierTaak', 'removeDossierTaak'].forEach((fn) => {
    assert.doesNotMatch(importRegel, new RegExp(fn))
  })
})

test('DossierSubsidiesKlantWeergave.jsx filtert dossier_taken op categorie \'subsidie\' client-side (consistent met de RLS-policy)', () => {
  assert.match(KLANT_COMPONENT, /takenRijen\.filter\(\(t\) => t\.categorie === 'subsidie'\)/)
})

test('DossierDetail.jsx: Gold-klant krijgt de read-only subsidieweergave, niet-Gold-klant een upgrade-teaser, beide op #subsidies-sectie', () => {
  assert.match(DOSSIER_DETAIL, /\) : dossier\.pakket_id === 'gold' \? \(/)
  assert.match(DOSSIER_DETAIL, /<DossierSubsidiesKlantWeergave dossierId=\{dossier\.dossier_id\} \/>/)
  assert.match(DOSSIER_DETAIL, /Upgrade naar Gold voor de subsidie-inzichten\./)
  assert.match(DOSSIER_DETAIL, /<div id="subsidies-sectie" className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">/)
  assert.match(DOSSIER_DETAIL, /to=\{ROUTES\.pakketAnchor\('gold'\)\}/)
})
