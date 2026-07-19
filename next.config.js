/** @type {import('next').NextConfig} */

// Pour GitHub Pages : export statique + basePath = nom du dépôt (/obelix).
// En local (npm run dev / build), aucun basePath — l'app tourne à la racine.
const isPages = process.env.GITHUB_PAGES === 'true';
const base = isPages ? '/obelix' : '';

const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: base },
  ...(isPages && {
    output: 'export',
    basePath: base,
    images: { unoptimized: true },
    trailingSlash: true,
  }),
};

module.exports = nextConfig;
