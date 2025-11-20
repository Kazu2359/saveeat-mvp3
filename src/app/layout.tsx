// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToasterClient from "@/components/ToasterClient";
import PushClient from "@/components/PushClient"; // Push client runs globally so notifications stay registered.
import AppIntro from "@/components/AppIntro";

export const metadata: Metadata = {
  title: "SaveEat",
  description: "Food tracker app",
  // Application name used by install prompts and status bars.
  applicationName: "SaveEat",
};

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        {/* Manifest entry so browsers fetch install configuration. */}
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Base colors for splash screens and status bars. */}
        <meta name="theme-color" content="#111111" />
        <meta name="background-color" content="#ffffff" />

        {/* iOS Add to Home Screen configuration. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SaveEat" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* PWA icons for iOS/Android home screen badges. */}
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" sizes="192x192" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppIntro />
        {/* Global clients mounted once for notifications/toasts. */}
        <ToasterClient />
        <PushClient />
        {children}
      </body>
    </html>
  );
}
