import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CompareProvider } from "@/components/compare/CompareProvider";
import { getCurrentUser } from "@/lib/server/auth/authorization";
import { getPublicSearchIndex } from "@/lib/server/public-catalog";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Hype — Furniture that sets the mood",
    template: "%s — Hype",
  },
  description:
    "Hype is a modern furniture studio: sofas, chairs, tables, beds and storage in warm neutrals and honest materials, made in small batches.",
  keywords: [
    "modern furniture",
    "designer sofas",
    "oak dining tables",
    "editorial interiors",
    "premium furniture brand",
  ],
  applicationName: "Hype Furniture",
  category: "furniture",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Database-backed search index for the header (published + visible catalog
  // only). All public pages are force-dynamic, so this never runs at build.
  // The safe AuthUser DTO (id/email/name/role only) drives header auth state.
  const [searchIndex, user] = await Promise.all([getPublicSearchIndex(), getCurrentUser()]);
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas"
        >
          Skip to content
        </a>
        <CompareProvider>
          <Header searchIndex={searchIndex} user={user} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </CompareProvider>
      </body>
    </html>
  );
}
