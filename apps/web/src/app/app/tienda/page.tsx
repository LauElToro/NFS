import type { Metadata } from "next";
import { Catalog } from "@/components/store/Catalog";

export const metadata: Metadata = {
  title: "Tienda — ReviewsGO",
  description: "Catálogo de carteles NFC y QR de ReviewsGO. Consultá diseños y precios por WhatsApp.",
};

export default function PanelTiendaPage() {
  return <Catalog />;
}
