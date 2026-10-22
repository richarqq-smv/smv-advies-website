# Opdracht voor de wekelijkse SEO-check

Plak de tekst onder de streep als prompt in een geplande taak in Claude Code (claude.ai/code),
met deze instellingen:

- **Repository:** `richarqq-smv/smv-advies-website` (moet gekoppeld zijn, anders kan de taak niet pushen)
- **Omgeving:** Default (daar staat het Search Console-geheim)
- **Schema:** wekelijks, maandag 07:38 (Europe/Amsterdam)

---

Tijd voor de wekelijkse SEO-check van smv-advies.nl. Werk in het Nederlands, in de repo `richarqq-smv/smv-advies-website` die in deze sessie is uitgecheckt.

Begin met `git fetch origin && git checkout main && git pull` en maak dan een nieuwe branch `seo/weekcheck-JJJJ-MM-DD` (de datum van vandaag) vanaf `main`.

Lees eerst: `CLAUDE.md`, `seo/README.md` (instellingen, toegang en spelregels), `.claude/skills/pro-design/SKILL.md` en `DESIGN.md`. Lees ook het meest recente rapport in `seo/rapporten/` en de bijbehorende data in `seo/data/`. Daarmee vergelijk je.

Search Console: deze omgeving voegt zelf een Google-token toe aan verzoeken naar searchconsole.googleapis.com (alleen-lezen serviceaccount). Gebruik curl:
- `GET https://searchconsole.googleapis.com/webmasters/v3/sites` (controle)
- `POST https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Asmv-advies.nl/searchAnalytics/query`. Periode: de laatste 28 dagen die eindigen 3 dagen voor vandaag. Haal totalen op, per query, per page en per query+page.
- `GET …/sites/sc-domain%3Asmv-advies.nl/sitemaps`
- `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` voor elke URL uit de sitemap die `npm ci && npm run build` oplevert in `dist/sitemap.xml`. Gebruik voor de build de env-variabelen `VITE_SUPABASE_URL=http://127.0.0.1:59999 VITE_SUPABASE_ANON_KEY=dummy-local`; die zijn alleen nodig om lokaal te bouwen.
Werkt de API niet (401/403)? Meld dat in het rapport en ga verder met de technische check. Verzin nooit cijfers.

Doe daarna:
1. **Technisch:** controleer in de prerendered HTML in `dist/` per pagina: `robots`, canonical, title (uniek, ≤ 60 tekens), meta description (uniek, 70–160 tekens), één H1, interne links die naar een bestaande route wijzen, en of alle routes in de sitemap staan. Repareer echte fouten.
2. **Pagina 2:** zoekopdrachten met positie 8–25 en minstens 3 vertoningen. Lees per zoekopdracht de bijbehorende pagina en stel concrete verbeteringen voor: titel, beschrijving, een kopje, een alinea die de vraag beantwoordt, interne links. Voer maximaal 3 tekstverbeteringen per week door. Gebruik alleen feiten die al op de site of in `src/data/` staan. Geen nieuwe claims, cijfers, klanten, reviews of prijzen. Blijf binnen `DESIGN.md`; verander geen opmaak.
3. **Indexering:** vergelijk het aantal geïndexeerde URL's met vorige week. Noem welke pagina's Richard via URL-inspectie in de Search Console-interface moet laten indexeren.
4. Schrijf `seo/rapporten/JJJJ-MM-DD.md` (zelfde opzet als het vorige rapport, met de verschillen ten opzichte van vorige week) en `seo/data/JJJJ-MM-DD.json` met de ruwe cijfers.

Controleer na codewijzigingen: `npm test`, `npm run lint` en `npm run build` moeten groen zijn. Commit, push de branch en open een pull request naar `main` met een korte samenvatting in gewoon Nederlands. Bovenaan staan de drie belangrijkste cijfers en wat Richard zelf moet doen. **Merge nooit zelf.** Wijzig niets aan Supabase, de database, de admin-/klantomgeving, routes of businesslogica. Is er niets te verbeteren? Commit dan alleen het rapport en de data en zeg dat in de pull request. Lukt pushen of het openen van de pull request niet, meld dan precies welke stap faalde en met welke foutmelding.
