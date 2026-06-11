import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EcomAutoPilot — AI-Powered E-Commerce Optimizer',
  description:
    'Supercharge your e-commerce listings with AI. Platform-tailored SEO, real-time inventory sync, and AI-powered category mapping for Shopify & eBay — all on autopilot.',
  keywords: [
    'e-commerce',
    'SEO optimizer',
    'Shopify',
    'eBay',
    'inventory sync',
    'AI listing optimizer',
    'category mapping',
    'product optimization',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${outfit.variable}`}
    >
      <body className="font-sans antialiased bg-bg text-text">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
