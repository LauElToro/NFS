import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
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
  title: "NFS QR — QRs dinámicos para comercios",
  description:
    "Creá QRs dinámicos, medí escaneos y rentabilidad, sin reimprimir.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable}`}>
        <style>{`:root{--font-display:var(--font-display-loaded),Georgia,serif;--font-body:var(--font-body-loaded),system-ui,sans-serif}`}</style>
        {children}
      </body>
    </html>
  );
}
