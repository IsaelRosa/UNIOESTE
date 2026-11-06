import type { ReactNode } from "react";
import { requireMunicipal } from "@/lib/auth";

export default async function MunicipalLayout({ children }: { children: ReactNode }) {
  await requireMunicipal();
  return <>{children}</>;
}
