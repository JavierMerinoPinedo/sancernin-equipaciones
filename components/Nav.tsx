'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PullToRefresh from './PullToRefresh.tsx';

const LINKS = [
  { href: '/', label: 'Semana', icon: 'M4 5.5h16M7 3v4m10-4v4M4.75 5h14.5c.414 0 .75.336.75.75v13.5a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1-.75-.75V5.75C4 5.336 4.336 5 4.75 5ZM4 10h16M8 14h8' },
  { href: '/mes', label: 'Mes', icon: 'M4.75 4h14.5c.414 0 .75.336.75.75v14.5a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1-.75-.75V4.75C4 4.336 4.336 4 4.75 4ZM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16' },
  { href: '/avisos', label: 'Avisos', icon: 'M6 10a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10ZM10 20a2.2 2.2 0 0 0 4 0' },
  { href: '/ajustes', label: 'Ajustes', icon: 'M4 7h9m4 0h3M4 17h3m4 0h9M15 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM9 14.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z' },
];

const isActive = (href: string, path: string) => (href === '/' ? path === '/' : path.startsWith(href));

export default function Nav() {
  const path = usePathname();
  const [alerts, setAlerts] = useState(0);
  const [pulls, setPulls] = useState(0);
  const pulled = useCallback(() => setPulls((n) => n + 1), []);
  useEffect(() => {
    fetch('/api/alerts', { cache: pulls ? 'reload' : 'default' }).then((r) => (r.ok ? r.json() : null)).then((d) => setAlerts(d?.count ?? 0)).catch(() => { /* sin contador */ });
  }, [path, pulls]);
  const title = LINKS.find((l) => isActive(l.href, path))?.label ?? 'San Cernin';
  return (
    <>
      <header className="title">
        <small translate="no">San Cernin</small>
        <h1>{title}</h1>
        <PullToRefresh onRefresh={pulled} />
      </header>
      <nav className="tabs" aria-label="Secciones">
        <div className="brand" translate="no">
          <img src="/icon.svg" width={28} height={28} alt="" />
          <div>San Cernin<small>Equipaciones</small></div>
        </div>
        <ul>
          {LINKS.map((l) => {
            const on = isActive(l.href, path);
            return (
              <li key={l.href}>
                <Link href={l.href} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={l.icon} /></svg>
                  {l.label}
                  {l.href === '/avisos' && alerts > 0 && <span className="tab-n"><span className="sr">, </span>{alerts}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
