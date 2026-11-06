import Link from "next/link";
import { notFound } from "next/navigation";
import { HBarChart } from "@/components/charts";
import { Badge, Card, EmptyState, KeyValue, Notice, PageHeader, Progress, SectionTitle, SituationBadge, Stat } from "@/components/ui";
import { bulkApproveAction, reviewResultAction } from "@/lib/actions";
import {
  getMunicipalContext,
  getMunicipalityAxisPerformance,
  getMunicipalityById,
  getMunicipalityIndicators,
  getResultsQueue,
} from "@/lib/data";
import { formatDateTime, formatNumber, formatPercent, situation, statusMeta } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MunicipioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodo?: string; ok?: string; erro?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const municipalityId = Number(id);
  if (!Number.isFinite(municipalityId)) notFound();
  const period = query.periodo === "2024" ? "2024" : "2025";

  const municipality = await getMunicipalityById(municipalityId);
  if (!municipality) notFound();

  const [indicators, axisPerformance, context, pendingQueue] = await Promise.all([
    getMunicipalityIndicators(municipalityId),
    getMunicipalityAxisPerformance(municipalityId, period),
    getMunicipalContext(municipalityId, period),
    getResultsQueue({ status: "enviado", municipalityId, limit: 12 }),
  ]);

  const performance = context.performance;
  const execution = performance?.execution ?? null;
  const approvedIndicators = indicators.filter((row) => row.status2025 === "aprovado").length;
  const corrections = indicators.filter((row) => row.status2025 === "corrigir").length;
  const grouped = new Map<string, typeof indicators>();
  for (const indicator of indicators) {
    if (!grouped.has(indicator.axis)) grouped.set(indicator.axis, []);
    grouped.get(indicator.axis)!.push(indicator);
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link href="/painel/municipios" className="text-[11.5px] font-semibold text-muted hover:text-ink">
          ← Voltar para municípios
        </Link>
      </div>

      <PageHeader
        eyebrow={`${municipality.region} · IBGE ${municipality.ibge_code}`}
        title={municipality.name}
        description="Painel consolidado do município: indicadores por eixo, execução das metas e registros pendentes de validação."
        actions={
          <>
            <div className="flex rounded-lg border border-line bg-white p-1">
              {["2025", "2024"].map((item) => (
                <Link key={item} href={`/painel/municipios/${municipality.id}?periodo=${item}`} className="tab" data-active={period === item}>
                  {item}
                </Link>
              ))}
            </div>
            <Link href={`/painel/mapa?municipio=${municipality.id}`} className="btn btn-ghost">
              Ver no mapa
            </Link>
            <Link href={`/api/export?format=xlsx&period=${period}`} className="btn btn-ghost">
              Exportar dados
            </Link>
            {pendingQueue.length ? (
              <form action={bulkApproveAction}>
                <input type="hidden" name="municipalityId" value={municipality.id} />
                <input type="hidden" name="backTo" value={`/painel/municipios/${municipality.id}`} />
                <button type="submit" className="btn btn-green">
                  Aprovar {pendingQueue.length} pendências
                </button>
              </form>
            ) : null}
          </>
        }
      />

      {query.ok ? <Notice>{query.ok}</Notice> : null}
      {query.erro ? <Notice tone="warn">{query.erro}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Execução consolidada" value={formatPercent(execution)} hint={situation(execution).label} accent="#146b52" />
        <Stat
          label="Posição estadual"
          value={context.rank ? `${context.rank}º` : "—"}
          hint={`entre ${formatNumber(context.totalWithData)} municípios com dados`}
          accent="#2c7c8a"
        />
        <Stat
          label="Posição regional"
          value={context.regionRank ? `${context.regionRank}º` : "—"}
          hint={municipality.region}
          accent="#3e6b9c"
        />
        <Stat
          label="Indicadores aprovados"
          value={`${approvedIndicators}/${indicators.length}`}
          hint={`${formatNumber(performance?.pending ?? 0)} aguardando · ${formatNumber(corrections)} correções`}
          accent="#b8862b"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Card className="p-5">
          <SectionTitle eyebrow="Ficha territorial" title="Dados de referência" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <KeyValue label="Município" value={municipality.name} />
            <KeyValue label="Código IBGE" value={municipality.ibge_code} />
            <KeyValue label="Região" value={municipality.region} />
            <KeyValue label="Coordenadas" value={`${municipality.lat.toFixed(3)}, ${municipality.lng.toFixed(3)}`} />
            <KeyValue label="Ciclo" value={period} />
            <KeyValue label="Situação" value={<SituationBadge execution={execution} />} />
          </div>
          <div className="mt-4 rounded-xl bg-[#f7f4ec] p-3">
            <p className="eyebrow mb-1">Leitura técnica</p>
            <p className="text-[12px] leading-relaxed text-ink-soft">
              {execution === null
                ? "Sem dados aprovados no ciclo. Orienta-se contato com a gestão municipal para regularizar o envio."
                : execution >= 85
                  ? "Município com execução destacada. Verificar possibilidade de replicar práticas na região."
                  : execution >= 60
                    ? "Execução dentro do esperado, com oportunidades de melhoria nos indicadores abaixo da referência."
                    : "Execução abaixo do esperado. Priorizar assistência técnica nas metas com menor alcance."}
            </p>
          </div>
          <div className="mt-4">
            <p className="eyebrow mb-2">Execução por eixo · ciclo {period}</p>
            <HBarChart
              items={axisPerformance.map((axis) => ({
                label: axis.axis,
                value: axis.execution,
                color: axis.color,
                hint: `${axis.approved} fontes aprovadas · ${axis.pending} pendentes`,
              }))}
            />
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle
            eyebrow="Indicadores municipais"
            title="Detalhamento por eixo estratégico"
            description="Valores informados pelo município, meta de referência e execução calculada."
          />
          <div className="mt-4 space-y-4">
            {[...grouped.entries()].map(([axisName, rows]) => {
              const color = rows[0]?.axisColor ?? "#146b52";
              return (
                <div key={axisName}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <p className="text-[12px] font-semibold text-ink">{axisName}</p>
                    <Badge tone="neutral">{rows.length} indicadores</Badge>
                  </div>
                  <div className="scroll-x rounded-xl border border-line">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Indicador</th>
                          <th>Ref.</th>
                          <th>2024</th>
                          <th>2025</th>
                          <th style={{ minWidth: 140 }}>Execução</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const meta = row.status2025 ? statusMeta(row.status2025) : null;
                          return (
                            <tr key={row.indicatorId}>
                              <td>
                                <p className="text-[12px] font-medium text-ink">{row.indicator}</p>
                                <p className="text-[10px] text-muted">
                                  {row.code} · {row.unit} · {row.frequency}
                                </p>
                              </td>
                              <td className="num text-[11.5px] text-muted">{formatNumber(row.target, 1)}</td>
                              <td className="num text-[11.5px] text-muted">{formatNumber(row.value2024, 1)}</td>
                              <td className="num text-[12px] font-semibold text-ink">{formatNumber(row.value2025, 1)}</td>
                              <td>
                                <Progress value={row.execution} color={color} />
                              </td>
                              <td>{meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : <Badge tone="neutral">Sem dado</Badge>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {!indicators.length ? <EmptyState title="Sem indicadores" description="Nenhum indicador cadastrado na estrutura do plano." /> : null}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle
          eyebrow="Validação estadual"
          title="Registros aguardando análise"
          description="Aprovar devolve o dado ao município como consolidado; solicitar correção abre prazo para revisão municipal."
          action={<Badge tone={pendingQueue.length ? "warn" : "good"}>{pendingQueue.length} pendentes</Badge>}
        />
        <div className="mt-4 space-y-3">
          {pendingQueue.map((item) => (
            <div key={item.id} className="rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[12px] font-semibold text-ink">
                    {item.indicatorCode} · {item.indicator}
                  </p>
                  <p className="text-[10.5px] text-muted">
                    {item.axis} · ciclo {item.period} · enviado em {formatDateTime(item.submittedAt)}
                  </p>
                </div>
                <div className="num text-right text-[12px]">
                  <span className="font-bold text-ink">{formatNumber(item.value, 1)}</span>
                  <span className="text-muted"> / ref. {formatNumber(item.target, 1)}</span>
                </div>
              </div>
              <form action={reviewResultAction} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="backTo" value={`/painel/municipios/${municipality.id}`} />
                <input name="note" className="input min-w-[220px] flex-1" placeholder="Parecer técnico (opcional)" />
                <button type="submit" name="decision" value="aprovar" className="btn btn-green btn-sm">
                  Aprovar
                </button>
                <button type="submit" name="decision" value="corrigir" className="btn btn-danger btn-sm">
                  Solicitar correção
                </button>
              </form>
            </div>
          ))}
          {!pendingQueue.length ? (
            <EmptyState title="Nenhuma pendência" description="Todos os envios deste município já foram analisados pela gestão estadual." />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
