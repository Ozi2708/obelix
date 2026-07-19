// Web App Manifest — rend Obélix installable (« Ajouter à l'écran d'accueil »
// / « Installer l'application »). Servi par Next sur /manifest.webmanifest.
export default function manifest() {
  return {
    name: 'Obélix — intolérances alimentaires',
    short_name: 'Obélix',
    description:
      "Logue tes repas, note tes gênes — Obélix croise tout et identifie tes suspects. Jamais un diagnostic, un outil d'observation.",
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFFCF8',
    theme_color: '#D86816',
    lang: 'fr',
    categories: ['health', 'lifestyle', 'medical'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
