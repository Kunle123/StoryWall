import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Auth flows are not landing pages; keep them out of the public index. */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
