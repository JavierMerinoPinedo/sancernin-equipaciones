import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Equipaciones San Cernin',
    short_name: 'Equipaciones',
    start_url: '/',
    display: 'standalone',
    background_color: '#e9effb',
    theme_color: '#0b1f5c',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
