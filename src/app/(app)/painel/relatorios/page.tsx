import Link from "next/link";
import { ColumnChart, HBarChart } from "@/components/charts";
import { Badge, Card, EmptyState, PageHeader, Progress, SectionTitle, SituationBadge, Stat } from "@/components/ui";
import {
  getAxisOptions,
  getAxisPerformance,
  getGoalProgress,
  getMunicipalityPerformance,
  getOverview,
  getRegionPerformance,
  REGIONS,
} from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ regiao?: string; eixo?: string; periodo?: string }>;
}) {
  const params = await searchParams;
  const period = params.periodo === "2024" ? "2024" : "2025";
  const region = params.regiao || undefined;
  const axis = params.eixo || undefined;

  const [overview, axes, axisPerformance, regions, municipalities, goals] = await Promise.all([
    getOverview(period),
    getAxisOptions(),
    getAxisPerformance(period, region),
    getRegionPerformance(period, axis),
    getMunicipalityPerformance({ period, region, axis }),
    getGoalProgress(period),
  ]);

  const withData = municipalities.filter((row) => row.execution !== null);
  const withoutData = municipalities.filter((row) => row.execution === null);
  const filterQuery = new URLSearchParams(
    Object.entries({ period, regiao: region, eixo: axis }).filter(([, value]) => Boolean(value)) as [string, string][],
  ).toString();
  const filteredGoals = axis ? goals.filter((goal) => goal.axisCode === axis) : goals;
  const risky = [...filteredGoals].sort((a, b) => (a.execution ?? 999) - (b.execution ?? 999)).slice(0, 8);
  const pendingTotal = municipalities.reduce((acc, row) => acc + row.pending, 0);
  const corrections = municipalities.reduce((acc, row) => acc + row.corrections, 0);
  const lateGoals = goals.filter((goal) => new Date(goal.deadline) < new Date("2027-01-01"));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Módulo 4 · dashboards e relatórios gerenciais"
        title="Relatórios e conformidade"
        description="Consolidação estadual com filtros por região e eixo estratégico, comparativo municipal, monitoramento de conformidade e exportação XLSX/CSV."
        actions={
          <>
            <Link href={`/api/export?format=csv&${filterQuery}`} className="btn btn-ghost">
              Exportar CSV
            </Link>
            <Link href={`/api/export?format=xlsx&${filterQuery}`} className="btn btn-primary">
              Exportar XLSX
            </Link>
          </>
        }
      />

      <Card className="p-4">
        <form action="/painel/relatorios" method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto]">
          <div>
            <label className="label" htmlFor="regiao">
              Região geográfica
            </label>
            <select id="regiao" name="regiao" defaultValue={region ?? ""} className="select">
              <option value="">Todas as regiões</option>
              {REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="eixo">
              Eixo estratégico
            </label>
            <select id="eixo" name="eixo" defaultValue={axis ?? ""} className="select">
              <option value="">Todos os eixos</option>
              {axes.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="periodo">
              Ciclo
            </label>
            <select id="periodo" name="periodo" defaultValue={period} className="select">
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="btn btn-primary">
              Gerar relatório
            </button>
            <Link href="/painel/relatorios" className="btn btn-ghost">
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Execução consolidada" value={formatPercent(overview.execution)} hint={`${formatPercent(overview.previousExecution)} no ciclo anterior`} />
        <Stat label="Municípios no recorte" value={formatNumber(municipalities.length)} hint={`${formatNumber(withoutData.length)} sem dados aprovados`} accent="#2c7c8a" />
        <Stat label="Pendências de validação" value={formatNumber(pendingTotal)} hint={`${formatNumber(corrections)} correções solicitadas`} accent="#b8862b" />
        <Stat label="Metas com prazo até 2026" value={formatNumber(lateGoals.length)} hint={`${formatNumber(goals.length)} metas no plano`} accent="#b4472f" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <SectionTitle eyebrow="Comparativo" title="Execução por eixo" description="Percentual médio de alcance das metas de referência municipal." />
          <div className="mt-3">
            <ColumnChart
              data={axisPerformance.map((item) => ({ label: item.name, value: item.execution, color: item.color }))}
            />
          </div>
        </Card>
        <Card className="p-5">
          <SectionTitle eyebrow="Território" title="Execução por região" description="Ordenado da maior para a menor execução média." />
          <div className="mt-3">
            <HBarChart
              items={[...regions]
                .sort((a, b) => (b.execution ?? -1) - (a.execution ?? -1))
                .slice(0, 9)
                .map((item) => ({
                  label: item.region,
                  value: item.execution,
                  hint: `${formatNumber(item.participating)}/${formatNumber(item.municipalities)} municípios com dados · ${formatNumber(item.pending)} pendências`,
                }))}
            />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-2 px-5 pt-5">
          <SectionTitle eyebrow="Monitoramento de conformidade" title="Cobertura e pendências por região" />
          <Badge tone={pendingTotal > 0 ? "warn" : "good"}>{formatNumber(pendingTotal)} registros pendentes</Badge>
        </div>
        <div className="scroll-x mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Região</th>
                <th>Municípios</th>
                <th>Com dados aprovados</th>
                <th style={{ minWidth: 160 }}>Cobertura</th>
                <th style={{ minWidth: 160 }}>Execução</th>
                <th>Pendências</th>
                <th>Conformidade</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((item) => {
                const coverage = (item.participating / Math.max(1, item.municipalities)) * 100;
                return (
                  <tr key={item.region}>
                    <td className="font-medium text-ink">{item.region}</td>
                    <td className="num">{formatNumber(item.municipalities)}</td>
                    <td className="num">{formatNumber(item.participating)}</td>
                    <td>
                      <Progress value={coverage} color="#3e6b9c" />
                    </td>
                    <td>
                      <Progress value={item.execution} color="#146b52" />
                    </td>
                    <td>
                      <span className="badge badge-warn">{formatNumber(item.pending)}</span>
                    </td>
                    <td>
                      <Badge tone={coverage >= 85 ? "good" : coverage >= 60 ? "info" : coverage >= 35 ? "warn" : "bad"}>
                        {coverage >= 85 ? "Regular" : coverage >= 60 ? "Parcial" : coverage >= 35 ? "Atenção" : "Crítico"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <SectionTitle eyebrow="Comparação entre municípios" title="Ranking de execução" description="Top 12 municípios do recorte selecionado." />
          </div>
          <div className="scroll-x mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Município</th>
                  <th>Região</th>
                  <th style={{ minWidth: 150 }}>Execução</th>
                  <th>Pendências</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {withData.slice(0, 12).map((row, index) => (
                  <tr key={row.id}>
                    <td className="num text-muted">{index + 1}</td>
                    <td>
                      <Link href={`/painel/municipios/${row.id}`} className="font-medium text-ink hover:text-verde">
                        {row.name}
                      </Link>
                    </td>
                    <td className="text-[11.5px] text-muted">{row.region}</td>
                    <td>
                      <Progress value={row.execution} />
                    </td>
                    <td className="num">{formatNumber(row.pending)}</td>
                    <td>
                      <SituationBadge execution={row.execution} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!withData.length ? (
              <div className="p-6">
                <EmptyState title="Sem dados no recorte" description="Selecione outro eixo, região ou ciclo para visualizar o ranking." />
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle eyebrow="Metas críticas" title="Prioridades do relatório" description="Metas com menor execução no recorte." />
          <div className="mt-3 space-y-2">
            {risky.map((goal) => (
              <div key={goal.goalId} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10.5px] text-muted">
                      {goal.code} · {goal.axis}
                    </p>
                    <p className="text-[12px] font-semibold leading-snug text-ink">{goal.title}</p>
                  </div>
                  <SituationBadge execution={goal.execution} />
                </div>
                <div className="mt-2">
                  <Progress value={goal.execution} color={goal.axisColor} />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  Meta {formatNumber(goal.target)} {goal.unit} · prazo {goal.deadline.split("-").reverse().join("/")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle
          eyebrow="Conformidade"
          title="Municípios sem dados aprovados no ciclo"
          description="Lista de territórios que exigem contato da gestão estadual e apoio à alimentação de dados."
          action={<Badge tone={withoutData.length ? "bad" : "good"}>{formatNumber(withoutData.length)} municípios</Badge>}
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {withoutData.slice(0, 60).map((row) => (
            <Link key={row.id} href={`/painel/municipios/${row.id}`} className="badge badge-neutral hover:bg-[#e7e4da]">
              {row.name}
            </Link>
          ))}
          {!withoutData.length ? <p className="text-[12px] text-verde">Todos os municípios do recorte possuem dados aprovados.</p> : null}
          {withoutData.length > 60 ? <span className="text-[11px] text-muted">+{withoutData.length - 60} municípios</span> : null}
        </div>
      </Card>
    </div>
  );
}
