"use client";

import { useEffect, useState, type ReactNode } from "react";

export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 650);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{shown.toLocaleString("es-AR")}</>;
}

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [drag, setDrag] = useState(0);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-root">
      <button className="drawer-backdrop" type="button" aria-label="Cerrar panel" onClick={onClose} />
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ transform: drag ? `translateX(${drag}px)` : undefined }}
        onTouchStart={(event) => {
          const startX = event.touches[0]?.clientX ?? 0;
          const startY = event.touches[0]?.clientY ?? 0;
          const move = (touch: TouchEvent) => {
            const dx = (touch.touches[0]?.clientX ?? startX) - startX;
            const dy = Math.abs((touch.touches[0]?.clientY ?? startY) - startY);
            if (dx > 0 && dx > dy) setDrag(dx);
          };
          const end = (touch: TouchEvent) => {
            const dx = (touch.changedTouches[0]?.clientX ?? startX) - startX;
            setDrag(0);
            if (dx > 72) onClose();
            window.removeEventListener("touchmove", move);
            window.removeEventListener("touchend", end);
          };
          window.addEventListener("touchmove", move, { passive: true });
          window.addEventListener("touchend", end);
        }}
      >
        <header>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn secondary icon" type="button" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}
