import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server.ts';
import { CHANGE_LABEL } from '@/lib/diff.ts';
import { fmtShort, hhmm, isoDate, parseLocal, startOfWeek } from '@/lib/dates.ts';
import type { MatchRow } from '@/lib/kit.ts';

export const dynamic = 'force-dynamic';

export default async function ChangesPage() {
  const { supabase } = await requireUser();
  const since = new Date(Date.now() - 21 * 864e5).toISOString();
  const { data } = await supabase
    .from('match_changes')
    .select('id, changed_at, field, old_value, new_value, match:matches(id, local_dt, time_tbd, category, our_team_name, rival_name, is_home, removed)')
    .gte('changed_at', since)
    .order('changed_at', { ascending: false })
    .limit(300);
  const rows = (data ?? []) as unknown as { id: number; changed_at: string; field: string; old_value: string | null; new_value: string | null; match: MatchRow | null }[];

  return (
    <main className="wrap">
      <div className="panel">
        <h2>Cambios en el calendario</h2>
        <p>Lo que la carga diaria ha detectado en las últimas 3 semanas: horarios, pabellones, rivales, colores y partidos nuevos o eliminados. Solo partidos de hoy en adelante.</p>
      </div>
      {!rows.length && <div className="empty">Sin cambios recientes.</div>}
      <ul className="list-ch">
        {rows.map((c) => {
          const m = c.match;
          const d = m ? parseLocal(m.local_dt) : null;
          const when = new Date(c.changed_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          return (
            <li key={c.id}>
              <div className="what">{CHANGE_LABEL[c.field] ?? c.field}</div>
              {m && d && (
                <Link href={`/?w=${isoDate(startOfWeek(d))}#d-${isoDate(d)}`} style={{ textDecoration: 'none' }}>
                  <div><b>{m.our_team_name}</b> {m.is_home ? 'vs' : '@'} {m.rival_name}</div>
                  <div className="meta">{m.category.replace(/^JDN - /, '')} · {fmtShort(d)} {m.time_tbd ? '' : hhmm(d)}</div>
                </Link>
              )}
              {(c.old_value || c.new_value) && <div style={{ marginTop: 4 }}>{c.old_value ?? '—'} → <b>{c.new_value ?? '—'}</b></div>}
              <div className="meta" style={{ marginTop: 4 }}>Detectado el {when}</div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
