import type { Metadata } from "next";
import { Catalog } from "@/components/store/Catalog";
import { StoreFrame } from "@/components/store/StoreFrame";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Tienda — ReviewsGO",
  description: "Catálogo de carteles NFC y QR de ReviewsGO. Consultá diseños y precios por WhatsApp.",
};

export default async function TiendaPage() {
  const session = await getSession();
  return (
    <StoreFrame loggedIn={Boolean(session)}>
      <Catalog />
    </StoreFrame>
  );
}
