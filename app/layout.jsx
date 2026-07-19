import './globals.css';
import PwaRegister from '../components/PwaRegister';

export const metadata = {
  applicationName: 'Obélix',
  title: 'Obélix — identifie tes intolérances alimentaires',
  description:
    "Logue tes repas en 20 secondes, note tes gênes — Obélix croise tout et identifie tes suspects. Jamais un diagnostic, un outil d'observation.",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Obélix',
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#D86816',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        {/* Phosphor icons — the only icon system used by the Obélix design system */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css"
        />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
