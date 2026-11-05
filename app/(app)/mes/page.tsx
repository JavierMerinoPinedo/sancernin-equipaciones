import { Suspense } from 'react';
import Link from 'next/link';
import { requirePageUser } from '@/lib/supabase/server.ts';
import { loadOverrides, loadRange, loadTeams } from '@/lib/data.ts';
import { computeKit } from '@/lib/kit.ts';
import { addDays, capitalize, isoDate, monthName, sameDay, startOfWeek, todayMadrid, type LocalDate } from '@/lib/dates.ts';
import LinkPending from '@/components/LinkPending.tsx';
import TeamSelect from '@/components/TeamSelect.tsx';
import Loading from '../loading.tsx';

export const dynamic = 'force-dynamic';

const ym = (d: LocalDate) => `${d.y}-${String(d.m).padStart(2, '0')}`;

export default async function MonthPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const today = todayMadrid();
  const r = /^(\d{4})-(\d{2})$/.exec(sp.m ?? '');
  const y = r ? +r[1] : today.y;
  const mo = r ? +r[2] : today.m;
  const team = sp.team ?? '';
  const nextMonth: LocalDate = mo === 12 ? { y: y + 1, m: 1, d: 1 } : { y, m: mo + 1, d: 1 };
  const prevMonth: LocalDate = mo === 1 ? { y: y - 1, m: 12, d: 1 } : { y, m: mo - 1, d: 1 };
  const teamQs = team ? `&team=${encodeURIComponent(team)}` : '';

  return (
    <>
      <div className="period">
        <Link className="arrow" href={`/mes?m=${ym(prevMonth)}${teamQs}`} aria-label="Mes anterior">‹<LinkPending /></Link>
        <div className="lbl"><b>{capitalize(monthName(mo))} {y}</b></div>
        <Link className="arrow" href={`/mes?m=${ym(nextMonth)}${teamQs}`} aria-label="Mes siguiente">›<LinkPending /></Link>
      </div>
      <Suspense key={`${y}-${mo}|${team}`} fallback={<Loading />}>
        <MonthBody y={y} mo={mo} team={team} today={today} nextMonth={nextMonth} teamQs={teamQs} />
      </Suspense>
    </>
  );
}

async function MonthBody({ y, mo, team, today, nextMonth, teamQs }: { y: number; mo: number; team: string; today: LocalDate; nextMonth: LocalDate; teamQs: string }) {
  await requirePageUser();
  const first: LocalDate = { y, m: mo, d: 1 };
  const gridStart = startOfWeek(first);
  const weeks = Math.ceil((Math.round((Date.UTC(nextMonth.y, nextMonth.m - 1, 1) - Date.UTC(gridStart.y, gridStart.m - 1, gridStart.d)) / 864e5)) / 7);
  const gridEnd = addDays(gridStart, weeks * 7);

  const [matches, overrides, teams] = await Promise.all([
    loadRange(`${isoDate(gridStart)}T00:00:00`, `${isoDate(gridEnd)}T00:00:00`, team || null),
    loadOverrides(),
    loadTeams(),
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
  const monthMatches = matches.filter((m) => m.local_dt.startsWith(ym(first)));
  const whiteTotal = monthMatches.filter((m) => computeKit(m, m.rival_team_id ? overrides.get(m.rival_team_id) : null).white).length;

  return (
    <>
      <div className="filters"><TeamSelect teams={teams} value={team} /></div>
      <main className="wrap">
        <div className="stats"><div><span><b>{monthMatches.length}</b> partidos</span>·<span><b>{whiteTotal}</b> de blanco</span></div></div>
        <div className="month">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => <div key={d} className="wd">{d}</div>)}
          {Array.from({ length: weeks * 7 }, (_, i) => {
            const d = addDays(gridStart, i);
            const k = isoDate(d);
            const e = byDay.get(k);
            const cls = ['cell', d.m !== mo ? 'out' : '', sameDay(d, today) ? 'today' : '', e ? 'has' : ''].join(' ');
            const href = `/?w=${isoDate(startOfWeek(d))}${teamQs}#d-${k}`;
            return (
              <Link key={k} href={href} className={cls} prefetch={false}>
                <span className="n">{d.d}</span>
                {e?.blue ? <span className="c"><i className="d blue" />{e.blue}</span> : null}
                {e?.white ? <span className="c"><i className="d white" />{e.white}</span> : null}
              </Link>
            );
          })}
        </div>
        <div className="legend">
          <span><i className="d blue" /> Azul</span>
          <span><i className="d white" /> Blanco</span>
          <span>Toca un día para ver sus partidos</span>
        </div>
      </main>
    </>
  );
}
