import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capital Tracker",
  description: "Le journal de trading qui vous aide à progresser.",
};

export const viewport: Viewport = {
  themeColor: "#070a12",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
