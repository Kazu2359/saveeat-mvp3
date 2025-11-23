// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToasterClient from "@/components/ToasterClient";
import PushClient from "@/components/PushClient"; // Push client runs globally so notifications stay registered.
import AppIntro from "@/components/AppIntro";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

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
        <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur shadow-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-black">
              SaveEat
            </Link>
            <nav className="flex items-center gap-4 text-sm text-gray-700">
              <Link href="/feed" className="hover:text-black">
                みんなの投稿
              </Link>
            <Link href="/myposts" className="hover:text-black">
              マイ投稿
            </Link>
            <Link href="/profile" className="hover:text-black">
              プロフィール
            </Link>
            <Link href="/profile/likes" className="hover:text-black">
              Like一覧
            </Link>
            <Link
              href="/upload"
              className="rounded-full bg-black px-4 py-2 !text-white hover:bg-gray-800 transition shadow-sm"
            >
              投稿する
            </Link>
              <LogoutButton />
            </nav>
          </div>
        </header>
        {/* Global clients mounted once for notifications/toasts. */}
        <ToasterClient />
        <PushClient />
        {children}
      </body>
    </html>
  );
}
