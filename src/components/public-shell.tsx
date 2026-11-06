import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";
import { isStateRole } from "@/lib/roles";

export function PublicHeader({ user, active }: { user: SessionUser | null; active?: "inicio" | "transparencia" | "arquitetura" }) {
  const link = (key: "inicio" | "transparencia" | "arquitetura", href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
        active === key ? "bg-white text-ink shadow-sm" : "text-[#c5d2d7] hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-7">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={30} />
          <div>
            <p className="text-[13px] font-bold leading-none tracking-tight text-white">SISPROM-BR 360º</p>
            <p className="mt-1 text-[9.5px] leading-none tracking-[0.16em] text-[#8ea6af]">INTELIGÊNCIA TERRITORIAL E FISCAL</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {link("inicio", "/", "Visão do produto")}
          {link("transparencia", "/transparencia", "Transparência")}
          {link("arquitetura", "/arquitetura", "Arquitetura & edital")}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href={isStateRole(user.role) ? "/painel" : "/municipal"} className="btn btn-green btn-sm">
              Abrir painel
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-[#c5d2d7] hover:text-white">
                Entrar
              </Link>
              <Link href="/login" className="btn btn-green btn-sm">
                Acessar protótipo
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-white">
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 px-4 py-8 sm:px-7 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark size={26} />
            <p className="text-[12.5px] font-bold text-ink">SISPROM-BR 360º</p>
          </div>
          <p className="mt-2 max-w-sm text-[11.5px] leading-relaxed text-muted">
            Protótipo funcional desenvolvido pela Cronos Tecnologia e Sistemas para demonstração do Sistema de
            Monitoramento do Plano Estadual da Juventude — Governo do Paraná / UNIOESTE.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-2">Plataforma</p>
          <ul className="space-y-1 text-[12px] text-muted">
            <li>
              <Link href="/transparencia" className="hover:text-ink">
                Portal público
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-ink">
                Painel estadual e municipal
              </Link>
            </li>
            <li>
              <Link href="/arquitetura" className="hover:text-ink">
                Conformidade com o edital
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-2">Governança</p>
          <ul className="space-y-1 text-[12px] text-muted">
            <li>LGPD e dados agregados</li>
            <li>RBAC e trilha de auditoria</li>
            <li>Acessibilidade eMAG (planejada)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-3 text-center text-[10.5px] text-muted">
        Ambiente de demonstração — dados paramétricos para avaliação de escopo, não correspondem a estatísticas oficiais.
      </div>
    </footer>
  );
}

export function PublicLayout({
  children,
  user,
  active,
}: {
  children: ReactNode;
  user: SessionUser | null;
  active?: "inicio" | "transparencia" | "arquitetura";
}) {
  return (
    <div className="min-h-screen">
      <PublicHeader user={user} active={active} />
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-7">{children}</div>
      <PublicFooter />
    </div>
  );
}
