import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { BrandScene } from "@/components/BrandScene";
import "./globals.css";

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
      <body className={body.variable}>
        <style>{`:root{--font-display:var(--font-body-loaded),system-ui,sans-serif;--font-body:var(--font-body-loaded),system-ui,sans-serif}`}</style>
        <BrandScene />
        {children}
      </body>
    </html>
  );
}
