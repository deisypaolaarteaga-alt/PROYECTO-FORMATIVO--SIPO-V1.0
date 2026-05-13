import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/shared/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SIPO — Presupuestos de Obra Inteligentes',
    template: '%s | SIPO',
  },
  description:
    'Crea presupuestos de obra profesionales con asistente de IA. Genera APUs, capítulos y exporta PDFs de forma rápida y precisa.',
  keywords: [
    'presupuestos de obra',
    'construcción Colombia',
    'APU',
    'inteligencia artificial',
    'software construcción',
  ],
  authors: [{ name: 'SIPO' }],
  openGraph: {
    title: 'SIPO — Presupuestos de Obra Inteligentes',
    description:
      'Crea presupuestos de obra profesionales con IA integrada para Colombia.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
