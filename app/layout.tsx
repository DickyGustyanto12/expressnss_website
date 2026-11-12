import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const font = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NSS Express - Solusi Logistik & Distribusi Terpercaya",
  description:
    "NSS Express menyediakan layanan pengiriman paket reguler dan next day yang cepat, aman, dan tepat waktu ke seluruh Nusantara.",
  icons: {
    icon: "/logoexpress.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${font.variable} h-full antialiased`}>
      <body className={`${font.className} min-h-full flex flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}
