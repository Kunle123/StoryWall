import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";

/**
 * Global shell for marketing/app routes: ensures policy links in Footer are reachable
 * (matrix row 36 / #12 — legal & compliance pass).
 */
export default function MainGroupLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
