import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Equipaciones · San Cernin',
  description: 'Calendario de partidos del Club Deportivo San Cernin y equipación de cada partido',
  appleWebApp: { capable: true, title: 'Equipaciones', statusBarStyle: 'default' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f2f2f7' }, { media: '(prefers-color-scheme: dark)', color: '#000000' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
