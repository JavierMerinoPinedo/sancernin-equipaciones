import { computeKit, type MatchRow, type Override } from './kit.ts';
import { capitalize, fmtLong, fmtShort, hhmm, parseLocal, type LocalDate } from './dates.ts';

export function weekSummary(matches: MatchRow[], overrides: Map<string, Override>, from: LocalDate, to: LocalDate): string {
  let s = `🏀 *SAN CERNIN · Equipaciones*\n${fmtShort(from)} – ${fmtShort(to)}\n`;
  let last = '';
  for (const m of matches) {
    const dt = parseLocal(m.local_dt);
    const day = fmtLong(dt);
    if (day !== last) { s += `\n*${capitalize(day)}*\n`; last = day; }
    const kit = computeKit(m, m.rival_team_id ? overrides.get(m.rival_team_id) : null);
    const kitTxt = kit.white ? '⚪ BLANCO / 🔵 azul' : '🔵 AZUL / 🔵 azul';
    const where = m.is_home ? 'casa' : (m.field_name ?? 'fuera');
    s += `• ${m.time_tbd ? '--:--' : hhmm(dt)} ${m.category.replace(/^JDN - /, '')} – ${m.our_team_name} ${m.is_home ? 'vs' : '@'} ${m.rival_name} (${where})\n   👕 ${kitTxt}\n`;
  }
  if (!matches.length) s += '\nSin partidos.';
  return s;
}
