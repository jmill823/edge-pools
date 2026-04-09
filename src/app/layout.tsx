import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk, Work_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TILT — Golf Pool Management",
  description:
    "Create and manage your golf pools. Set up categories, invite players, and watch the live leaderboard.",
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
          className={`${spaceGrotesk.variable} ${workSans.variable} ${spaceMono.variable} font-body antialiased min-h-screen flex flex-col bg-background text-text-primary`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
