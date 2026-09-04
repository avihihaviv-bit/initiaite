import type { Metadata, Viewport } from "next";
import { Rubik, Frank_Ruhl_Libre } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["latin", "hebrew"],
  variable: "--font-frank",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TEFILLIN — יום אחרי יום",
  description: "אפליקציית תפילין מודרנית להתמדה, לימוד ומעקב אחר מצוות הנחת תפילין.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#10162b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body
        className={`${rubik.variable} ${frankRuhl.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
