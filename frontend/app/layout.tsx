import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";

import { Providers } from "@/lib/query-client";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Vault — Finance AI Assistant",
  description: "Chat-first student finance assistant with balance-aware guidance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased vault-theme dark ${manrope.variable} ${geistMono.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--background)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
