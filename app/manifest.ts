import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Equipaciones San Cernin',
    short_name: 'Equipaciones',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f2f7',
    theme_color: '#f2f2f7',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
