import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  redirects: async () => [{ source: '/cambios', destination: '/avisos', permanent: true }],
  experimental: {
    // Volver atrás o cambiar de pestaña en 30 s reutiliza la página ya renderizada
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
