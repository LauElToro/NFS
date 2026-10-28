import Link from "next/link";

export function StoreFrame({
  loggedIn,
  children,
}: {
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="store-page">
      <header className="store-header">
        <Link href="/" className="store-brand" aria-label="ReviewsGO">
          <img src="/reviewsgo-wordmark.jpg" alt="" />
          <span>ReviewsGO</span>
        </Link>
        <div className="store-tools">
          <Link className="store-panel" href={loggedIn ? "/app" : "/login"}>
            {loggedIn ? "Panel" : "Entrar"}
          </Link>
        </div>
      </header>
      {children}
      <footer className="store-footer">
        <div>
          <img src="/reviewsgo-wordmark.jpg" alt="" />
          <strong>ReviewsGO</strong>
        </div>
        <p>Carteles NFC + QR para conseguir más reseñas.</p>
      </footer>
    </div>
  );
}
