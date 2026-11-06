import Link from 'next/link';
import type { UpcomingMatch } from '@/lib/alerts.ts';
import AlertRow from './AlertRow.tsx';

const VISIBLE = 3;

/** Panel de la semana: los próximos partidos en los que toca ir de blanco. */
export default function WhiteAlert({ items }: { items: UpcomingMatch[] }) {
  if (!items.length) return <p className="white-none">Sin partidos de blanco en los próximos 60 días.</p>;
  return (
    <section className="white-alert" aria-label="Próximos partidos de blanco">
      <div className="white-head">
        <h2>Próximos de blanco</h2>
        <Link href="/avisos">{items.length > VISIBLE ? `Ver los ${items.length}` : 'Ver avisos'}</Link>
      </div>
      <ul>{items.slice(0, VISIBLE).map((x) => <AlertRow key={x.m.id} item={x} kind="white" />)}</ul>
    </section>
  );
}
