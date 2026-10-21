# Herkomst van de projectskills

| Skill | Bron | Commit | Licentie |
| --- | --- | --- | --- |
| `pro-design` | eigen (SMV Advies) | — | — |
| `taste-skill` | https://github.com/Leonxlnx/taste-skill (`skills/taste-skill`) | `6010f91` | MIT (`taste-skill/LICENSE`) |
| `impeccable` | https://github.com/pbakaus/impeccable (`.claude/skills/impeccable`) | `dad8dbb` | Apache-2.0 (`impeccable/LICENSE`, `impeccable/NOTICE.md`) |
| `web-interface-guidelines` | https://github.com/vercel-labs/web-interface-guidelines (`command.md`) | `434b7f9` | MIT (`web-interface-guidelines/LICENSE`) |
| `playwright-cli` | https://github.com/microsoft/playwright-cli (`skills/playwright-cli`) | `b1a5903` | Apache-2.0 (`playwright-cli/LICENSE`) |

Ongewijzigd overgenomen (alleen `web-interface-guidelines/SKILL.md` kreeg skill-frontmatter boven
de originele `command.md`-tekst). SMV-specifieke afspraken staan in `pro-design/SKILL.md` en in
`DESIGN.md` in de root. `DESIGN.md` volgt de indeling van
https://github.com/VoltAgent/awesome-design-md (MIT, commit `3b60532`).

Bijwerken: opnieuw kopiëren uit de bronrepo en de commit hierboven aanpassen. `impeccable`'s
launcher (`scripts/impeccable`) downloadt bij eerste gebruik een eigen binary; zonder netwerk valt
de skill terug op het direct lezen van `DESIGN.md`.
