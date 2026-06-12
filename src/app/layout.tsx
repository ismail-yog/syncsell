import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "SyncSell | Premium AI E-commerce Optimization",
  description: "Enterprise-grade eBay and Shopify listing optimization powered by Claude 3.5 Sonnet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.className} bg-background text-foreground antialiased selection:bg-primary/30`}>{children}</body>
    </html>
  );
}
