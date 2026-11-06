import Link from 'next/link';
import { requirePageUser } from '@/lib/supabase/server.ts';
import { loadAlerts, loadChangeFeed, loadTeams } from '@/lib/data.ts';
import { CHANGE_LABEL } from '@/lib/diff.ts';
import { OTHER_HORIZON_DAYS, WHITE_HORIZON_DAYS, type UpcomingMatch } from '@/lib/alerts.ts';
import { fmtShort, hhmm, isoDate, parseLocal, startOfWeek, todayMadrid } from '@/lib/dates.ts';
import AlertRow from '@/components/AlertRow.tsx';
import TeamSelect from '@/components/TeamSelect.tsx';

export const dynamic = 'force-dynamic';

function Group({ title, help, items, kind }: { title: string; help: string; items: UpcomingMatch[]; kind: 'white' | 'unknown' | 'tbd' }) {
  if (!items.length) return null;
  return (
    <section className="alert-group">
      <h2>{title} <span className="count">{items.length}</span></h2>
      <p>{help}</p>
      <ul>{items.map((x) => <AlertRow key={x.m.id} item={x} kind={kind} />)}</ul>
    </section>
  );
}

export default async function AlertsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { team = '' } = await searchParams;
  await requirePageUser();
  const [alerts, teams, feed] = await Promise.all([
    loadAlerts(todayMadrid(), team || null),
    loadTeams(),
    loadChangeFeed(new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10)),
  ]);
  const rows = team ? feed.filter((c) => c.match?.our_team_id === team) : feed;
  const empty = !alerts.white.length && !alerts.unknown.length && !alerts.tbd.length && !rows.length;

  return (
    <>
      <section className="filters" aria-label="Filtros"><TeamSelect teams={teams} value={team} /></section>
      <main id="main" className="wrap">
        {empty && <div className="empty">Todo en orden: no hay avisos.</div>}
        <Group kind="white" title="De blanco" items={alerts.white} help={`Partidos en los que toca camiseta blanca en los próximos ${WHITE_HORIZON_DAYS} días.`} />
        <Group kind="unknown" title="Falta el color del rival" items={alerts.unknown} help={`Jugamos fuera y no sabemos su color: si viste de azul, tocaría blanco. Indícalo en la tarjeta del partido. Próximos ${OTHER_HORIZON_DAYS} días.`} />
        <Group kind="tbd" title="Hora por confirmar" items={alerts.tbd} help={`La FNB aún no ha fijado la hora. Próximos ${OTHER_HORIZON_DAYS} días.`} />
        {!!rows.length && (
          <section className="alert-group">
            <h2>Cambios detectados <span className="count">{rows.length}</span></h2>
            <p>Lo que la carga diaria ha detectado en las últimas 3 semanas: horarios, pabellones, rivales, colores y partidos nuevos o eliminados.</p>
            <ul className="list-ch">
              {rows.map((c) => {
                const m = c.match;
                const d = m ? parseLocal(m.local_dt) : null;
                const when = new Date(c.changed_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                return (
                  <li key={c.id}>
                    <div className="what">{CHANGE_LABEL[c.field] ?? c.field}</div>
                    {m && d && (
                      <Link prefetch={false} className="plain" href={`/?w=${isoDate(startOfWeek(d))}#d-${isoDate(d)}`}>
                        <div><b>{m.our_team_name}</b> {m.is_home ? 'vs' : '@'} {m.rival_name}</div>
                        <div className="meta">{m.category.replace(/^JDN - /, '')} · {fmtShort(d)} {m.time_tbd ? '' : hhmm(d)}</div>
                      </Link>
                    )}
                    {(c.old_value || c.new_value) && <div className="delta">{c.old_value ?? '—'} → <b>{c.new_value ?? '—'}</b></div>}
                    <div className="meta delta">Detectado el {when}</div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
