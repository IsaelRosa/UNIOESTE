import Link from "next/link";
import { Badge, Card, EmptyState, Notice, PageHeader, Progress, SectionTitle, Stat } from "@/components/ui";
import { createGoalAction } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";
import { getPlan } from "@/lib/data";
import { formatNumber, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const [user, plan, params] = await Promise.all([getSessionUser(), getPlan(), searchParams]);
  const axes = plan;
  const goalCount = axes.reduce((acc, axis) => acc + axis.objectives.reduce((sum, objective) => sum + objective.goals.length, 0), 0);
  const indicatorCount = axes.reduce(
    (acc, axis) =>
      acc +
      axis.objectives.reduce(
        (sum, objective) => sum + objective.goals.reduce((total, goal) => total + goal.actions.reduce((n, action) => n + action.indicators.length, 0), 0),
        0,
      ),
    0,
  );
  const executionValues = axes
    .flatMap((axis) => axis.objectives.flatMap((objective) => objective.goals.map((goal) => goal.execution)))
    .filter((value): value is number => value !== null);
  const avgExecution = executionValues.length ? executionValues.reduce((a, b) => a + b, 0) / executionValues.length : null;
  const objectives = axes.flatMap((axis) => axis.objectives.map((objective) => ({ ...objective, axis: axis.name })));

  if (!goalCount) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Plano & metas" title="Estrutura do Plano Estadual da Juventude" />
        <EmptyState title="Nenhuma meta cadastrada" description="Execute o script de seed para carregar a estrutura do plano ou cadastre uma nova meta." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Módulo 1 · painel administrativo estadual"
        title="Plano Estadual da Juventude"
        description="Hierarquia completa: eixo estratégico → objetivo → meta → ação → indicador. Prazos, responsáveis e peso de cada meta ficam versionados e auditáveis."
        actions={
          <>
            <Link href="/painel/relatorios" className="btn btn-ghost">
              Relatórios
            </Link>
            {user?.role === "estado_admin" ? (
              <a href="#nova-meta" className="btn btn-primary">
                Nova meta
              </a>
            ) : null}
          </>
        }
      />

      {params.ok ? <Notice>{params.ok}</Notice> : null}
      {params.erro ? <Notice tone="warn">{params.erro}</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Eixos estratégicos" value={formatNumber(axes.length)} hint="estrutura do plano" />
        <Stat label="Metas cadastradas" value={formatNumber(goalCount)} hint="com prazo e responsável" accent="#2c7c8a" />
        <Stat label="Indicadores monitorados" value={formatNumber(indicatorCount)} hint="fontes declaradas" accent="#b8862b" />
        <Stat label="Execução média" value={formatPercent(avgExecution)} hint="metas com dados aprovados" accent="#3e6b9c" />
      </div>

      <div className="space-y-3">
        {axes.map((axis) => {
          const axisGoals = axis.objectives.flatMap((objective) => objective.goals);
          const axisExec = axisGoals.map((goal) => goal.execution).filter((value): value is number => value !== null);
          const axisAvg = axisExec.length ? axisExec.reduce((a, b) => a + b, 0) / axisExec.length : null;
          return (
            <details key={axis.id} className="card overflow-hidden" open={axes.indexOf(axis) === 0}>
              <summary className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="h-9 w-1.5 rounded-full" style={{ background: axis.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-neutral">{axis.code}</span>
                    <h3 className="text-[14.5px] font-semibold text-ink">{axis.name}</h3>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {axis.objectives.length} objetivos · {axisGoals.length} metas ·{" "}
                    {axisGoals.reduce((acc, goal) => acc + goal.actions.length, 0)} ações
                  </p>
                </div>
                <div className="w-40">
                  <Progress value={axisAvg} color={axis.color} />
                </div>
                <span className="text-[11px] font-semibold text-verde">abrir</span>
              </summary>
              <div className="space-y-4 border-t border-line bg-[#fdfcf8] px-5 py-4">
                <p className="text-[12px] leading-relaxed text-muted">{axis.description}</p>
                {axis.objectives.map((objective) => (
                  <div key={objective.id}>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-accent">{objective.code}</span>
                      <p className="text-[12.5px] font-semibold text-ink">{objective.name}</p>
                    </div>
                    <div className="mt-2 grid gap-3 lg:grid-cols-2">
                      {objective.goals.map((goal) => (
                        <div key={goal.id} className="card-flat bg-white p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="badge badge-neutral">{goal.code}</span>
                                <span className="text-[10px] text-muted">peso {goal.weight}</span>
                              </div>
                              <p className="mt-1 text-[13px] font-semibold leading-snug text-ink">{goal.title}</p>
                            </div>
                            <span className="num shrink-0 text-[12px] font-bold" style={{ color: axis.color }}>
                              {formatPercent(goal.execution)}
                            </span>
                          </div>
                          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{goal.description}</p>
                          <div className="mt-2">
                            <Progress value={goal.execution} color={axis.color} />
                          </div>
                          <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px] text-muted">
                            <div>
                              <dt className="inline font-semibold text-ink-soft">Meta: </dt>
                              <dd className="inline">
                                {formatNumber(goal.target)} {goal.unit}
                              </dd>
                            </div>
                            <div>
                              <dt className="inline font-semibold text-ink-soft">Linha de base: </dt>
                              <dd className="inline">{formatNumber(goal.baseline)}</dd>
                            </div>
                            <div>
                              <dt className="inline font-semibold text-ink-soft">Prazo: </dt>
                              <dd className="inline">{goal.deadline.split("-").reverse().join("/")}</dd>
                            </div>
                            <div>
                              <dt className="inline font-semibold text-ink-soft">Responsável: </dt>
                              <dd className="inline">{goal.responsible}</dd>
                            </div>
                          </dl>
                          <details className="mt-2 border-t border-line pt-2">
                            <summary className="text-[11px] font-semibold text-verde">Ações e indicadores ({goal.actions.length})</summary>
                            <ul className="mt-2 space-y-2">
                              {goal.actions.map((action) => (
                                <li key={action.id} className="rounded-lg border border-line bg-[#fdfcf8] p-2">
                                  <p className="text-[11.5px] font-semibold text-ink">
                                    {action.code} · {action.name}
                                  </p>
                                  <p className="text-[10.5px] text-muted">{action.responsible}</p>
                                  <ul className="mt-1 space-y-1">
                                    {action.indicators.map((indicator) => (
                                      <li key={indicator.id} className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-ink-soft">
                                        <span className="badge badge-neutral">{indicator.code}</span>
                                        <span className="flex-1">{indicator.name}</span>
                                        <span className="num text-muted">
                                          ref. {formatNumber(indicator.target)} {indicator.unit} · {indicator.frequency}
                                        </span>
                                      </li>
                                    ))}
                                    {!action.indicators.length ? <li className="text-[10.5px] text-muted">Sem indicadores vinculados.</li> : null}
                                  </ul>
                                </li>
                              ))}
                              {!goal.actions.length ? <li className="text-[11px] text-muted">Nenhuma ação cadastrada.</li> : null}
                            </ul>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>

      {user?.role === "estado_admin" ? (
        <Card id="nova-meta" className="p-5">
          <SectionTitle
            eyebrow="Administração do plano"
            title="Cadastrar nova meta"
            description="A meta é vinculada a um objetivo existente e entra imediatamente no acompanhamento estadual."
            action={<Badge tone="accent">Perfil administrador</Badge>}
          />
          <form action={createGoalAction} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="xl:col-span-2">
              <label className="label" htmlFor="objectiveId">
                Objetivo vinculado
              </label>
              <select id="objectiveId" name="objectiveId" className="select" required>
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>
                    {objective.axis} · {objective.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="code">
                Código (opcional)
              </label>
              <input id="code" name="code" className="input" placeholder="EDU-M3" />
            </div>
            <div>
              <label className="label" htmlFor="weight">
                Peso
              </label>
              <input id="weight" name="weight" type="number" min="1" max="5" defaultValue={1} className="input" />
            </div>
            <div className="xl:col-span-2">
              <label className="label" htmlFor="title">
                Título da meta
              </label>
              <input id="title" name="title" className="input" required placeholder="Ampliar a oferta de ..." />
            </div>
            <div>
              <label className="label" htmlFor="target">
                Valor da meta
              </label>
              <input id="target" name="target" type="number" min="0" step="0.1" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="unit">
                Unidade
              </label>
              <input id="unit" name="unit" className="input" required placeholder="jovens, %, municípios" />
            </div>
            <div>
              <label className="label" htmlFor="baseline">
                Linha de base
              </label>
              <input id="baseline" name="baseline" type="number" min="0" step="0.1" defaultValue={0} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="deadline">
                Prazo
              </label>
              <input id="deadline" name="deadline" type="date" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="responsible">
                Responsável
              </label>
              <input id="responsible" name="responsible" className="input" placeholder="Secretaria / Coordenadoria" />
            </div>
            <div className="xl:col-span-4">
              <label className="label" htmlFor="description">
                Descrição
              </label>
              <textarea id="description" name="description" className="textarea" rows={2} placeholder="Descrição do resultado esperado e forma de cálculo." />
            </div>
            <div className="xl:col-span-4 flex items-center justify-between gap-3">
              <p className="text-[11px] text-muted">
                A criação é registrada na trilha de auditoria com usuário, data e hora.
              </p>
              <button type="submit" className="btn btn-primary">
                Cadastrar meta
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <Notice>
          Seu perfil possui acesso de consulta à estrutura do plano. Alterações de metas são restritas ao administrador estadual.
        </Notice>
      )}
    </div>
  );
}
