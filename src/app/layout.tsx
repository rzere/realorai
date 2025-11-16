import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "realorai.net ~ AI vs Human Detector",
    template: "%s | realorai.net",
  },
  description:
    "Analyze any text to estimate if it was written by a human or AI. Prototype verdict with confidence and simple explanation.",
  keywords: [
    "AI detector",
    "AI text detection",
    "human vs AI",
    "content authenticity",
    "LLM detection",
  ],
  icons: [
    { rel: "icon", url: "/favicon.ico", type: "image/x-icon" },
    { rel: "shortcut icon", url: "/favicon.ico", type: "image/x-icon" },
  ],
  openGraph: {
    title: "realorai.net ~ AI vs Human Detector",
    description:
      "Paste text and we’ll estimate whether it was written by a human or AI, with a confidence score and plain-language explanation.",
    url: "https://realorai.net",
    siteName: "realorai.net",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "realorai.net ~ AI vs Human Detector",
    description:
      "Estimate whether text was written by a human or AI, with a simple explanation.",
    creator: "@",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=1" sizes="any" type="image/x-icon" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
