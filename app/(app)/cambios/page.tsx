import Link from 'next/link';
import { requirePageUser } from '@/lib/supabase/server.ts';
import { loadChangeFeed } from '@/lib/data.ts';
import { CHANGE_LABEL } from '@/lib/diff.ts';
import { fmtShort, hhmm, isoDate, parseLocal, startOfWeek } from '@/lib/dates.ts';

export const dynamic = 'force-dynamic';

export default async function ChangesPage() {
  await requirePageUser();
  const rows = await loadChangeFeed(new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10));

  return (
    <main className="wrap">
      <p className="lede">Lo que la carga diaria ha detectado en las últimas 3 semanas: horarios, pabellones, rivales, colores y partidos nuevos o eliminados. Solo partidos de hoy en adelante.</p>
      {!rows.length && <div className="empty">Sin cambios recientes.</div>}
      {!!rows.length && <ul className="list-ch">
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
      </ul>}
    </main>
  );
}
