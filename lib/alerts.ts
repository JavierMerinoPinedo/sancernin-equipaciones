import { computeKit, type Kit, type MatchRow, type Override } from './kit.ts';
import { diffDays, parseLocal, type LocalDate } from './dates.ts';

export interface UpcomingMatch { m: MatchRow; kit: Kit; days: number; when: string }
export interface Alerts { white: UpcomingMatch[]; unknown: UpcomingMatch[]; tbd: UpcomingMatch[]; count: number }

export const WHITE_HORIZON_DAYS = 60;
export const OTHER_HORIZON_DAYS = 14;
export const URGENT_DAYS = 7;

export const whenLabel = (days: number) => (days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`);

/**
 * Avisos de los partidos que quedan por jugar:
 *  - white: toca jugar de blanco.
 *  - unknown: fuera, sin color del rival; podría tocar blanco y hay que confirmarlo.
 *  - tbd: la FNB aún no ha fijado la hora.
 * `count` son los partidos con algún aviso en los próximos URGENT_DAYS días.
 */
export function buildAlerts(matches: MatchRow[], overrides: Map<string, Override>, today: LocalDate): Alerts {
  const out: Alerts = { white: [], unknown: [], tbd: [], count: 0 };
  const urgent = new Set<string>();
  for (const m of matches) {
    if (m.removed || m.local_score != null) continue;
    const days = diffDays(parseLocal(m.local_dt), today);
    if (days < 0) continue;
    const kit = computeKit(m, m.rival_team_id ? overrides.get(m.rival_team_id) : null);
    const item = { m, kit, days, when: whenLabel(days) };
    const white = kit.white && days <= WHITE_HORIZON_DAYS;
    const unknown = kit.note?.tone === 'warn' && days <= OTHER_HORIZON_DAYS;
    const tbd = m.time_tbd && days <= OTHER_HORIZON_DAYS;
    if (white) out.white.push(item);
    if (unknown) out.unknown.push(item);
    if (tbd) out.tbd.push(item);
    if ((white || unknown || tbd) && days <= URGENT_DAYS) urgent.add(m.id);
  }
  out.count = urgent.size;
  return out;
}
