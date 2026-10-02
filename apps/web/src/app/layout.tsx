import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { BrandScene } from "@/components/BrandScene";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-loaded",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-loaded",
});

export const metadata: Metadata = {
  title: "ReviewsGO — Carteles de reseñas con QR",
  description:
    "Gestioná carteles de reseñas con QR y NFC. El impreso no cambia cuando actualizás el destino.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable}`}>
        <style>{`:root{--font-display:var(--font-display-loaded),Georgia,serif;--font-body:var(--font-body-loaded),system-ui,sans-serif}`}</style>
        <BrandScene />
        {children}
      </body>
    </html>
  );
}
