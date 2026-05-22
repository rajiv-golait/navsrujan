import type { Metadata } from "next";

import { Providers } from "@/lib/query-client";

import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Budget - Student Finance",
  description: "AI-powered budgeting platform for college students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
