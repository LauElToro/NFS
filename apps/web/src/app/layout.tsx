import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { BrandScene } from "@/components/BrandScene";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-loaded",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body-loaded",
});

export const metadata: Metadata = {
  title: "ReviewsGO — Carteles de reseñas con QR",
  description:
    "Carteles inteligentes con NFC y código QR para que tus clientes lleguen a tus reseñas, redes y contacto.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable}`}>
        <style>{`body{--font-display:var(--font-display-loaded),system-ui,sans-serif;--font-body:var(--font-body-loaded),system-ui,sans-serif}`}</style>
        <BrandScene />
        {children}
      </body>
    </html>
  );
}
