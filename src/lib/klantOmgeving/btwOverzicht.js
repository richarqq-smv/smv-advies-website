/**
 * Pure BTW-overzicht-logica: periodeberekening en aggregatie van
 * facturen/kosten tot een controleerbaar overzicht — geen I/O (zie
 * api.js voor de Supabase-query's die de ruwe facturen/kosten ophalen).
 * Nooit een fiscaal oordeel/advies — uitsluitend optellen van al
 * bestaande, door de admin vastgelegde bedragen.
 */
import { rond2 } from './offerte.js'

export const BTW_PERIODE_TYPES = [
  { id: 'maand', label: 'Maand' },
  { id: 'kwartaal', label: 'Kwartaal' },
  { id: 'jaar', label: 'Jaar' },
]

function laatsteDagVanMaand(jaar, maandIndex0) {
  const laatsteDag = new Date(jaar, maandIndex0 + 1, 0).getDate()
  return `${jaar}-${String(maandIndex0 + 1).padStart(2, '0')}-${String(laatsteDag).padStart(2, '0')}`
}

/** Start/eind (ISO-datums, inclusief) van een periode, gegeven het type en een ankerdatum (meestal "vandaag" — zie datumNaarIso in planning.js). */
export function berekenBtwPeriode(type, ankerIso) {
  const anker = new Date(ankerIso)
  const jaar = anker.getFullYear()

  if (type === 'jaar') {
    return { vanaf: `${jaar}-01-01`, tot: `${jaar}-12-31` }
  }
  if (type === 'kwartaal') {
    const kwartaal = Math.floor(anker.getMonth() / 3)
    const startMaand = kwartaal * 3
    return {
      vanaf: `${jaar}-${String(startMaand + 1).padStart(2, '0')}-01`,
      tot: laatsteDagVanMaand(jaar, startMaand + 2),
    }
  }
  // maand (standaard)
  return {
    vanaf: `${jaar}-${String(anker.getMonth() + 1).padStart(2, '0')}-01`,
    tot: laatsteDagVanMaand(jaar, anker.getMonth()),
  }
}

/** Nette periodelabel, bijv. "Q4 2026", "september 2026", "2026". */
export function formatBtwPeriodeLabel(type, ankerIso) {
  const anker = new Date(ankerIso)
  if (type === 'jaar') return String(anker.getFullYear())
  if (type === 'kwartaal') return `Q${Math.floor(anker.getMonth() / 3) + 1} ${anker.getFullYear()}`
  return anker.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

/**
 * Aggregeert facturen (omzet) en kosten tot een BTW-overzicht. Telt
 * uitsluitend facturen die daadwerkelijk zijn uitgestuurd (verzonden/
 * betaald/vervallen) mee als omzet — een concept is nooit verzonden en
 * dus geen omzet, een geannuleerde factuur is financieel nooit gebeurd.
 * Kosten tellen mee ongeacht betaalstatus (open/betaald): de
 * kostendatum bepaalt of iets in de periode valt, niet of hij al is
 * afgeschreven — geen verzonnen fiscale regel, puur optellen van wat is
 * vastgelegd.
 */
export function berekenBtwOverzicht({ facturen = [], kosten = [] }) {
  const omzetFacturen = facturen.filter((f) => ['verzonden', 'betaald', 'vervallen'].includes(f.status))
  const omzetExclBtw = rond2(omzetFacturen.reduce((som, f) => som + Number(f.subtotaal_excl_btw ?? 0), 0))
  const btwVerkoop = rond2(omzetFacturen.reduce((som, f) => som + Number(f.btw_bedrag ?? 0), 0))

  const kostenExclBtw = rond2(kosten.reduce((som, k) => som + Number(k.bedrag_excl_btw ?? 0), 0))
  const btwAftrekbaar = rond2(kosten.reduce((som, k) => som + Number(k.btw_bedrag ?? 0), 0))

  const saldo = rond2(btwVerkoop - btwAftrekbaar)

  return { omzetExclBtw, btwVerkoop, kostenExclBtw, btwAftrekbaar, saldo, facturenMeegeteld: omzetFacturen }
}
