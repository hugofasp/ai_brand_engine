import type { Metadata, Viewport } from "next";
import { fraunces, inter, jetbrainsMono } from "@/lib/fonts";
import { TopNav } from "@/components/chrome/top-nav";
import { Footer } from "@/components/chrome/footer";
import { TailoredByBadge } from "@/components/brand/tailored-by-badge";
import { BlinkingFavicon } from "@/components/brand/blinking-favicon";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://brandsoul.nineyards.pt",
  ),
  title: {
    default: "brand.soul OS",
    template: "%s · brand.soul OS",
  },
  description:
    "A guided interview turns your brand into a structured source of truth. Files you upload to Claude or ChatGPT so every output stays on-brand.",
  applicationName: "brand.soul OS",
  openGraph: {
    title: "brand.soul OS",
    description:
      "Brand systems that LLMs actually follow. A guided interview turns your brand into a structured source of truth.",
    url: "/",
    siteName: "brand.soul OS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "brand.soul OS",
    description: "Brand systems that LLMs actually follow.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="skip-to-content">
          Skip to content
        </a>
        <TopNav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <TailoredByBadge />
        <BlinkingFavicon />
      </body>
    </html>
  );
}
