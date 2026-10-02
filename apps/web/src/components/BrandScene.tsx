export function BrandScene() {
  return (
    <div className="scene" aria-hidden="true">
      <span className="motif word blue" style={{ top: "9%", left: "4%" }}>RESEÑAS</span>
      <span className="motif word red" style={{ top: "16%", right: "6%" }}>QR</span>
      <span className="motif word green" style={{ top: "42%", left: "2%" }}>NFC</span>
      <span className="motif word yellow" style={{ top: "38%", right: "3%" }}>GOOGLE</span>
      <span className="motif word blue" style={{ bottom: "22%", left: "5%" }}>5 ESTRELLAS</span>
      <span className="motif word red" style={{ bottom: "14%", right: "7%" }}>REVIEWS</span>
      <span className="motif word green" style={{ top: "68%", left: "8%" }}>NEGOCIOS</span>
      <span className="motif word yellow" style={{ top: "62%", right: "8%" }}>FEEDBACK</span>
      <span className="motif word blue" style={{ bottom: "7%", left: "18%" }}>CLIENTES</span>
      <span className="motif word green" style={{ bottom: "30%", right: "14%" }}>VALORACIONES</span>

      <svg className="motif blue" style={{ top: "20%", left: "14%" }} viewBox="0 0 24 24">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />
      </svg>
      <svg className="motif green" style={{ top: "28%", right: "16%" }} viewBox="0 0 24 24">
        <path d="M8 8a8 8 0 0 1 8 8M5 5a12 12 0 0 1 12 12M11 14a2 2 0 1 1 0 .01" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
      <svg className="motif yellow" style={{ top: "54%", left: "11%" }} viewBox="0 0 24 24">
        <path d="M12 3.2 14.4 9l6.1.5-4.7 3.9 1.5 5.9L12 16.8 6.7 19.3 8.2 13.4 3.5 9.5 9.6 9z" />
      </svg>
      <svg className="motif red" style={{ bottom: "18%", left: "22%" }} viewBox="0 0 24 24">
        <path d="M12 3.2 14.4 9l6.1.5-4.7 3.9 1.5 5.9L12 16.8 6.7 19.3 8.2 13.4 3.5 9.5 9.6 9z" />
      </svg>
      <svg className="motif blue" style={{ top: "48%", right: "12%" }} viewBox="0 0 24 24">
        <rect x="7" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 18h2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <svg className="motif green" style={{ bottom: "24%", right: "22%" }} viewBox="0 0 24 24">
        <path d="M5 15.5V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H9l-4 3.5z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <svg className="motif red" style={{ top: "74%", right: "18%" }} viewBox="0 0 24 24">
        <rect x="5" y="6" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <svg className="motif yellow" style={{ bottom: "12%", left: "36%" }} viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}
