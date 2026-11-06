import { computeKit, type MatchRow, type Override } from './kit.ts';
import { capitalize, fmtLong, fmtShort, hhmm, isoDate, parseLocal, type LocalDate } from './dates.ts';

/** Mensaje de WhatsApp: los equipos que juegan de blanco en los partidos que quedan. Sin ninguno, null. */
export function whiteSummary(matches: MatchRow[], overrides: Map<string, Override>, from: LocalDate, to: LocalDate, today: LocalDate): string | null {
  const pending = matches.filter((m) => m.local_score == null && m.local_dt.slice(0, 10) >= isoDate(today)
    && computeKit(m, m.rival_team_id ? overrides.get(m.rival_team_id) : null).white);
  if (!pending.length) return null;
  let s = `🏀 *SAN CERNIN · Equipaciones*\n⚪ Juegan de blanco · ${fmtShort(from)} – ${fmtShort(to)}\n`;
  let last = '';
  for (const m of pending) {
    const dt = parseLocal(m.local_dt);
    const day = fmtLong(dt);
    if (day !== last) { s += `\n*${capitalize(day)}*\n`; last = day; }
    s += `• ${m.time_tbd ? '--:--' : hhmm(dt)} ${m.category.replace(/^JDN - /, '')} – ${m.our_team_name}\n`;
  }
  return s;
}
