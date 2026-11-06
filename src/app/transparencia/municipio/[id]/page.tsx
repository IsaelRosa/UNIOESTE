import Link from "next/link";
import { notFound } from "next/navigation";
import { HBarChart } from "@/components/charts";
import { PublicLayout } from "@/components/public-shell";
import { Badge, Card, EmptyState, Progress, SectionTitle, SituationBadge, Stat } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import {
  getMunicipalityAxisPerformance,
  getMunicipalityById,
  getMunicipalityIndicators,
  getMunicipalityPerformance,
} from "@/lib/data";
import { formatNumber, formatPercent, statusMeta } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MunicipioPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const municipalityId = Number(id);
  if (!Number.isFinite(municipalityId)) notFound();
  const period = query.periodo === "2024" ? "2024" : "2025";

  const municipality = await getMunicipalityById(municipalityId);
  if (!municipality) notFound();

  const [user, indicators, axisPerformance, ranking] = await Promise.all([
    getSessionUser(),
    getMunicipalityIndicators(municipalityId),
    getMunicipalityAxisPerformance(municipalityId, period),
    getMunicipalityPerformance({ period }),
  ]);

  const mine = ranking.find((row) => row.id === municipalityId);
  const position = ranking.findIndex((row) => row.id === municipalityId);
  const approved = indicators.filter((row) => row.status2025 === "aprovado").length;
  const grouped = new Map<string, typeof indicators>();
  for (const indicator of indicators) {
    if (!grouped.has(indicator.axis)) grouped.set(indicator.axis, []);
    grouped.get(indicator.axis)!.push(indicator);
  }

  return (
    <PublicLayout user={user} active="transparencia">
      <div className="py-6">
        <Link href="/transparencia#dados" className="text-[11.5px] font-semibold text-muted hover:text-ink">
          ← Voltar ao portal de transparência
        </Link>
      </div>

      <section>
        <p className="eyebrow">{municipality.region} · código IBGE {municipality.ibge_code}</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="display text-[34px] leading-tight text-ink">{municipality.name}</h1>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Ciclo {period}</Badge>
            <SituationBadge execution={mine?.execution ?? null} />
            <div className="flex rounded-lg border border-line bg-white p-1">
              {["2025", "2024"].map((item) => (
                <Link key={item} href={`/transparencia/municipio/${municipalityId}?periodo=${item}`} className="tab" data-active={period === item}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted">
          Resultados públicos da política estadual da juventude neste município. Dados agregados, sem qualquer informação
          pessoal das pessoas atendidas.
        </p>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Execução consolidada" value={formatPercent(mine?.execution ?? null)} hint="metas de referência" />
        <Stat label="Posição estadual" value={position >= 0 && mine?.execution !== null ? `${position + 1}º` : "—"} hint={`${formatNumber(ranking.filter((row) => row.execution !== null).length)} municípios com dados`} accent="#2c7c8a" />
        <Stat label="Registros aprovados" value={formatNumber(mine?.approved ?? 0)} hint={`${approved} indicadores aprovados`} accent="#146b52" />
        <Stat label="Em análise" value={formatNumber(mine?.pending ?? 0)} hint="aguardando validação estadual" accent="#b8862b" />
      </section>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <SectionTitle eyebrow="Desempenho" title="Execução por eixo" />
          <div className="mt-3">
            {axisPerformance.length ? (
              <HBarChart
                items={axisPerformance.map((axis) => ({ label: axis.axis, value: axis.execution, color: axis.color, hint: `${axis.approved} registros aprovados` }))}
              />
            ) : (
              <EmptyState title="Sem dados públicos" description="Não há registros aprovados para este município no ciclo selecionado." />
            )}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="px-5 pt-5">
            <SectionTitle eyebrow="Indicadores" title="Resultados publicados" description="Somente registros aprovados pelo fluxo municipal e estadual." />
          </div>
          <div className="mt-3 space-y-3 px-5 pb-5">
            {[...grouped.entries()].map(([axisName, rows]) => (
              <div key={axisName}>
                <p className="mb-1 text-[11.5px] font-semibold text-ink">{axisName}</p>
                <div className="overflow-hidden rounded-lg border border-line">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Indicador</th>
                        <th>Referência</th>
                        <th>Resultado</th>
                        <th style={{ minWidth: 120 }}>Execução</th>
                        <th>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .filter((row) => row.status2025 === "aprovado")
                        .map((row) => {
                          const meta = statusMeta("aprovado");
                          return (
                            <tr key={row.indicatorId}>
                              <td className="text-[11.5px] text-ink">{row.indicator}</td>
                              <td className="num text-[11px] text-muted">
                                {formatNumber(row.target, 1)} {row.unit}
                              </td>
                              <td className="num text-[11.5px] font-semibold text-ink">
                                {formatNumber(row.value2025, 1)} {row.unit}
                              </td>
                              <td>
                                <Progress value={row.execution} color={row.axisColor} />
                              </td>
                              <td>
                                <Badge tone={meta.tone}>{meta.label}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      {!rows.some((row) => row.status2025 === "aprovado") ? (
                        <tr>
                          <td colSpan={5} className="text-[11px] text-muted">
                            Nenhum registro aprovado neste eixo.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PublicLayout>
  );
}
