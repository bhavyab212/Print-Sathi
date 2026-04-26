import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Print Sathi — Smart Print Shop Manager",
  description:
    "Automate your print shop workflows. Passport photos, billing, document formatting, and QR-based job queue — all in one platform.",
  keywords: [
    "print shop",
    "xerox shop",
    "automation",
    "passport photo",
    "bill calculator",
    "print queue",
    "India",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Boxicons CDN */}
        <link
          href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
