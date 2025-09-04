// next.config.mjs
import withPWAInit from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['luxon'] },
  images: {
    // Configuración para imágenes estáticas
    unoptimized: true,
    // Permitir dominios externos si es necesario
    domains: [],
    // Configuración de formatos
    formats: ['image/webp', 'image/avif'],
  },
};

const isProd = process.env.NODE_ENV === 'production';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd,          // en dev no registra SW
  cacheOnFrontEndNav: true,
  fallbacks: { document: '/offline' },
});

export default withPWA(nextConfig);
