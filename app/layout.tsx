import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "1Cube - AI Automation for Wellness Ecommerce",
  description: "AI autopilot for wellness ecommerce: unify marketplaces, predict winners, and auto-optimize ads, content, bundles, and retention—built for Indonesia.",
  keywords: ["ecommerce", "ai", "automation", "wellness", "health", "indonesia", "marketplace"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}