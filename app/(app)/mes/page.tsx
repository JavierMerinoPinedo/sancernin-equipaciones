import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server.ts';
import { loadOverrides, loadRange, loadTeams } from '@/lib/data.ts';
import { computeKit } from '@/lib/kit.ts';
import { addDays, capitalize, isoDate, monthName, sameDay, startOfWeek, todayMadrid, type LocalDate } from '@/lib/dates.ts';
import TeamSelect from '@/components/TeamSelect.tsx';

export const dynamic = 'force-dynamic';

export default async function MonthPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const today = todayMadrid();
  const r = /^(\d{4})-(\d{2})$/.exec(sp.m ?? '');
  const y = r ? +r[1] : today.y;
  const mo = r ? +r[2] : today.m;
  const team = sp.team ?? '';
  const first: LocalDate = { y, m: mo, d: 1 };
  const gridStart = startOfWeek(first);
  const nextMonth: LocalDate = mo === 12 ? { y: y + 1, m: 1, d: 1 } : { y, m: mo + 1, d: 1 };
  const prevMonth: LocalDate = mo === 1 ? { y: y - 1, m: 12, d: 1 } : { y, m: mo - 1, d: 1 };
  const weeks = Math.ceil((Math.round((Date.UTC(nextMonth.y, nextMonth.m - 1, 1) - Date.UTC(gridStart.y, gridStart.m - 1, gridStart.d)) / 864e5)) / 7);
  const gridEnd = addDays(gridStart, weeks * 7);

  const [matches, overrides, teams] = await Promise.all([
    loadRange(supabase, `${isoDate(gridStart)}T00:00:00`, `${isoDate(gridEnd)}T00:00:00`, team || null),
    loadOverrides(supabase),
    loadTeams(supabase),
  ]);
  const byDay = new Map<string, { blue: number; white: number; home: number }>();
  for (const m of matches) {
    const k = m.local_dt.slice(0, 10);
    const kit = computeKit(m, m.rival_team_id ? overrides.get(m.rival_team_id) : null);
    const e = byDay.get(k) ?? { blue: 0, white: 0, home: 0 };
    if (kit.white) e.white++; else e.blue++;
    if (m.is_home) e.home++;
    byDay.set(k, e);
  }
  const ym = (d: LocalDate) => `${d.y}-${String(d.m).padStart(2, '0')}`;
  const teamQs = team ? `&team=${encodeURIComponent(team)}` : '';
  const monthMatches = matches.filter((m) => m.local_dt.startsWith(ym(first)));
  const whiteTotal = monthMatches.filter((m) => computeKit(m, m.rival_team_id ? overrides.get(m.rival_team_id) : null).white).length;

  return (
    <>
      <div className="period">
        <Link className="arrow" href={`/mes?m=${ym(prevMonth)}${teamQs}`} aria-label="Mes anterior">‹</Link>
        <div className="lbl">
          <b>{capitalize(monthName(mo))} {y}</b>
          <span>{monthMatches.length} partidos · {whiteTotal} de blanco</span>
        </div>
        <Link className="arrow" href={`/mes?m=${ym(nextMonth)}${teamQs}`} aria-label="Mes siguiente">›</Link>
      </div>
      <div className="filters"><TeamSelect teams={teams} value={team} /></div>
      <main className="wrap">
        <div className="month">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <div key={d} className="wd">{d}</div>)}
          {Array.from({ length: weeks * 7 }, (_, i) => {
            const d = addDays(gridStart, i);
            const k = isoDate(d);
            const e = byDay.get(k);
            const cls = ['cell', d.m !== mo ? 'out' : '', sameDay(d, today) ? 'today' : '', e ? 'has' : ''].join(' ');
            const href = `/?w=${isoDate(startOfWeek(d))}${teamQs}#d-${k}`;
            return (
              <Link key={k} href={href} className={cls}>
                <span className="n">{d.d}</span>
                {e?.blue ? <span className="c"><i className="d" style={{ background: '#0b1f5c' }} />{e.blue}</span> : null}
                {e?.white ? <span className="c"><i className="d" style={{ background: '#fff' }} />{e.white}</span> : null}
              </Link>
            );
          })}
        </div>
        <div className="legend">
          <span><i className="d" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, border: '1px solid #334155', background: '#0b1f5c' }} /> Azul</span>
          <span><i className="d" style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, border: '1px solid #334155', background: '#fff' }} /> Blanco</span>
          <span>Toca un día para ver sus partidos</span>
        </div>
      </main>
    </>
  );
}
