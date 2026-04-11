import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Montserrat, Space_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TILT — Run Your Golf Pool Without the Spreadsheet",
    template: "%s | TILT",
  },
  description:
    "Create and manage private golf pools with live leaderboards, mobile picks, and automated scoring. Free to start. Built for commissioners who run Masters, PGA Championship, and major tournament pools.",
  metadataBase: new URL("https://playtilt.io"),
  openGraph: {
    title: "TILT — Run Your Golf Pool Without the Spreadsheet",
    description:
      "Live leaderboards. Mobile picks. Automated scoring. Set up your golf pool in 3 minutes.",
    type: "website",
    url: "https://playtilt.io",
    siteName: "TILT",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TILT — Golf Pool Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TILT — Run Your Golf Pool Without the Spreadsheet",
    description:
      "Live leaderboards. Mobile picks. Automated scoring. Free to start.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://playtilt.io" },
  robots: { index: true, follow: true },
  other: { "theme-color": "#1a1a1a" },
  verification: {
    google: "M-Upq87PyCPeVtvI7ex0hzZmOqX8Scg2pzlW8wOMBMY",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${montserrat.variable} ${spaceMono.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-text-primary`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
