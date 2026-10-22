"use client";

import { useParams } from "next/navigation";
import { FolderView } from "@/components/FolderView";

export default function FolderPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  if (!id) return null;
  return <FolderView folderId={id} />;
}
