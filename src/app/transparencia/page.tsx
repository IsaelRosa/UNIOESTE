import Link from "next/link";
import { HBarChart, TrendChart } from "@/components/charts";
import { ParanaMap, type MapPoint } from "@/components/parana-map";
import { PublicLayout } from "@/components/public-shell";
import { Badge, Card, Progress, SectionTitle, SituationBadge, Stat } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import {
  getAxisPerformance,
  getGoalProgress,
  getMunicipalityPerformance,
  getOverview,
  getPolicyNetwork,
  getRegionPerformance,
  getTrend,
} from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TransparenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; regiao?: string }>;
}) {
  const params = await searchParams;
  const period = params.periodo === "2024" ? "2024" : "2025";
  const region = params.regiao || undefined;

  const [user, overview, axes, regions, municipalities, goals, trend, network] = await Promise.all([
    getSessionUser(),
    getOverview(period),
    getAxisPerformance(period),
    getRegionPerformance(period),
    getMunicipalityPerformance({ period, region }),
    getGoalProgress(period),
    getTrend(),
    getPolicyNetwork(),
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
  const activePlans = network.plans.filter((plan) => plan.links > 0);

  return (
    <PublicLayout user={user} active="transparencia">
      <section className="py-9">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="good">Acesso público · sem login</Badge>
          <Badge tone="neutral">Dados agregados e anonimizados</Badge>
          <Badge tone="accent">LGPD</Badge>
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h1 className="display text-[34px] leading-[1.06] text-ink sm:text-[44px]">
              Transparência da política estadual da juventude
            </h1>
            <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-ink-soft">
              Consulte os resultados do Plano Estadual da Juventude nos 399 municípios do Paraná. Indicadores agregados,
              execução das metas e leitura territorial — sem identificação de pessoas atendidas.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-line bg-white p-1">
                {["2025", "2024"].map((item) => (
                  <Link key={item} href={`/transparencia?periodo=${item}`} className="tab" data-active={period === item}>
                    Ciclo {item}
                  </Link>
                ))}
              </div>
              <Link href={`/api/export?format=csv&period=${period}`} className="btn btn-ghost btn-sm">
                Baixar CSV
              </Link>
              <Link href={`/api/export?format=xlsx&period=${period}`} className="btn btn-ghost btn-sm">
                Baixar XLSX
              </Link>
              <a href="/api/public/indicadores" className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer">
                API JSON
              </a>
            </div>
          </div>
          <Card className="p-4">
            <p className="eyebrow">Resumo do ciclo {period}</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {[
                ["Execução média", formatPercent(overview.execution)],
                ["Municípios com dados", formatNumber(overview.participants)],
                ["Metas monitoradas", formatNumber(overview.goals)],
                ["Indicadores", formatNumber(overview.indicators)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-[#f7f4ec] p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
                  <p className="num display text-[22px] leading-none text-ink">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted">
              Última consolidação: dados aprovados pelos gestores municipais e validados pela gestão estadual.
            </p>
          </Card>
        </div>
      </section>

      <div id="dados" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Execução média do plano" value={formatPercent(overview.execution)} hint={`ciclo ${period}`} />
        <Stat label="Registros aprovados" value={formatNumber(overview.approved)} hint="fontes validadas" accent="#2c7c8a" />
        <Stat
          label="Cobertura municipal"
          value={formatPercent((overview.participants / Math.max(1, overview.municipalities)) * 100)}
          hint={`${formatNumber(overview.participants)} de ${formatNumber(overview.municipalities)} municípios`}
          accent="#3e6b9c"
        />
        <Stat label="Eixos estratégicos" value={formatNumber(overview.axes)} hint="educação, saúde, trabalho e mais" accent="#b8862b" />
      </div>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <SectionTitle eyebrow="Evolução" title="Execução média do plano" description="Comparativo entre os ciclos de monitoramento publicados." />
          <div className="mt-3">
            <TrendChart data={trend} />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle eyebrow="Eixos" title="Resultado por área da política" />
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
        </Card>
      </section>

      <section className="mt-6">
        <SectionTitle
          eyebrow="Mapa público"
          title="Resultados por município"
          description="Selecione uma região ou clique em um município para consultar a execução consolidada."
          action={
            <div className="flex flex-wrap gap-1.5">
              <Link href="/transparencia" className="badge badge-neutral hover:bg-[#e7e4da]">
                Todas
              </Link>
              {regions.slice(0, 4).map((item) => (
                <Link
                  key={item.region}
                  href={`/transparencia?periodo=${period}&regiao=${encodeURIComponent(item.region)}`}
                  className="badge badge-neutral hover:bg-[#e7e4da]"
                >
                  {item.region}
                </Link>
              ))}
            </div>
          }
        />
        <div className="mt-3">
          <ParanaMap points={points} linkBase="/transparencia/municipio" compact />
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <SectionTitle eyebrow="Territórios" title="Desempenho por região geográfica" />
          </div>
          <div className="scroll-x mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Região</th>
                  <th>Municípios</th>
                  <th style={{ minWidth: 150 }}>Execução</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {[...regions]
                  .sort((a, b) => (b.execution ?? -1) - (a.execution ?? -1))
                  .map((item) => (
                    <tr key={item.region}>
                      <td className="font-medium text-ink">{item.region}</td>
                      <td className="num">
                        {formatNumber(item.municipalities)}
                        <span className="text-[10px] text-muted"> · {formatNumber(item.participating)} c/ dados</span>
                      </td>
                      <td>
                        <Progress value={item.execution} />
                      </td>
                      <td>
                        <SituationBadge execution={item.execution} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle eyebrow="Compromissos" title="Metas públicas do plano" />
          <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {goals.slice(0, 10).map((goal) => (
              <div key={goal.goalId} className="rounded-xl border border-line p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-muted">
                      {goal.code} · {goal.axis}
                    </p>
                    <p className="text-[11.5px] font-semibold leading-snug text-ink">{goal.title}</p>
                  </div>
                  <span className="num text-[11px] font-bold" style={{ color: goal.axisColor }}>
                    {formatPercent(goal.execution)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Progress value={goal.execution} color={goal.axisColor} height={5} />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  Meta {formatNumber(goal.target)} {goal.unit} · prazo {goal.deadline.split("-").reverse().join("/")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="politicas" className="mt-8">
        <SectionTitle
          eyebrow="Políticas integradas"
          title="A juventude atravessa outras políticas"
          description="As metas do plano estadual estão conectadas a planos setoriais de saúde, educação, assistência social e direitos humanos."
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {activePlans.slice(0, 8).map((plan) => (
            <div key={plan.id} className="card p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: plan.color }} />
                <p className="text-[12px] font-semibold text-ink">{plan.name}</p>
              </div>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">{plan.sphere}</p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{plan.description}</p>
              <p className="mt-2 text-[10.5px] font-semibold text-verde">{plan.links} vínculos com metas</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {network.links.slice(0, 4).map((link) => (
            <div key={`${link.id}-${link.plan}`} className="card-flat p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted">{link.plan}</p>
              <p className="mt-0.5 text-[12px] font-semibold text-ink">{link.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{link.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <SectionTitle eyebrow="Dados abertos" title="Baixe e reutilize as bases públicas" />
          <div className="mt-3 overflow-x-auto rounded-xl bg-ink p-3 font-mono text-[11px] leading-relaxed text-[#c8e6d8]">
            <p>GET /api/public/indicadores?period=2025</p>
            <p className="text-[#8ea6af]">{`{ "ciclo": "2025", "resumo": { ... }, "eixos": [ ... ], "municipios": [ ... ] }`}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/api/export?format=csv&period=${period}`} className="btn btn-ghost btn-sm">
              Dados por indicador (CSV)
            </Link>
            <Link href={`/api/export?format=xlsx&period=${period}`} className="btn btn-ghost btn-sm">
              Relatório executivo (XLSX)
            </Link>
            <a href="/api/public/indicadores" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              API pública (JSON)
            </a>
          </div>
          <dl className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
            {[
              ["Município", "Nome oficial do território"],
              ["Eixo estratégico", "Área da política pública"],
              ["Indicador", "Medida de acompanhamento da meta"],
              ["Execução (%)", "Alcance em relação à referência municipal"],
              ["Situação", "Faixa de execução consolidada"],
              ["Ciclo", "Ano de referência do monitoramento"],
            ].map(([term, definition]) => (
              <div key={term} className="rounded-lg border border-line px-2.5 py-1.5">
                <dt className="font-semibold text-ink">{term}</dt>
                <dd className="text-muted">{definition}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-5">
          <SectionTitle eyebrow="Proteção de dados" title="O que não é publicado" />
          <ul className="mt-3 space-y-2 text-[12px] leading-relaxed text-ink-soft">
            <li>• Nenhum dado pessoal de jovens atendidos é publicado.</li>
            <li>• Resultados são apresentados de forma agregada por município, eixo e indicador.</li>
            <li>• Informações de comprovação ficam restritas aos perfis autorizados.</li>
            <li>• Acesso, envio, aprovação e exportação geram trilha de auditoria.</li>
            <li>• Tratamento conforme LGPD e diretrizes do edital.</li>
          </ul>
          <Link href="/login" className="mt-4 inline-block text-[11.5px] font-bold text-verde">
            Acessar área restrita de gestão →
          </Link>
        </Card>
      </section>
    </PublicLayout>
  );
}
