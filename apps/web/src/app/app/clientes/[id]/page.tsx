"use client";

import { useParams } from "next/navigation";
import { ClientFolderView } from "@/components/ClientFolderView";

export default function ClientFolderPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  if (!id) return null;
  return <ClientFolderView clientId={id} />;
}
