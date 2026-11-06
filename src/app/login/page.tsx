import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { isStateRole } from "@/lib/roles";
import { Badge, LogoMark, Notice } from "@/components/ui";

export const dynamic = "force-dynamic";

const DEMOS = [
  { email: "admin@juventude.pr.gov.br", label: "Gestão estadual", detail: "Acesso total · administrador", tone: "good" as const },
  { email: "tecnico.estado@juventude.pr.gov.br", label: "Equipe técnica estadual", detail: "Validação e indicadores", tone: "info" as const },
  { email: "gestor@cascavel.pr.gov.br", label: "Gestor municipal", detail: "Cascavel · aprova a equipe", tone: "warn" as const },
  { email: "tecnico@cascavel.pr.gov.br", label: "Equipe técnica municipal", detail: "Cascavel · preenche dados", tone: "accent" as const },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; email?: string; next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect(isStateRole(user.role) ? "/painel" : "/municipal");
  const params = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between bg-ink px-10 py-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#9fc3b4_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark size={36} />
            <div>
              <p className="text-[14px] font-bold leading-none">SISPROM-BR 360º</p>
              <p className="mt-1 text-[10px] tracking-[0.18em] text-[#8ea6af]">INTELIGÊNCIA TERRITORIAL E FISCAL</p>
            </div>
          </Link>
          <div className="mt-16 max-w-md">
            <p className="eyebrow text-[#8ea6af]">Governo do Paraná · UNIOESTE</p>
            <h1 className="display mt-3 text-[38px] leading-[1.08]">
              Monitoramento do Plano Estadual da <em className="text-[#8fd0b6] not-italic">Juventude</em>.
            </h1>
            <p className="mt-4 text-[13px] leading-relaxed text-[#c5d2d7]">
              Ambiente de demonstração do protótipo funcional. Perfis distintos simulam a operação real de 399 municípios,
              com fluxo de validação, trilha de auditoria e consolidação estadual.
            </p>
          </div>
          <ul className="mt-10 space-y-3">
            {[
              ["Painel estadual", "Indicadores, metas, mapa territorial e relatórios gerenciais."],
              ["Painel municipal", "Preenchimento de indicadores e aprovação pelo gestor."],
              ["Transparência", "Consulta pública com dados agregados e anonimizados."],
            ].map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8fd0b6]" />
                <div>
                  <p className="text-[12.5px] font-semibold">{title}</p>
                  <p className="text-[11.5px] text-[#9db3bb]">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[10.5px] text-[#8ea6af]">
          <span>Cronos Tecnologia e Sistemas</span>
          <span>HTTPS · RBAC · auditoria</span>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold text-muted hover:text-ink lg:hidden">
            <LogoMark size={24} /> SISPROM-BR 360º
          </Link>
          <p className="eyebrow">Acesso restrito</p>
          <h2 className="display mt-1 text-[30px] leading-tight text-ink">Entrar na plataforma</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Use uma conta de demonstração para explorar cada perfil de acesso.
          </p>

          {params.erro ? (
            <div className="mt-4">
              <Notice tone="warn">{params.erro}</Notice>
            </div>
          ) : null}

          <form action={loginAction} className="card mt-5 space-y-3 p-5">
            <input type="hidden" name="next" value={params.next ?? ""} />
            <div>
              <label className="label" htmlFor="email">
                E-mail institucional
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={params.email ?? "admin@juventude.pr.gov.br"}
                className="input"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="Sisprom@2026"
                className="input"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Entrar
            </button>
            <p className="text-center text-[10.5px] text-muted">
              Sessão protegida por cookie httpOnly · expira em 12 horas
            </p>
          </form>

          <div className="mt-5">
            <p className="eyebrow mb-2">Perfis disponíveis · senha Sisprom@2026</p>
            <div className="grid gap-2">
              {DEMOS.map((demo) => (
                <form key={demo.email} action={loginAction} className="card-flat flex items-center justify-between px-3 py-2">
                  <input type="hidden" name="email" value={demo.email} />
                  <input type="hidden" name="password" value="Sisprom@2026" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-semibold text-ink">{demo.label}</p>
                      <Badge tone={demo.tone}>demo</Badge>
                    </div>
                    <p className="text-[10.5px] text-muted">{demo.detail}</p>
                  </div>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Entrar
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-[11px] text-muted">
            <Link href="/transparencia" className="font-semibold hover:text-ink">
              Portal público (sem login)
            </Link>
            <Link href="/arquitetura" className="font-semibold hover:text-ink">
              Arquitetura & edital
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
