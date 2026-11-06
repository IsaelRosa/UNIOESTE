"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { LogoMark } from "@/components/ui";

type NavItem = { href: string; label: string; icon: string; badge?: number };

export function AppShell({
  user,
  children,
  pending,
  logout,
}: {
  user: SessionUser;
  children: ReactNode;
  pending: number;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isState = user.role === "estado_admin" || user.role === "estado_tecnico";

  const stateNav: NavItem[] = [
    { href: "/painel", label: "Visão geral", icon: "◧" },
    { href: "/painel/plano", label: "Plano & metas", icon: "◈" },
    { href: "/painel/municipios", label: "Municípios", icon: "▦" },
    { href: "/painel/validacao", label: "Fila de validação", icon: "✓", badge: pending },
    { href: "/painel/relatorios", label: "Relatórios", icon: "▤" },
    { href: "/painel/mapa", label: "Mapa territorial", icon: "◉" },
    { href: "/painel/integracoes", label: "Integração de políticas", icon: "⛓" },
    { href: "/painel/auditoria", label: "Auditoria & segurança", icon: "⛨" },
  ];

  const municipalNav: NavItem[] = [
    { href: "/municipal", label: "Painel municipal", icon: "◧" },
    { href: "/municipal/indicadores", label: "Meus indicadores", icon: "◍" },
    { href: "/municipal/equipe", label: "Equipe municipal", icon: "◔" },
  ];

  const publicNav: NavItem[] = [
    { href: "/transparencia", label: "Portal público", icon: "◎" },
    { href: "/arquitetura", label: "Arquitetura & edital", icon: "◫" },
  ];

  const nav = isState ? stateNav : municipalNav;

  const isActive = (href: string) => (href === "/painel" || href === "/municipal" ? pathname === href : pathname.startsWith(href));

  const NavList = () => (
    <>
      <p className="nav-label">{isState ? "Gestão estadual" : "Gestão municipal"}</p>
      {nav.map((item) => (
        <Link key={item.href} href={item.href} className="nav-link" data-active={isActive(item.href)} onClick={() => setOpen(false)}>
          <span className="w-4 text-center text-[13px] opacity-80">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.badge ? (
            <span className="rounded-full bg-[#b8862b] px-1.5 py-0.5 text-[10px] font-bold text-ink">{item.badge}</span>
          ) : null}
        </Link>
      ))}
      <p className="nav-label">Transparência</p>
      {publicNav.map((item) => (
        <Link key={item.href} href={item.href} className="nav-link" onClick={() => setOpen(false)}>
          <span className="w-4 text-center text-[13px] opacity-80">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-ink px-3 py-5 lg:flex">
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2">
          <LogoMark size={32} />
          <div>
            <p className="text-[13px] font-bold leading-none tracking-tight text-white">SISPROM-BR</p>
            <p className="mt-1 text-[10px] leading-none tracking-[0.14em] text-[#8ea6af]">360º · PARANÁ</p>
          </div>
        </Link>
        <div className="mb-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8ea6af]">Plano Estadual da Juventude</p>
          <p className="mt-0.5 text-[12px] font-semibold text-white">Ciclo 2025 · 399 municípios</p>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <NavList />
        </nav>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-verde text-[11px] font-bold text-white">
              {user.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white">{user.name}</p>
              <p className="truncate text-[10px] text-[#8ea6af]">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          {user.municipalityName ? (
            <p className="mt-2 rounded-md bg-white/10 px-2 py-1 text-[10.5px] text-[#d6e2e6]">{user.municipalityName} / PR</p>
          ) : null}
          <form action={logout} className="mt-2">
            <button type="submit" className="w-full rounded-md border border-white/15 px-2 py-1.5 text-[11px] font-semibold text-[#d6e2e6] hover:bg-white/10">
              Encerrar sessão
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={26} />
            <span className="text-[12px] font-bold text-ink">SISPROM-BR 360º</span>
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen((value) => !value)}>
            {open ? "Fechar" : "Menu"}
          </button>
        </div>
        {open ? (
          <div className="bg-ink px-3 py-3 lg:hidden">
            <NavList />
            <form action={logout} className="mt-2 px-2">
              <button type="submit" className="text-[11px] font-semibold text-[#d6e2e6]">
                Encerrar sessão
              </button>
            </form>
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-7 sm:py-8">{children}</main>
        <footer className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-2 px-4 pb-8 text-[10.5px] text-muted sm:px-7">
          <span>SISPROM-BR 360º · protótipo funcional — Cronos Tecnologia e Sistemas</span>
          <span>Dados agregados · LGPD · trilha de auditoria ativa</span>
        </footer>
      </div>
    </div>
  );
}
