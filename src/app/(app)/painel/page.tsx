import Link from "next/link";
import { Donut, Gauge, HBarChart, TrendChart } from "@/components/charts";
import { Badge, Card, EmptyState, PageHeader, Progress, SectionTitle, SituationBadge, Stat } from "@/components/ui";
import { requireState } from "@/lib/auth";
import {
  getAuditLogs,
  getAxisPerformance,
  getGoalProgress,
  getMunicipalityPerformance,
  getOverview,
  getQueueCounts,
  getRegionPerformance,
  getTrend,
} from "@/lib/data";
import { formatDateTime, formatNumber, formatPercent, situation } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; negado?: string }>;
}) {
  const user = await requireState();
  const params = await searchParams;
  const period = params.periodo === "2024" ? "2024" : "2025";

  const [overview, axes, regions, trend, municipalities, counts, goals, audit] = await Promise.all([
    getOverview(period),
    getAxisPerformance(period),
    getRegionPerformance(period),
    getTrend(),
    getMunicipalityPerformance({ period }),
    getQueueCounts(),
    getGoalProgress(period),
    getAuditLogs(6),
  ]);

  const withData = municipalities.filter((row) => row.execution !== null);
  const top = withData.slice(0, 6);
  const bottom = [...withData].reverse().slice(0, 6);
  const urgentGoals = [...goals].sort((a, b) => (a.execution ?? 999) - (b.execution ?? 999)).slice(0, 4);
  const trendDelta =
    overview.execution !== null && overview.previousExecution !== null ? overview.execution - overview.previousExecution : null;
  const pendingTotal = overview.pending + overview.corrections + overview.approved;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Painel administrativo estadual"
        title="Visão geral do Plano Estadual da Juventude"
        description={`Ciclo de monitoramento ${period} · ${overview.municipalities} municípios · consolidação das fontes validadas pelo gestor municipal.`}
        actions={
          <>
            <div className="flex rounded-lg border border-line bg-white p-1">
              {["2025", "2024"].map((item) => (
                <Link key={item} href={`/painel?periodo=${item}`} className="tab" data-active={period === item}>
                  {item}
                </Link>
              ))}
            </div>
            <Link href="/api/export?format=xlsx&period=2025" className="btn btn-ghost">
              Exportar XLSX
            </Link>
            <Link href="/painel/validacao" className="btn btn-primary">
              Validar envios {counts.enviado ? `(${formatNumber(counts.enviado)})` : ""}
            </Link>
          </>
        }
      />

      {params.negado ? (
        <div className="rounded-xl border border-[#e7d3a9] bg-[#fbf4e5] px-4 py-3 text-[12.5px] text-[#7d5a17]">
          Seu perfil não possui permissão para acessar a área solicitada. A tentativa foi registrada na trilha de auditoria.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Execução média do plano"
          value={formatPercent(overview.execution)}
          trend={{ value: trendDelta, label: "Variação em relação ao ciclo anterior" }}
          hint={`ciclo ${period}`}
        />
        <Stat
          label="Municípios com dados aprovados"
          value={`${formatNumber(overview.participants)}`}
          hint={`de ${formatNumber(overview.municipalities)} municípios (${formatPercent((overview.participants / Math.max(1, overview.municipalities)) * 100)})`}
          accent="#2c7c8a"
        />
        <Stat
          label="Aguardando validação"
          value={formatNumber(overview.pending)}
          hint={`${formatNumber(overview.corrections)} correções solicitadas`}
          accent="#b8862b"
        />
        <Stat
          label="Metas em zona crítica"
          value={formatNumber(overview.goalsCritical)}
          hint={`${formatNumber(overview.goalsOnTrack)} metas com execução ≥ 85%`}
          accent="#b4472f"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <SectionTitle
            eyebrow="Evolução do monitoramento"
            title="Execução média por ciclo"
            description="Percentual médio de alcance das metas municipais, considerando apenas registros aprovados."
            action={<Badge tone={trendDelta !== null && trendDelta >= 0 ? "good" : "warn"}>{trendDelta === null ? "sem base" : `${trendDelta >= 0 ? "+" : ""}${formatNumber(trendDelta, 1)} p.p.`}</Badge>}
          />
          <div className="mt-4">
            <TrendChart data={trend} />
          </div>
          <div className="mt-3 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
            <div>
              <p className="eyebrow">Indicadores ativos</p>
              <p className="num display text-[22px] text-ink">{formatNumber(overview.indicators)}</p>
            </div>
            <div>
              <p className="eyebrow">Metas do plano</p>
              <p className="num display text-[22px] text-ink">{formatNumber(overview.goals)}</p>
            </div>
            <div>
              <p className="eyebrow">Registros aprovados</p>
              <p className="num display text-[22px] text-ink">{formatNumber(overview.approved)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle eyebrow="Situação dos envios" title="Qualidade do dado" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <Gauge value={overview.execution} label="Execução média" />
            <div className="min-w-[172px] flex-1">
              <Donut
                total={pendingTotal}
                centerLabel="registros"
                segments={[
                  { label: "Aprovados", value: overview.approved, color: "#146b52" },
                  { label: "Aguardando", value: overview.pending, color: "#b8862b" },
                  { label: "Correção", value: overview.corrections, color: "#b4472f" },
                ]}
              />
            </div>
          </div>
          <Link href="/painel/validacao" className="mt-4 block rounded-lg bg-[#f7f4ec] px-3 py-2.5 text-[12px] font-semibold text-ink hover:bg-[#f1ede1]">
            {formatNumber(counts.enviado ?? 0)} registros aguardam análise estadual →
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <SectionTitle
            eyebrow="Eixos estratégicos"
            title="Desempenho por eixo"
            description="Execução média por eixo e número de municípios com dados aprovados."
            action={<Link href="/painel/relatorios" className="btn btn-ghost btn-sm">Detalhar</Link>}
          />
          <div className="mt-4">
            <HBarChart
              items={axes.map((axis) => ({
                label: axis.name,
                value: axis.execution,
                color: axis.color,
                hint: `${formatNumber(axis.participants)} municípios · ${formatNumber(axis.pending)} pendências · ${axis.goalCount} metas`,
              }))}
            />
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle
            eyebrow="Inteligência para decisão"
            title="Prioridades de assistência técnica"
            description="Metas com menor execução consolidada no ciclo."
            action={<Link href="/painel/plano" className="btn btn-ghost btn-sm">Ver plano</Link>}
          />
          <div className="mt-4 space-y-3">
            {urgentGoals.length ? (
              urgentGoals.map((goal) => (
                <div key={goal.goalId} className="rounded-xl border border-line p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-neutral">{goal.code}</span>
                        <span className="text-[10.5px] text-muted">{goal.axis}</span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-ink">{goal.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {goal.responsible} · prazo {goal.deadline.split("-").reverse().join("/")}
                      </p>
                    </div>
                    <SituationBadge execution={goal.execution} />
                  </div>
                  <div className="mt-2">
                    <Progress value={goal.execution} color={goal.axisColor} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="Sem metas cadastradas" description="Cadastre eixos, objetivos e metas para iniciar o monitoramento." />
            )}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5">
          <SectionTitle
            eyebrow="Comparativo territorial"
            title="Desempenho por região geográfica"
            description="Regionalização parametrizável; no protótipo agrupada por polos regionais."
          />
          <Link href="/painel/mapa" className="btn btn-ghost btn-sm">
            Abrir mapa
          </Link>
        </div>
        <div className="scroll-x mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Região</th>
                <th>Municípios</th>
                <th>Com dados aprovados</th>
                <th style={{ minWidth: 180 }}>Execução média</th>
                <th>Pendências</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => (
                <tr key={region.region}>
                  <td className="font-medium text-ink">{region.region}</td>
                  <td className="num">{formatNumber(region.municipalities)}</td>
                  <td className="num">
                    {formatNumber(region.participating)}
                    <span className="text-muted"> ({formatPercent((region.participating / Math.max(1, region.municipalities)) * 100)})</span>
                  </td>
                  <td>
                    <Progress value={region.execution} color={region.execution && region.execution >= 60 ? "#146b52" : "#b8862b"} />
                  </td>
                  <td>
                    <span className="badge badge-warn">{formatNumber(region.pending)}</span>
                  </td>
                  <td>
                    <SituationBadge execution={region.execution} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle eyebrow="Referências positivas" title="Municípios com maior execução" />
          <div className="mt-3 space-y-2">
            {top.map((row, index) => (
              <Link key={row.id} href={`/painel/municipios/${row.id}`} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 hover:bg-[#fbf9f4]">
                <span className="num grid h-6 w-6 place-items-center rounded-full bg-verde-soft text-[11px] font-bold text-verde">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{row.name}</p>
                  <p className="truncate text-[10.5px] text-muted">{row.region}</p>
                </div>
                <div className="w-28">
                  <Progress value={row.execution} color="#146b52" />
                </div>
              </Link>
            ))}
            {!top.length ? <EmptyState title="Sem dados aprovados" description="Aprove envios na fila de validação para gerar o comparativo." /> : null}
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle eyebrow="Assistência técnica" title="Municípios que exigem apoio" />
          <div className="mt-3 space-y-2">
            {bottom.map((row, index) => (
              <Link key={row.id} href={`/painel/municipios/${row.id}`} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2 hover:bg-[#fbf9f4]">
                <span className="num grid h-6 w-6 place-items-center rounded-full bg-[#fbe9e4] text-[11px] font-bold text-rust">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{row.name}</p>
                  <p className="truncate text-[10.5px] text-muted">
                    {row.region} · {row.pending} pendências
                  </p>
                </div>
                <div className="w-28">
                  <Progress value={row.execution} color={situation(row.execution).tone === "bad" ? "#b4472f" : "#b8862b"} />
                </div>
              </Link>
            ))}
            {!bottom.length ? <EmptyState title="Sem dados aprovados" description="Aprove envios na fila de validação para gerar o comparativo." /> : null}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle
          eyebrow="Governança"
          title="Últimos eventos registrados"
          description={`Sessão de ${user.name} · ${user.role === "estado_admin" ? "administrador estadual" : "equipe técnica estadual"}`}
          action={<Link href="/painel/auditoria" className="btn btn-ghost btn-sm">Ver auditoria</Link>}
        />
        <ul className="mt-3 divide-y divide-[#efeae0]">
          {audit.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="badge badge-neutral">{entry.action.replaceAll("_", " ").toLowerCase()}</span>
                <p className="truncate text-[12px] text-ink-soft">{entry.detail}</p>
              </div>
              <span className="text-[10.5px] text-muted">
                {entry.userName} · {formatDateTime(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
