"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadQrs } from "@/lib/qr-store";

export default function QrRedirectPage() {
  const params = useParams<{ slug: string }>();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const slug = params.slug;
    const qr = loadQrs().find((item) => item.id === slug);
    if (!qr) {
      setMissing(true);
      return;
    }
    window.location.replace(qr.url);
  }, [params.slug]);

  if (!missing) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui",
      }}
    >
      <div>
        <h1>QR no disponible</h1>
        <p>Este código fue eliminado o no existe.</p>
      </div>
    </main>
  );
}
