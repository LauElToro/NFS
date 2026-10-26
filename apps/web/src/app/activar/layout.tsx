import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activar cartel — ReviewsGO",
  robots: { index: false, follow: false },
};

export default function ActivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
