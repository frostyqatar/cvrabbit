import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "CVRabbit — A calmer way to manage your CV",
    template: "%s · CVRabbit",
  },
  description:
    "Upload an existing CV, edit it in structured sections, and generate beautifully designed PDFs. Private by design, with no AI rewrites.",
  applicationName: "CVRabbit",
  keywords: ["CV editor", "resume builder", "PDF CV", "resume templates", "private resume"],
  authors: [{ name: "CVRabbit" }],
  openGraph: {
    title: "CVRabbit — A calmer way to manage your CV",
    description:
      "Upload, refine, and generate professional CVs. Your information stays private and under your control.",
    type: "website",
    siteName: "CVRabbit",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f4fff8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${instrument.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
