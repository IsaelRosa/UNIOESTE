import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { logoutAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getQueueCounts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const counts = await getQueueCounts();
  return (
    <AppShell user={user} pending={counts.enviado ?? 0} logout={logoutAction}>
      {children}
    </AppShell>
  );
}
