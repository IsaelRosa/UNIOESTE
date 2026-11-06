import Link from "next/link";
import { ParanaMap, type MapPoint } from "@/components/parana-map";
import { PublicLayout } from "@/components/public-shell";
import { Badge, Card, LogoMark, Progress } from "@/components/ui";
import { HBarChart } from "@/components/charts";
import { getSessionUser } from "@/lib/auth";
import { getAxisPerformance, getMunicipalityPerformance, getOverview } from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

const MODULES = [
  {
    n: "01",
    title: "Painel administrativo estadual",
    text: "Eixos, objetivos, metas, ações e indicadores com prazos, responsáveis e acompanhamento da execução.",
    href: "/painel",
    tag: "Gestão estadual",
  },
  {
    n: "02",
    title: "Área dos municípios",
    text: "Cada um dos 399 municípios com acesso próprio, preenchimento de indicadores e acompanhamento das suas metas.",
    href: "/municipal",
    tag: "399 territórios",
  },
  {
    n: "03",
    title: "Equipe técnica e fluxo de aprovação",
    text: "Equipe técnica alimenta os dados, gestor municipal revisa e aprova, gestão estadual consolida.",
    href: "/municipal/indicadores",
    tag: "Workflow",
  },
  {
    n: "04",
    title: "Dashboards e relatórios gerenciais",
    text: "Indicadores do Paraná, evolução das metas, comparação entre municípios, filtros e exportação XLSX/CSV.",
    href: "/painel/relatorios",
    tag: "Inteligência",
  },
  {
    n: "05",
    title: "Mapa georreferenciado",
    text: "Leitura territorial dos indicadores por município, com detalhamento de metas atingidas e pendentes.",
    href: "/painel/mapa",
    tag: "Território",
  },
  {
    n: "06",
    title: "Portal público de transparência",
    text: "Consulta cidadã sem login, com dados agregados e anonimizados, gráficos, mapas e download de bases.",
    href: "/transparencia",
    tag: "Transparência",
  },
  {
    n: "07",
    title: "Integração entre políticas públicas",
    text: "Relações entre as metas da Juventude e os planos de Saúde, Educação, Assistência Social e outros.",
    href: "/painel/integracoes",
    tag: "Transversalidade",
  },
];

export default async function HomePage() {
  const [user, overview, axes, municipalities] = await Promise.all([
    getSessionUser(),
    getOverview("2025"),
    getAxisPerformance("2025"),
    getMunicipalityPerformance({ period: "2025" }),
  ]);

  const points: MapPoint[] = municipalities.map((row) => ({
    id: row.id,
    name: row.name,
    region: row.region,
    lat: row.lat,
    lng: row.lng,
    execution: row.execution,
    pending: row.pending,
    approved: row.approved,
  }));

  return (
    <PublicLayout user={user} active="inicio">
      <section className="grid items-start gap-8 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="good">Protótipo funcional</Badge>
            <Badge tone="neutral">Edital UNIOESTE · PR 17-11</Badge>
            <Badge tone="accent">Plano Estadual da Juventude</Badge>
          </div>
          <h1 className="display mt-5 text-[38px] leading-[1.04] text-ink sm:text-[52px]">
            Inteligência territorial para transformar políticas de juventude em <em className="text-verde not-italic">decisão pública</em>.
          </h1>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-soft">
            Monitoramento dos 399 municípios do Paraná: metas, indicadores, fluxo de validação, mapa territorial,
            relatórios e transparência — com trilha de auditoria e controle de acesso por perfil.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/login" className="btn btn-primary">
              Entrar no protótipo
            </Link>
            <Link href="/transparencia" className="btn btn-ghost">
              Ver portal público
            </Link>
            <Link href="/arquitetura" className="btn btn-ghost">
              Arquitetura & edital
            </Link>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Municípios", formatNumber(overview.municipalities)],
              ["Execução média", formatPercent(overview.execution)],
              ["Metas ativas", formatNumber(overview.goals)],
              ["Indicadores", formatNumber(overview.indicators)],
            ].map(([label, value]) => (
              <div key={label} className="card-flat px-3 py-3">
                <dt className="eyebrow">{label}</dt>
                <dd className="num display mt-1 text-[24px] leading-none text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 rounded-xl border border-[#d9e4dc] bg-verde-soft/60 p-4">
            <p className="eyebrow text-verde">Contas de demonstração · senha Sisprom@2026</p>
            <div className="mt-2 grid gap-1 text-[12px] text-ink-soft sm:grid-cols-2">
              <p>admin@juventude.pr.gov.br — estadual</p>
              <p>gestor@cascavel.pr.gov.br — municipal</p>
              <p>tecnico@cascavel.pr.gov.br — equipe técnica</p>
              <p>tecnico.estado@juventude.pr.gov.br — técnico estadual</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <ParanaMap points={points} compact />
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Execução por eixo estratégico · ciclo 2025</p>
              <span className="text-[11px] font-semibold text-muted">{formatNumber(overview.pending)} aguardando validação</span>
            </div>
            <div className="mt-3">
              <HBarChart
                items={axes.map((axis) => ({
                  label: axis.name,
                  value: axis.execution,
                  color: axis.color,
                  hint: `${formatNumber(axis.participants)} municípios com dados aprovados`,
                }))}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white/60 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Escopo da plataforma</p>
            <h2 className="display mt-1 text-[28px] leading-tight text-ink">Sete módulos, uma cadeia de responsabilização</h2>
          </div>
          <p className="max-w-md text-[12px] leading-relaxed text-muted">
            Do cadastro da meta estadual à consulta cidadã: cada dado tem origem, responsável, status e histórico de validação.
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module) => (
            <Link key={module.n} href={module.href} className="card group p-4 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <span className="num text-[11px] font-bold text-ouro">{module.n}</span>
                <span className="badge badge-neutral">{module.tag}</span>
              </div>
              <h3 className="mt-2 text-[15px] font-semibold leading-snug text-ink group-hover:text-verde">{module.title}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{module.text}</p>
              <p className="mt-3 text-[11px] font-semibold text-verde">Explorar módulo →</p>
            </Link>
          ))}
          <Card className="bg-ink p-4 text-white">
            <div className="flex items-center gap-2">
              <LogoMark size={26} />
              <p className="text-[12px] font-bold">SISPROM-BR 360º</p>
            </div>
            <p className="mt-3 display text-[20px] leading-snug">Pronto para a banca da UNIOESTE.</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#c5d2d7]">
              Documento de arquitetura, protótipo navegável e plano de execução consolidados neste ambiente.
            </p>
            <Link href="/arquitetura" className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-[11.5px] font-bold text-ink">
              Abrir dossiê técnico
            </Link>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 py-10 lg:grid-cols-3">
        <Card className="p-5">
          <p className="eyebrow">Aderência ao edital</p>
          <h3 className="display mt-1 text-[22px] text-ink">Arquitetura em conformidade</h3>
          <ul className="mt-3 space-y-2 text-[12.5px] text-ink-soft">
            {[
              "Backend Java (Spring Boot) em microsserviços",
              "Microsoft SQL Server + migrações versionadas",
              "APIs REST com JSON e contrato OpenAPI",
              "RBAC, HTTPS, criptografia e trilha de auditoria",
              "eMAG/WCAG, integração com Central de Segurança e Cadastro Único",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-verde" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/arquitetura" className="mt-4 inline-block text-[11.5px] font-bold text-verde">
            Ver matriz de conformidade →
          </Link>
        </Card>
        <Card className="p-5">
          <p className="eyebrow">Fluxo de dados</p>
          <h3 className="display mt-1 text-[22px] text-ink">Equipe técnica → gestor → estado</h3>
          <ol className="mt-3 space-y-3">
            {[
              ["Equipe técnica municipal", "Preenche indicadores e anexa comprovações"],
              ["Gestor municipal", "Revisa, aprova ou solicita correções"],
              ["Gestão estadual", "Consolida, analisa e publica transparência"],
            ].map(([title, text], index) => (
              <li key={title} className="flex gap-3">
                <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-full bg-verde-soft text-[11px] font-bold text-verde">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">{title}</p>
                  <p className="text-[11.5px] text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 space-y-2 rounded-lg bg-[#f7f4ec] p-3">
            <div className="flex justify-between text-[11px] font-semibold text-ink-soft">
              <span>Dados aprovados no ciclo</span>
              <span className="num">{formatNumber(overview.approved)}</span>
            </div>
            <Progress value={(() => {
              const total = overview.approved + overview.pending + overview.corrections;
              return total ? (overview.approved / total) * 100 : 0;
            })()} color="#146b52" />
          </div>
        </Card>
        <Card className="p-5">
          <p className="eyebrow">Leitura executiva</p>
          <h3 className="display mt-1 text-[22px] text-ink">Onde a gestão precisa agir</h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <span className="text-[12px] text-ink-soft">Metas com execução ≥ 85%</span>
              <span className="badge badge-good">{overview.goalsOnTrack}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <span className="text-[12px] text-ink-soft">Metas em zona crítica</span>
              <span className="badge badge-bad">{overview.goalsCritical}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <span className="text-[12px] text-ink-soft">Municípios com dados aprovados</span>
              <span className="badge badge-info">
                {formatNumber(overview.participants)}/{formatNumber(overview.municipalities)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <span className="text-[12px] text-ink-soft">Registros aguardando validação</span>
              <span className="badge badge-warn">{formatNumber(overview.pending)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <span className="text-[12px] text-ink-soft">Correções solicitadas</span>
              <span className="badge badge-bad">{formatNumber(overview.corrections)}</span>
            </div>
          </div>
          <Link href="/painel" className="mt-4 inline-block text-[11.5px] font-bold text-verde">
            Abrir painel estadual →
          </Link>
        </Card>
      </section>
    </PublicLayout>
  );
}
