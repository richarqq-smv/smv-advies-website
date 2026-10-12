import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

/**
 * Broncontrole voor implementatieronde 2026-10-12, punt 7 (klantreis
 * UX-fixes 7A t/m 7E uit de klantreis-ux-audit-2026-10-12).
 */
const energieDossierKoppelingJsx = readFileSync('src/components/klantOmgeving/EnergieDossierKoppeling.jsx', 'utf8')
const energieSnapshotJsx = readFileSync('src/components/klantOmgeving/EnergieSnapshot.jsx', 'utf8')
const mjopToolJsx = readFileSync('src/pages/MjopTool.jsx', 'utf8')
const inloggenJsx = readFileSync('src/pages/Inloggen.jsx', 'utf8')
const registrerenJsx = readFileSync('src/pages/Registreren.jsx', 'utf8')
const veiligeRedirectJs = readFileSync('src/lib/auth/veiligeRedirect.js', 'utf8')
const accountJsx = readFileSync('src/pages/Account.jsx', 'utf8')
const offerteJs = readFileSync('src/lib/klantOmgeving/offerte.js', 'utf8')
const offertesHistorieJsx = readFileSync('src/components/klantOmgeving/OffertesHistorie.jsx', 'utf8')
const offertePreviewJsx = readFileSync('src/pages/OffertePreview.jsx', 'utf8')

test('7A: EnergieDossierKoppeling.jsx toont een inlog/registreer-CTA aan een anonieme bezoeker i.p.v. niets', () => {
  assert.match(energieDossierKoppelingJsx, /if \(authLaden\) return null/)
  assert.match(energieDossierKoppelingJsx, /if \(!user\) \{/)
  assert.match(energieDossierKoppelingJsx, /om dit resultaat te bewaren bij een dossier\./)
})

test('7A: EnergieSnapshot.jsx heeft dezelfde indicatie-disclaimer als de publieke resultaatpagina', () => {
  assert.match(energieSnapshotJsx, /dit is een indicatie, geen officieel energielabel en geen garantie/)
})

test('7A/7E: MjopTool.jsx noemt zichzelf niet langer "Intern adviesinstrument" op de klantroute', () => {
  assert.doesNotMatch(mjopToolJsx, /eyebrow="Intern adviesinstrument"/)
  assert.doesNotMatch(mjopToolJsx, /description="Intern adviesinstrument/)
})

test('7B: Inloggen.jsx valideert de redirectbestemming met veiligeInterneBestemming() (geen open redirect)', () => {
  assert.match(inloggenJsx, /import \{ veiligeInterneBestemming \} from '\.\.\/lib\/auth\/veiligeRedirect'/)
  assert.match(inloggenJsx, /navigate\(veiligeInterneBestemming\(location\.state\?\.van\) \?\? ROUTES\.home\)/)
})

test('veiligeRedirect.js weigert een extern/protocol-relative pad', () => {
  assert.match(veiligeRedirectJs, /pad\.startsWith\('\/\/'\)/)
  assert.match(veiligeRedirectJs, /!pad\.startsWith\('\/'\)/)
})

test('7B: Inloggen.jsx ↔ Registreren.jsx geven location.state aan elkaar door (geen verloren bestemming)', () => {
  assert.match(inloggenJsx, /<Link to=\{ROUTES\.registreren\} state=\{location\.state\}/)
  assert.match(registrerenJsx, /<Link to=\{ROUTES\.inloggen\} state=\{location\.state\}/)
})

test('7B: Account.jsx vult naam/bedrijfsnaam voor uit user_metadata, overschrijft nooit een al ingevulde waarde', () => {
  assert.match(accountJsx, /naam: v\.naam \|\| user\.user_metadata\?\.naam \|\| ''/)
  assert.match(accountJsx, /bedrijfsnaam: v\.bedrijfsnaam \|\| user\.user_metadata\?\.bedrijfsnaam \|\| ''/)
})

test('7C: Account.jsx toont een laad- en foutstatus bij "Adviesdossier openen"', () => {
  assert.match(accountJsx, /dossierOpenenBezigPandId === pand\.pand_id \? 'Bezig\.\.\.' : 'Adviesdossier openen'/)
  assert.match(accountJsx, /Adviesdossier openen is niet gelukt\. Probeer het opnieuw\./)
})

test('7A: Account.jsx geeft de MJOP-link dossiercontext mee wanneer er al een dossier voor dat pand bestaat', () => {
  assert.match(accountJsx, /voegDossierContextToe\(ROUTES\.mjopTool, dossiers\.find\(\(d\) => d\.pand_id === pand\.pand_id\)\?\.dossier_id\)/)
})

test('7D: offerte.js is de enige bron voor offerte-statuslabels (OFFERTE_STATUS_LABELS), geen dubbele kopie meer', () => {
  assert.match(offerteJs, /export const OFFERTE_STATUS_LABELS = Object\.fromEntries/)
  assert.match(accountJsx, /OFFERTE_STATUS_LABELS \} from '\.\.\/lib\/klantOmgeving\/offerte'/)
  assert.doesNotMatch(accountJsx, /const OFFERTE_STATUS_LABELS = \{/)
  assert.match(offertesHistorieJsx, /import \{[^}]*OFFERTE_STATUS_LABELS[^}]*\} from '\.\.\/\.\.\/lib\/klantOmgeving\/offerte'/)
  assert.doesNotMatch(offertesHistorieJsx, /const STATUS_LABELS = \{/)
})

test('7D: OffertePreview.jsx toont een acceptatie-instructie met een echt bestaand contactkanaal bij concept/verstuurd', () => {
  assert.match(offertePreviewJsx, /import \{ COMPANY \} from '\.\.\/data\/company'/)
  assert.match(offertePreviewJsx, /offerte\.status === 'concept' \|\| offerte\.status === 'verstuurd'/)
  assert.match(offertePreviewJsx, /mailto:\$\{COMPANY\.contactEmail\}/)
})
