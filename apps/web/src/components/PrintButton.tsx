"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="no-print"
      onClick={() => window.print()}
      style={{
        marginTop: "1rem",
        padding: "0.75rem 1.25rem",
        borderRadius: 999,
        border: 0,
        background: "#111",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      Imprimir
    </button>
  );
}
