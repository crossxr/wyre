import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wyre — High-Performance Go Web Engine",
  description: "Wyre is a zero-dependency, high-performance Go web engine. Build raw socket HTTP/1.1 and HTTPS servers with deterministic Trie routing, connection hijacking, and automatic memory pooling.",
  icons: {
    icon: "/logo/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
