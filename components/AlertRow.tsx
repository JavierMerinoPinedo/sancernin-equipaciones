import Link from 'next/link';
import type { UpcomingMatch } from '@/lib/alerts.ts';
import { fmtShort, hhmm, isoDate, parseLocal, startOfWeek, weekdayName } from '@/lib/dates.ts';
import { Shirt } from './Figures.tsx';

/** Un partido con aviso: enlaza a su tarjeta en la vista de la semana. */
export default function AlertRow({ item, kind }: { item: UpcomingMatch; kind: 'white' | 'unknown' | 'tbd' }) {
  const { m, when } = item;
  const d = parseLocal(m.local_dt);
  const day = `${weekdayName(d).slice(0, 3)} ${fmtShort(d)}`;
  return (
    <li>
      <Link prefetch={false} className={`alert-row ${kind}`} href={`/?w=${isoDate(startOfWeek(d))}#d-${isoDate(d)}`}>
        <span className="alert-ic" aria-hidden="true">
          {kind === 'white' ? <Shirt colors={['#FFFFFF']} size={24} /> : kind === 'unknown' ? '?' : '–:–'}
        </span>
        <span className="alert-txt">
          <b translate="no">{m.our_team_name} {m.is_home ? 'vs' : '@'} {m.rival_name}</b>
          <small>{day}{m.time_tbd ? '' : ` · ${hhmm(d)}`} · {m.category.replace(/^JDN - /, '')}</small>
        </span>
        <span className="alert-when">{when}</span>
      </Link>
    </li>
  );
}
