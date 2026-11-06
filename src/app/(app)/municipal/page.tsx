import Link from "next/link";
import { HBarChart } from "@/components/charts";
import { Badge, Card, EmptyState, Notice, PageHeader, Progress, SectionTitle, SituationBadge, Stat } from "@/components/ui";
import { reviewResultAction } from "@/lib/actions";
import { requireMunicipal } from "@/lib/auth";
import {
  getMunicipalContext,
  getMunicipalityAxisPerformance,
  getMunicipalityIndicators,
  getResultsQueue,
  getTeam,
} from "@/lib/data";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MunicipalPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; periodo?: string }>;
}) {
  const user = await requireMunicipal();
  const params = await searchParams;
  const period = params.periodo === "2024" ? "2024" : "2025";
  const municipalityId = user.municipalityId as number;

  const [context, indicators, axisPerformance, submitted, team] = await Promise.all([
    getMunicipalContext(municipalityId, period),
    getMunicipalityIndicators(municipalityId),
    getMunicipalityAxisPerformance(municipalityId, period),
    getResultsQueue({ status: "enviado", municipalityId, limit: 6 }),
    getTeam(municipalityId),
  ]);

  const performance = context.performance;
  const pendingCorrections = indicators.filter((row) => row.status2025 === "corrigir");
  const missing = indicators.filter((row) => row.status2025 === null);
  const approved = indicators.filter((row) => row.status2025 === "aprovado").length;
  const isManager = user.role === "municipal_gestor";
  const coverage = indicators.length ? (approved / indicators.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Área do município · ${user.municipalityName} / PR`}
        title="Painel municipal da juventude"
        description="Acompanhe suas metas, envie os resultados das ações e valide os dados produzidos pela equipe técnica municipal."
        actions={
          <>
            <div className="flex rounded-lg border border-line bg-white p-1">
              {["2025", "2024"].map((item) => (
                <Link key={item} href={`/municipal?periodo=${item}`} className="tab" data-active={period === item}>
                  {item}
                </Link>
              ))}
            </div>
            <Link href="/municipal/indicadores" className="btn btn-primary">
              Preencher indicadores
            </Link>
          </>
        }
      />

      {params.ok ? <Notice>{params.ok}</Notice> : null}
      {params.erro ? <Notice tone="warn">{params.erro}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Execução do município"
          value={formatPercent(performance?.execution ?? null)}
          hint={performance ? <SituationBadge execution={performance.execution} /> : "sem dados aprovados"}
        />
        <Stat
          label="Posição no estado"
          value={context.rank ? `${context.rank}º` : "—"}
          hint={`entre ${formatNumber(context.totalWithData)} municípios com dados`}
          accent="#2c7c8a"
        />
        <Stat
          label="Indicadores aprovados"
          value={`${approved}/${indicators.length}`}
          hint={`cobertura de ${formatPercent(coverage)}`}
          accent="#146b52"
        />
        <Stat
          label="Aguardando gestor"
          value={formatNumber(performance?.pending ?? 0)}
          hint={isManager ? "você pode validar abaixo" : "aguardando validação do gestor"}
          accent="#b8862b"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <Card className="p-5">
          <SectionTitle
            eyebrow="Desempenho"
            title="Execução por eixo estratégico"
            description="Percentual de alcance das metas de referência definidas pelo Estado."
          />
          <div className="mt-4">
            {axisPerformance.length ? (
              <HBarChart
                items={axisPerformance.map((axis) => ({
                  label: axis.axis,
                  value: axis.execution,
                  color: axis.color,
                  hint: `${axis.approved} fontes aprovadas · ${axis.pending} aguardando validação`,
                }))}
              />
            ) : (
              <EmptyState title="Sem dados neste ciclo" description="Preencha os indicadores para habilitar o acompanhamento por eixo." />
            )}
          </div>
          <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
            <div>
              <p className="eyebrow">Aprovados</p>
              <p className="num display text-[22px] text-ink">{formatNumber(performance?.approved ?? 0)}</p>
            </div>
            <div>
              <p className="eyebrow">Correções</p>
              <p className="num display text-[22px] text-ink">{formatNumber(pendingCorrections.length)}</p>
            </div>
            <div>
              <p className="eyebrow">Sem preenchimento</p>
              <p className="num display text-[22px] text-ink">{formatNumber(missing.length)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle
            eyebrow="Pendências"
            title={isManager ? "Validar dados da equipe técnica" : "Correções solicitadas"}
            description={
              isManager
                ? "Como gestor municipal, você confere os dados enviados pela equipe e decide sobre a aprovação."
                : "Ajuste os indicadores com correção solicitada e reenvie ao gestor municipal."
            }
            action={<Link href="/municipal/indicadores" className="btn btn-ghost btn-sm">Abrir</Link>}
          />
          <div className="mt-3 space-y-2">
            {isManager
              ? submitted.map((item) => (
                  <div key={item.id} className="rounded-xl border border-line p-3">
                    <p className="text-[11.5px] font-semibold text-ink">{item.indicator}</p>
                    <p className="text-[10.5px] text-muted">
                      {item.axis} · {item.period} · {formatDateTime(item.submittedAt)}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="num text-[12px] font-bold text-ink">
                        {formatNumber(item.value, 1)} <span className="text-[10px] font-normal text-muted">{item.unit}</span>
                      </span>
                      <form action={reviewResultAction} className="flex gap-1.5">
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="backTo" value="/municipal" />
                        <button type="submit" name="decision" value="aprovar" className="btn btn-green btn-sm">
                          Aprovar
                        </button>
                        <button type="submit" name="decision" value="corrigir" className="btn btn-danger btn-sm">
                          Corrigir
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              : pendingCorrections.slice(0, 5).map((item) => (
                  <div key={item.indicatorId} className="rounded-xl border border-[#f0cfc6] bg-[#fdf6f3] p-3">
                    <p className="text-[11.5px] font-semibold text-ink">{item.indicator}</p>
                    <p className="text-[10.5px] text-muted">{item.axis}</p>
                    {item.reviewNote ? <p className="mt-1 text-[10.5px] text-rust">Parecer: {item.reviewNote}</p> : null}
                    <Link href="/municipal/indicadores" className="mt-1.5 inline-block text-[11px] font-semibold text-verde">
                      Corrigir indicador →
                    </Link>
                  </div>
                ))}
            {isManager && !submitted.length ? (
              <EmptyState title="Nada para validar" description="Os dados enviados pela equipe técnica aparecerão aqui para sua aprovação." />
            ) : null}
            {!isManager && !pendingCorrections.length ? (
              <EmptyState title="Sem correções" description="Nenhum indicador com correção solicitada neste momento." />
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle
          eyebrow="Governança municipal"
          title="Equipe com acesso ao município"
          description={`${team.length} usuários vinculados · ${team.filter((member) => member.active).length} ativos`}
          action={
            isManager ? (
              <Link href="/municipal/equipe" className="btn btn-ghost btn-sm">
                Gerenciar equipe
              </Link>
            ) : (
              <Badge tone="neutral">Somente o gestor administra usuários</Badge>
            )
          }
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {team.map((member) => (
            <div key={member.id} className="rounded-lg border border-line px-3 py-2">
              <p className="text-[11.5px] font-semibold text-ink">{member.name}</p>
              <p className="text-[10px] text-muted">{member.role === "municipal_gestor" ? "Gestor municipal" : "Equipe técnica"}</p>
            </div>
          ))}
          {!team.length ? <p className="text-[11.5px] text-muted">Nenhum usuário cadastrado.</p> : null}
        </div>
      </Card>
    </div>
  );
}
