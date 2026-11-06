'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Semana', icon: 'M4 5.5h16M7 3v4m10-4v4M4.75 5h14.5c.414 0 .75.336.75.75v13.5a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1-.75-.75V5.75C4 5.336 4.336 5 4.75 5ZM4 10h16M8 14h8' },
  { href: '/mes', label: 'Mes', icon: 'M4.75 4h14.5c.414 0 .75.336.75.75v14.5a.75.75 0 0 1-.75.75H4.75a.75.75 0 0 1-.75-.75V4.75C4 4.336 4.336 4 4.75 4ZM4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16' },
  { href: '/cambios', label: 'Cambios', icon: 'M4 8h13.5M14 4.5 17.5 8 14 11.5M20 16H6.5M10 12.5 6.5 16l3.5 3.5' },
  { href: '/ajustes', label: 'Ajustes', icon: 'M4 7h9m4 0h3M4 17h3m4 0h9M15 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM9 14.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z' },
];

const isActive = (href: string, path: string) => (href === '/' ? path === '/' : path.startsWith(href));

export default function Nav() {
  const path = usePathname();
  const title = LINKS.find((l) => isActive(l.href, path))?.label ?? 'San Cernin';
  return (
    <>
      <header className="title">
        <small translate="no">San Cernin</small>
        <h1>{title}</h1>
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
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
