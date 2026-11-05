'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Semana' },
  { href: '/mes', label: 'Mes' },
  { href: '/cambios', label: 'Cambios' },
  { href: '/ajustes', label: 'Ajustes' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={(l.href === '/' ? path === '/' : path.startsWith(l.href)) ? 'on' : ''}>{l.label}</Link>
      ))}
    </nav>
  );
}
