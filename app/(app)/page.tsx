import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server.ts';
import { loadOverrides, loadRange, loadRecentChanges, loadTeams } from '@/lib/data.ts';
import { computeKit } from '@/lib/kit.ts';
import { addDays, capitalize, diffDays, fmtLong, fmtShort, isoDate, parseDateParam, parseLocal, startOfWeek, todayMadrid } from '@/lib/dates.ts';
import { weekSummary } from '@/lib/summary.ts';
import MatchCard from '@/components/MatchCard.tsx';
import TeamSelect from '@/components/TeamSelect.tsx';
import ShareBar from '@/components/ShareBar.tsx';

export const dynamic = 'force-dynamic';

type SP = Promise<Record<string, string | undefined>>;

export default async function WeekPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const today = todayMadrid();
  const ws = startOfWeek(parseDateParam(sp.w) ?? today);
  const we = addDays(ws, 6);
  const team = sp.team ?? '';
  const awayOnly = sp.away === '1';
  const whiteOnly = sp.white === '1';

  const [all, overrides, teams] = await Promise.all([
    loadRange(supabase, `${isoDate(ws)}T00:00:00`, `${isoDate(addDays(ws, 7))}T00:00:00`, team || null),
    loadOverrides(supabase),
    loadTeams(supabase),
  ]);
  const withKit = all.map((m) => ({ m, kit: computeKit(m, m.rival_team_id ? overrides.get(m.rival_team_id) : null) }));
  const list = withKit
    .filter(({ m, kit }) => (!awayOnly || !m.is_home) && (!whiteOnly || kit.white))
    // Partidos sin hora al final de su día
    .sort((a, b) => (a.m.local_dt.slice(0, 10) + (a.m.time_tbd ? 'Z' : a.m.local_dt.slice(11))).localeCompare(b.m.local_dt.slice(0, 10) + (b.m.time_tbd ? 'Z' : b.m.local_dt.slice(11))));
  const changes = await loadRecentChanges(supabase, list.map((x) => x.m.id));

  const weeks = Math.round(diffDays(ws, startOfWeek(today)) / 7);
  const title = weeks === 0 ? 'Esta semana' : weeks === 1 ? 'Próxima semana' : weeks === -1 ? 'Semana pasada' : weeks > 0 ? `Dentro de ${weeks} semanas` : `Hace ${-weeks} semanas`;
  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string | null> = { w: isoDate(ws), team: team || null, away: awayOnly ? '1' : null, white: whiteOnly ? '1' : null, ...patch };
    Object.entries(cur).forEach(([k, v]) => v && p.set(k, v));
    return `/?${p.toString()}`;
  };

  const away = list.filter((x) => !x.m.is_home).length;
  const white = list.filter((x) => x.kit.white).length;
  let lastDay = '';

  return (
    <>
      <div className="period">
        <Link className="arrow" href={qs({ w: isoDate(addDays(ws, -7)) })} aria-label="Semana anterior">‹</Link>
        <div className="lbl">
          <b>{title}</b>
          <span>{fmtShort(ws)} – {fmtShort(we)}</span>
          {weeks !== 0 && <><br /><Link href={qs({ w: null })}>Volver a esta semana</Link></>}
        </div>
        <Link className="arrow" href={qs({ w: isoDate(addDays(ws, 7)) })} aria-label="Semana siguiente">›</Link>
      </div>
      <div className="filters">
        <TeamSelect teams={teams} value={team} />
        <Link className={`chip ${awayOnly ? 'on' : ''}`} href={qs({ away: awayOnly ? null : '1' })}>Solo fuera</Link>
        <Link className={`chip ${whiteOnly ? 'on' : ''}`} href={qs({ white: whiteOnly ? null : '1' })}>Solo blanco</Link>
      </div>
      <main className="wrap">
        {!all.length ? (
          <div className="empty">No hay partidos del club esta semana.</div>
        ) : (
          <>
            <div className="stats">
              <span><b>{list.length}</b> partidos</span>·<span><b>{list.length - away}</b> en casa</span>·<span><b>{away}</b> fuera</span>·<span><b>{white}</b> de blanco</span>
            </div>
            {!list.length && <div className="empty">Ningún partido con estos filtros.</div>}
            {list.map(({ m }) => {
              const d = parseLocal(m.local_dt);
              const day = fmtLong(d);
              const header = day !== lastDay ? <div className="day" id={`d-${isoDate(d)}`}>{capitalize(day)}</div> : null;
              lastDay = day;
              return (
                <div key={m.id}>
                  {header}
                  <MatchCard m={m} override={m.rival_team_id ? overrides.get(m.rival_team_id) : null} changes={changes.get(m.id)} />
                </div>
              );
            })}
          </>
        )}
      </main>
      <ShareBar text={weekSummary(list.map((x) => x.m), overrides, ws, we)} />
    </>
  );
}
