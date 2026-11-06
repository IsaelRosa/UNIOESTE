import type { ReactNode } from "react";
import { requireState } from "@/lib/auth";

export default async function PainelLayout({ children }: { children: ReactNode }) {
  await requireState();
  return <>{children}</>;
}
